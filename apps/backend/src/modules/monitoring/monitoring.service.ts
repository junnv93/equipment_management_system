import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as os from 'os';
import * as process from 'process';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { sql } from 'drizzle-orm';
import { LoggerService } from '../../common/logger/logger.service';
import { MetricsService } from '../../common/metrics/metrics.service';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { DrizzleService } from '../../database/drizzle.module';
import { getErrorStack } from '../../common/utils/error';
import { MONITORING_THRESHOLDS, UUID_PATTERN_SOURCE } from '@equipment-management/shared-constants';
import type {
  DatabaseDiagnostics,
  HealthStatus,
  HttpStats,
  CacheStats,
  SystemDiagnostics,
  SystemMetrics,
} from '@equipment-management/schemas';
import { ClientErrorDto } from './dto/client-error.dto';

const execFileAsync = promisify(execFile);

// 추적할 엔드포인트 최대 수 (SSOT: shared-constants)
const MAX_TRACKED_ENDPOINTS = MONITORING_THRESHOLDS.MAX_TRACKED_ENDPOINTS;

// UUID 패턴 (경로 정규화용)
const UUID_PATTERN = new RegExp(UUID_PATTERN_SOURCE, 'gi');

// 숫자 ID 패턴 (경로 정규화용)
const NUMERIC_ID_PATTERN = /\/\d+(?=\/|$)/g;

@Injectable()
export class MonitoringService implements OnModuleDestroy {
  // 시스템 시작 시간
  private readonly startTime = Date.now();

  // PostgreSQL 버전 (동적 조회 + 캐시)
  private dbVersion = 'PostgreSQL (unknown)';

  // 최근 메트릭 정보
  private metrics = {
    cpu: {
      usage: 0,
      loadAvg: [0, 0, 0],
    },
    memory: {
      total: 0,
      free: 0,
      used: 0,
      percentage: 0,
    },
    uptime: 0,
    network: {
      requestsPerMinute: 0,
      errorRate: 0,
      avgResponseTime: 0,
    },
    storage: {
      diskUsage: 0,
      diskFree: 0,
      diskTotal: 0,
    },
  };

  // 로그 레벨별 카운터
  private logCounts = {
    error: 0,
    warn: 0,
    info: 0,
    debug: 0,
    verbose: 0,
  };

  // HTTP 요청 통계
  private httpStats = {
    totalRequests: 0,
    successRequests: 0,
    errorRequests: 0,
    requestsByEndpoint: new Map<string, number>(),
    responseTimeByEndpoint: new Map<string, number[]>(),
  };

  // 메트릭 업데이트 간격 (SSOT: shared-constants)
  private readonly updateInterval = MONITORING_THRESHOLDS.METRICS_UPDATE_INTERVAL_MS;

  // 주기적 메트릭 수집 타이머 (OnModuleDestroy에서 정리)
  private metricsTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly logger: LoggerService,
    private readonly metricsService: MetricsService,
    private readonly cacheService: SimpleCacheService,
    private readonly drizzleService: DrizzleService
  ) {
    this.logger.setContext('MonitoringService');

    // DB 버전 조회 (비동기, 캐시)
    this.fetchDbVersion();

    // 최초 메트릭 수집
    this.updateMetrics();
    this.logger.log('모니터링 서비스가 초기화되었습니다.');

    // 주기적 메트릭 수집 (.unref: 이 타이머가 종료를 막지 않도록)
    this.metricsTimer = setInterval(() => this.updateMetrics(), this.updateInterval).unref();
  }

  onModuleDestroy(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = null;
    }
  }

  /**
   * 시스템 메트릭 업데이트
   */
  private updateMetrics(): void {
    try {
      // CPU 사용량 계산
      const cpus = os.cpus();
      const totalCpu = cpus.reduce((acc, cpu) => {
        return acc + Object.values(cpu.times).reduce((sum, time) => sum + time, 0);
      }, 0);
      const idleCpu = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
      this.metrics.cpu.usage = 100 - (idleCpu / totalCpu) * 100;
      this.metrics.cpu.loadAvg = os.loadavg();

      // 메모리 사용량 계산
      this.metrics.memory.total = os.totalmem();
      this.metrics.memory.free = os.freemem();
      this.metrics.memory.used = this.metrics.memory.total - this.metrics.memory.free;
      this.metrics.memory.percentage = (this.metrics.memory.used / this.metrics.memory.total) * 100;

      // 업타임 계산
      this.metrics.uptime = (Date.now() - this.startTime) / 1000;

      // 디스크 사용량: 비동기 df 명령으로 루트 파티션 정보 조회
      this.updateDiskMetrics();

      // 네트워크 메트릭: HTTP 추적 데이터에서 계산
      const uptimeMinutes = this.metrics.uptime / 60;
      this.metrics.network = {
        requestsPerMinute: uptimeMinutes > 0 ? this.httpStats.totalRequests / uptimeMinutes : 0,
        errorRate:
          this.httpStats.totalRequests > 0
            ? (this.httpStats.errorRequests / this.httpStats.totalRequests) * 100
            : 0,
        avgResponseTime: this.calculateAvgResponseTime(),
      };

      this.logger.debug('시스템 메트릭이 업데이트되었습니다.', {
        cpuUsage: this.metrics.cpu.usage.toFixed(2) + '%',
        memoryUsage: this.metrics.memory.percentage.toFixed(2) + '%',
      });
    } catch (error) {
      this.logger.error('메트릭 업데이트 중 오류가 발생했습니다.', getErrorStack(error));
    }
  }

  /**
   * 프론트엔드 클라이언트 에러 구조화 로깅
   */
  logClientError(dto: ClientErrorDto): void {
    this.logger.error('클라이언트 에러 수신', undefined, {
      message: dto.message,
      component: dto.component,
      url: dto.url,
      userAgent: dto.userAgent,
      timestamp: dto.timestamp,
      ...(dto.stack ? { stack: dto.stack } : {}),
    });
  }

  /**
   * 로그 레벨별 카운트 증가
   */
  incrementLogCount(level: keyof typeof this.logCounts): void {
    if (this.logCounts[level] !== undefined) {
      this.logCounts[level]++;
    }
  }

  /**
   * HTTP 요청 통계 기록
   */
  recordHttpRequest(endpoint: string, statusCode: number, responseTime: number): void {
    this.httpStats.totalRequests++;

    if (statusCode >= 200 && statusCode < 400) {
      this.httpStats.successRequests++;
    } else {
      this.httpStats.errorRequests++;
    }

    // 경로 정규화 (UUID, 숫자 ID → :id 플레이스홀더)
    const normalizedEndpoint = this.normalizeEndpointPath(endpoint);

    // 엔드포인트별 요청 수 기록
    const currentCount = this.httpStats.requestsByEndpoint.get(normalizedEndpoint) || 0;
    this.httpStats.requestsByEndpoint.set(normalizedEndpoint, currentCount + 1);

    // 엔드포인트별 응답 시간 기록
    const responseTimes = this.httpStats.responseTimeByEndpoint.get(normalizedEndpoint) || [];
    responseTimes.push(responseTime);
    // 최대 100개까지만 보관 (메모리 사용량 제한)
    if (responseTimes.length > 100) {
      responseTimes.shift();
    }
    this.httpStats.responseTimeByEndpoint.set(normalizedEndpoint, responseTimes);

    // Map 크기 제한 적용
    this.enforceEndpointMapLimit();

    // Prometheus 메트릭 기록
    this.metricsService.incrementHttpRequestTotal('ALL', endpoint, statusCode.toString());
    this.metricsService.observeHttpRequestDuration(
      'ALL',
      endpoint,
      statusCode.toString(),
      responseTime / 1000 // 초 단위로 변환
    );
  }

  /**
   * 시스템 메트릭 조회
   */
  getSystemMetrics(): SystemMetrics {
    this.logger.log('시스템 메트릭 조회');
    const storageIsSimulated = this.metrics.storage.diskTotal === 0;
    return {
      ...this.metrics,
      network: { ...this.metrics.network, isSimulated: false },
      storage: { ...this.metrics.storage, isSimulated: storageIsSimulated },
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      nodeVersion: process.version,
      nodeEnv: process.env.NODE_ENV,
    };
  }

  /**
   * HTTP 요청 통계 조회
   */
  getHttpStats(): HttpStats {
    // 엔드포인트별 평균 응답 시간 계산
    const avgResponseTimes = new Map<string, number>();
    this.httpStats.responseTimeByEndpoint.forEach((times, endpoint) => {
      if (times.length > 0) {
        const sum = times.reduce((acc, time) => acc + time, 0);
        avgResponseTimes.set(endpoint, sum / times.length);
      }
    });

    // 요청 수 기준 상위 5개 엔드포인트
    const topEndpoints = [...this.httpStats.requestsByEndpoint.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([endpoint, count]) => ({
        endpoint,
        count,
        avgResponseTime: avgResponseTimes.get(endpoint) || 0,
      }));

    return {
      totalRequests: this.httpStats.totalRequests,
      successRequests: this.httpStats.successRequests,
      errorRequests: this.httpStats.errorRequests,
      errorRate:
        this.httpStats.totalRequests > 0
          ? (this.httpStats.errorRequests / this.httpStats.totalRequests) * 100
          : 0,
      topEndpoints,
    };
  }

  /**
   * 캐시 통계 조회 (SimpleCacheService 위임)
   */
  getCacheStats(): CacheStats {
    return this.cacheService.getCacheStats();
  }

  /**
   * 데이터베이스 진단 정보 조회
   *
   * 미측정 필드(`avgQueryTime`, `slowQueries`, `queryCacheHitRate`, `indexUsage`,
   * `deadlocks`, `lockWaitTime`, `replicationLag`) 는 `null` 로 반환.
   * pg Pool 레벨에서는 측정 불가 — `pg_stat_statements` 등 확장 필요.
   */
  getDatabaseDiagnostics(): DatabaseDiagnostics {
    this.logger.log('데이터베이스 진단 정보 조회');

    const poolMetrics = this.drizzleService.getMetrics();

    return {
      isSimulated: false,
      status: 'connected',
      version: this.dbVersion,
      connections: {
        active: poolMetrics.poolTotalCount - poolMetrics.poolIdleCount,
        idle: poolMetrics.poolIdleCount,
        max: poolMetrics.poolTotalCount,
      },
      metrics: {
        // 실제 Pool 메트릭 (pg Pool 이벤트 기반)
        connectionsCreated: poolMetrics.connectionsCreated,
        connectionErrors: poolMetrics.connectionErrors,
        /**
         * `connectionsAcquired` ≈ 쿼리 실행 근사치 — Pool `acquire` 이벤트 카운트.
         * 정확한 쿼리 카운트는 `pg_stat_statements.calls` 필요.
         * TODO(tech-debt): 필드명을 `connectionsAcquired` 로 rename — i18n/dashboard 연쇄
         */
        queriesExecuted: poolMetrics.connectionsAcquired,
        queriesFailed: poolMetrics.connectionErrors,
        // 아래 필드들은 pg Pool 에서 측정 불가 — null 로 "미측정" 명시
        avgQueryTime: null,
        slowQueries: null,
        queryCacheHitRate: null,
        indexUsage: null,
        deadlocks: null,
        lockWaitTime: null,
      },
      tablesInfo: [],
      replicationLag: null,
    };
  }

  /**
   * 애플리케이션 전체 건강 상태 조회
   */
  getHealthStatus(): HealthStatus {
    this.logger.log('애플리케이션 건강 상태 조회');

    // 임계치 설정
    const cpuThreshold = MONITORING_THRESHOLDS.CPU_PERCENT;
    const memoryThreshold = MONITORING_THRESHOLDS.MEMORY_PERCENT;
    const errorRateThreshold = MONITORING_THRESHOLDS.ERROR_RATE_PERCENT;

    // 현재 상태에 따른 건강 상태 판단
    const isCpuCritical = this.metrics.cpu.usage > cpuThreshold;
    const isMemoryCritical = this.metrics.memory.percentage > memoryThreshold;

    // HTTP 에러율 계산
    const errorRate =
      this.httpStats.totalRequests > 0
        ? (this.httpStats.errorRequests / this.httpStats.totalRequests) * 100
        : 0;
    const isErrorRateCritical = errorRate > errorRateThreshold;

    // 전체 건강 상태 결정
    let overallStatus = 'healthy';
    if (isCpuCritical || isMemoryCritical || isErrorRateCritical) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        database: (() => {
          const poolMetrics = this.drizzleService.getMetrics();
          return {
            status: 'connected',
            isSimulated: false,
            metrics: {
              connectionsCreated: poolMetrics.connectionsCreated,
              connectionErrors: poolMetrics.connectionErrors,
              // connectionsAcquired ≈ 쿼리 근사치 (pg Pool acquire 이벤트)
              queriesExecuted: poolMetrics.connectionsAcquired,
              queriesFailed: poolMetrics.connectionErrors,
              // pg Pool 레벨에서 측정 불가 → null (미측정)
              avgQueryTime: null,
            },
          };
        })(),
        system: {
          status: isCpuCritical || isMemoryCritical ? 'overloaded' : 'running',
          uptime: this.formatUptime(this.metrics.uptime),
          cpu: {
            usage: this.metrics.cpu.usage.toFixed(2) + '%',
            status: isCpuCritical ? 'critical' : 'normal',
          },
          memory: {
            usage: this.metrics.memory.percentage.toFixed(2) + '%',
            status: isMemoryCritical ? 'critical' : 'normal',
          },
        },
        api: {
          status: isErrorRateCritical ? 'degraded' : 'operational',
          totalRequests: this.httpStats.totalRequests,
          errorRate: errorRate.toFixed(2) + '%',
        },
        logging: {
          status: 'operational',
          counts: this.logCounts,
        },
        cache: {
          status: 'operational',
          hitRate: this.cacheService.getCacheStats().hitRate,
        },
      },
      lastChecked: new Date().toISOString(),
    };
  }

  /**
   * 상세 진단 정보 조회
   */
  getDiagnostics(): SystemDiagnostics {
    this.logger.log('상세 진단 정보 조회');
    return {
      system: this.getSystemMetrics(),
      database: this.getDatabaseDiagnostics(),
      http: this.getHttpStats(),
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      logging: {
        counts: this.logCounts,
        lastErrors: [], // 실제로는 최근 오류 로그 정보 포함
      },
      performance: {
        isSimulated: false,
        responseTime: {
          avg: this.calculateAvgResponseTime(),
          p95: 0,
          p99: 0,
        },
        throughput: this.metrics.network.requestsPerMinute,
      },
      cache: this.getCacheStats(),
    };
  }

  /**
   * 엔드포인트 경로 정규화 (UUID, 숫자 ID → :id)
   * 동적 경로 세그먼트를 플레이스홀더로 치환하여 Map 키 폭발 방지
   */
  private normalizeEndpointPath(path: string): string {
    return path.replace(UUID_PATTERN, ':id').replace(NUMERIC_ID_PATTERN, '/:id');
  }

  /**
   * Map 크기 제한 — 초과 시 요청 수가 가장 적은 엔트리 제거
   */
  private enforceEndpointMapLimit(): void {
    if (this.httpStats.requestsByEndpoint.size <= MAX_TRACKED_ENDPOINTS) {
      return;
    }

    // 요청 수가 가장 적은 엔트리 찾기
    let minKey: string | null = null;
    let minCount = Infinity;
    for (const [key, count] of this.httpStats.requestsByEndpoint) {
      if (count < minCount) {
        minCount = count;
        minKey = key;
      }
    }

    if (minKey !== null) {
      this.httpStats.requestsByEndpoint.delete(minKey);
      this.httpStats.responseTimeByEndpoint.delete(minKey);
    }
  }

  /**
   * DB 버전을 비동기로 조회하여 캐시 (시작 시 한 번만 실행)
   */
  private async fetchDbVersion(): Promise<void> {
    try {
      const db = this.drizzleService.getDB();
      const result = await db.execute(sql`SELECT version()`);
      const raw = (result.rows?.[0] as { version?: string })?.version;
      if (raw) {
        const match = raw.match(/^PostgreSQL\s+[\d.]+/);
        this.dbVersion = match ? match[0] : raw.split(' on ')[0];
      }
    } catch {
      // DB 연결 실패 시 기본값 유지
    }
  }

  /**
   * 디스크 사용량 비동기 업데이트 (이벤트 루프 차단 방지)
   */
  private async updateDiskMetrics(): Promise<void> {
    try {
      const { stdout } = await execFileAsync('df', ['-B1', '/']);
      const lines = stdout.trim().split('\n');
      const parts = lines[lines.length - 1].trim().split(/\s+/);
      if (parts.length >= 4) {
        const total = parseInt(parts[1], 10) || 0;
        const used = parseInt(parts[2], 10) || 0;
        const free = parseInt(parts[3], 10) || 0;
        this.metrics.storage = { diskUsage: used, diskFree: free, diskTotal: total };
      }
    } catch {
      // df 실패 시 (Windows 등) 기존 값 유지
    }
  }

  /**
   * HTTP 응답 시간 전체 평균 계산
   */
  private calculateAvgResponseTime(): number {
    let totalTime = 0;
    let totalCount = 0;
    this.httpStats.responseTimeByEndpoint.forEach((times) => {
      times.forEach((t) => {
        totalTime += t;
        totalCount++;
      });
    });
    return totalCount > 0 ? totalTime / totalCount : 0;
  }

  /**
   * 업타임 포맷팅
   */
  private formatUptime(uptime: number): string {
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor(((uptime % 86400) % 3600) / 60);
    const seconds = Math.floor(((uptime % 86400) % 3600) % 60);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
}
