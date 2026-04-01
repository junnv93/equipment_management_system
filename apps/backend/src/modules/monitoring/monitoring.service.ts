import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as os from 'os';
import * as fs from 'fs';
import * as process from 'process';
import { LoggerService } from '../../common/logger/logger.service';
import { MetricsService } from '../../common/metrics/metrics.service';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { DrizzleService } from '../../database/drizzle.module';
import { pgPool } from '../../database/drizzle/index';
import { getErrorStack, getErrorMessage } from '../../common/utils/error';
import { MONITORING_THRESHOLDS, UUID_PATTERN_SOURCE } from '@equipment-management/shared-constants';
import { ClientErrorDto } from './dto/client-error.dto';

// UUID 패턴 (경로 정규화용)
const UUID_PATTERN = new RegExp(UUID_PATTERN_SOURCE, 'gi');

// 숫자 ID 패턴 (경로 정규화용)
const NUMERIC_ID_PATTERN = /\/\d+(?=\/|$)/g;

@Injectable()
export class MonitoringService implements OnModuleDestroy {
  // 시스템 시작 시간
  private readonly startTime = Date.now();

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

  // 메트릭 업데이트 간격 (30초)
  private readonly updateInterval = 30000;

  // 주기적 메트릭 수집 타이머 (OnModuleDestroy에서 정리)
  private metricsTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly logger: LoggerService,
    private readonly metricsService: MetricsService,
    private readonly cacheService: SimpleCacheService,
    private readonly drizzleService: DrizzleService
  ) {
    this.logger.setContext('MonitoringService');

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

      // 디스크 사용량 (fs.statfsSync)
      this.metrics.storage = this.collectDiskMetrics();

      // 네트워크 메트릭 (httpStats에서 계산)
      this.metrics.network = this.computeNetworkMetrics();

      this.logger.debug('시스템 메트릭이 업데이트되었습니다.', {
        cpuUsage: this.metrics.cpu.usage.toFixed(2) + '%',
        memoryUsage: this.metrics.memory.percentage.toFixed(2) + '%',
      });
    } catch (error) {
      this.logger.error('메트릭 업데이트 중 오류가 발생했습니다.', getErrorStack(error));
    }
  }

  /**
   * 디스크 사용량 수집 (fs.statfsSync)
   */
  private collectDiskMetrics(): { diskUsage: number; diskFree: number; diskTotal: number } {
    try {
      const stats = fs.statfsSync('/');
      const blockSize = stats.bsize;
      const total = stats.blocks * blockSize;
      const free = stats.bavail * blockSize;
      const used = total - free;
      return {
        diskTotal: total,
        diskFree: free,
        diskUsage: total > 0 ? (used / total) * 100 : 0,
      };
    } catch (error) {
      this.logger.warn(`디스크 메트릭 수집 실패: ${getErrorMessage(error)}`);
      return { diskUsage: 0, diskFree: 0, diskTotal: 0 };
    }
  }

  /**
   * 네트워크 메트릭 계산 (httpStats 기반)
   */
  private computeNetworkMetrics(): {
    requestsPerMinute: number;
    errorRate: number;
    avgResponseTime: number;
  } {
    const uptimeMinutes = this.metrics.uptime / 60;
    const requestsPerMinute = uptimeMinutes > 0 ? this.httpStats.totalRequests / uptimeMinutes : 0;

    const errorRate =
      this.httpStats.totalRequests > 0
        ? (this.httpStats.errorRequests / this.httpStats.totalRequests) * 100
        : 0;

    // 전체 응답 시간 평균
    let totalTime = 0;
    let totalCount = 0;
    this.httpStats.responseTimeByEndpoint.forEach((times) => {
      for (const t of times) {
        totalTime += t;
        totalCount++;
      }
    });
    const avgResponseTime = totalCount > 0 ? totalTime / totalCount : 0;

    return { requestsPerMinute, errorRate, avgResponseTime };
  }

  /**
   * 모든 엔드포인트의 응답 시간을 단일 배열로 수집
   */
  private collectAllResponseTimes(): number[] {
    const all: number[] = [];
    this.httpStats.responseTimeByEndpoint.forEach((times) => {
      for (const t of times) {
        all.push(t);
      }
    });
    return all;
  }

  /**
   * 정렬된 배열에서 백분위수 계산
   */
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
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
  getSystemMetrics(): {
    hostname: string;
    platform: NodeJS.Platform;
    arch: string;
    release: string;
    nodeVersion: string;
    nodeEnv: string | undefined;
    cpu: { usage: number; loadAvg: number[] };
    memory: { total: number; free: number; used: number; percentage: number };
    uptime: number;
    network: { requestsPerMinute: number; errorRate: number; avgResponseTime: number };
    storage: { diskUsage: number; diskFree: number; diskTotal: number };
  } {
    this.logger.log('시스템 메트릭 조회');
    return {
      ...this.metrics,
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
  getHttpStats(): {
    totalRequests: number;
    successRequests: number;
    errorRequests: number;
    errorRate: number;
    topEndpoints: { endpoint: string; count: number; avgResponseTime: number }[];
  } {
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
   * 데이터베이스 진단 정보 조회 (pgPool + pg_stat_database)
   */
  async getDatabaseDiagnostics(): Promise<{
    status: string;
    version: string;
    connections: { active: number; idle: number; total: number; max: number; waiting: number };
    metrics: {
      connectionsCreated: number;
      connectionErrors: number;
      xactCommit: number;
      xactRollback: number;
      blksHit: number;
      blksRead: number;
      cacheHitRatio: number;
      deadlocks: number;
    };
    tablesInfo: { name: string; rowCount: number; size: string }[];
  }> {
    this.logger.log('데이터베이스 진단 정보 조회');

    // pgPool 기본 메트릭
    const connectionMetrics = this.drizzleService.getMetrics() as {
      connectionsCreated: number;
      connectionErrors: number;
      poolTotalCount: number;
      poolIdleCount: number;
      poolWaitingCount: number;
    };

    // 기본값 (SQL 실패 시 사용)
    let version = 'PostgreSQL (unknown)';
    let dbStats = {
      xactCommit: 0,
      xactRollback: 0,
      blksHit: 0,
      blksRead: 0,
      cacheHitRatio: 0,
      deadlocks: 0,
    };
    let tablesInfo: { name: string; rowCount: number; size: string }[] = [];

    try {
      const client = await pgPool.connect();
      try {
        // PostgreSQL 버전
        const versionResult = await client.query('SELECT version()');
        version = versionResult.rows[0]?.version ?? version;

        // pg_stat_database 통계
        const statsResult = await client.query(`
          SELECT
            xact_commit, xact_rollback,
            blks_hit, blks_read,
            CASE WHEN (blks_hit + blks_read) > 0
              THEN round(blks_hit::numeric / (blks_hit + blks_read) * 100, 2)
              ELSE 0
            END AS cache_hit_ratio,
            deadlocks
          FROM pg_stat_database
          WHERE datname = current_database()
        `);
        if (statsResult.rows[0]) {
          const row = statsResult.rows[0];
          dbStats = {
            xactCommit: Number(row.xact_commit),
            xactRollback: Number(row.xact_rollback),
            blksHit: Number(row.blks_hit),
            blksRead: Number(row.blks_read),
            cacheHitRatio: Number(row.cache_hit_ratio),
            deadlocks: Number(row.deadlocks),
          };
        }

        // 주요 테이블 크기/행 수
        const tablesResult = await client.query(`
          SELECT
            relname AS name,
            n_live_tup AS row_count,
            pg_size_pretty(pg_total_relation_size(relid)) AS size
          FROM pg_stat_user_tables
          ORDER BY pg_total_relation_size(relid) DESC
          LIMIT 10
        `);
        tablesInfo = tablesResult.rows.map(
          (row: { name: string; row_count: string; size: string }) => ({
            name: row.name,
            rowCount: Number(row.row_count),
            size: row.size,
          })
        );
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.warn(`DB 진단 SQL 실패: ${getErrorMessage(error)}`);
    }

    return {
      status: pgPool.totalCount > 0 ? 'connected' : 'disconnected',
      version,
      connections: {
        active: connectionMetrics.poolTotalCount - connectionMetrics.poolIdleCount,
        idle: connectionMetrics.poolIdleCount,
        total: connectionMetrics.poolTotalCount,
        max: pgPool.options.max ?? 50,
        waiting: connectionMetrics.poolWaitingCount,
      },
      metrics: {
        connectionsCreated: connectionMetrics.connectionsCreated,
        connectionErrors: connectionMetrics.connectionErrors,
        ...dbStats,
      },
      tablesInfo,
    };
  }

  /**
   * 애플리케이션 전체 건강 상태 조회
   */
  async getHealthStatus(): Promise<{
    status: string;
    timestamp: string;
    services: {
      database: {
        status: string;
        connections: { active: number; idle: number; total: number };
      };
      system: {
        status: string;
        uptime: string;
        cpu: { usage: string; status: string };
        memory: { usage: string; status: string };
      };
      api: { status: string; totalRequests: number; errorRate: string };
      logging: {
        status: string;
        counts: { error: number; warn: number; info: number; debug: number; verbose: number };
      };
      cache: { status: string; hitRate: number; size: number };
    };
    lastChecked: string;
  }> {
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

    // DB 헬스 체크
    const dbHealth = await this.drizzleService.performHealthCheck();

    if (dbHealth.status === 'unhealthy') {
      overallStatus = 'degraded';
    }

    // 캐시 통계
    const cacheStats = this.cacheService.getCacheStats();

    const connectionMetrics = this.drizzleService.getMetrics() as {
      poolTotalCount: number;
      poolIdleCount: number;
    };

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbHealth.status === 'healthy' ? 'connected' : 'unhealthy',
          connections: {
            active: connectionMetrics.poolTotalCount - connectionMetrics.poolIdleCount,
            idle: connectionMetrics.poolIdleCount,
            total: connectionMetrics.poolTotalCount,
          },
        },
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
          hitRate: cacheStats.hitRate,
          size: cacheStats.size,
        },
      },
      lastChecked: new Date().toISOString(),
    };
  }

  /**
   * 캐시 통계 전용 조회 (경량 — DB 호출 없음)
   */
  getCacheStats(): {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    maxSize: number;
  } {
    return this.cacheService.getCacheStats();
  }

  /**
   * 상세 진단 정보 조회
   */
  async getDiagnostics(): Promise<{
    system: ReturnType<MonitoringService['getSystemMetrics']>;
    database: Awaited<ReturnType<MonitoringService['getDatabaseDiagnostics']>>;
    http: ReturnType<MonitoringService['getHttpStats']>;
    timestamp: string;
    env: string | undefined;
    logging: {
      counts: { error: number; warn: number; info: number; debug: number; verbose: number };
      lastErrors: never[];
    };
    performance: {
      responseTime: { avg: number; p95: number; p99: number };
      throughput: number;
    };
    cache: { hits: number; misses: number; hitRate: number; size: number; maxSize: number };
  }> {
    this.logger.log('상세 진단 정보 조회');

    // 응답 시간 백분위수 계산
    const allTimes = this.collectAllResponseTimes();
    allTimes.sort((a, b) => a - b);
    const avg = allTimes.length > 0 ? allTimes.reduce((s, t) => s + t, 0) / allTimes.length : 0;

    // throughput: 초당 요청 수
    const uptimeSeconds = this.metrics.uptime;
    const throughput = uptimeSeconds > 0 ? this.httpStats.totalRequests / uptimeSeconds : 0;

    return {
      system: this.getSystemMetrics(),
      database: await this.getDatabaseDiagnostics(),
      http: this.getHttpStats(),
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      logging: {
        counts: this.logCounts,
        lastErrors: [],
      },
      performance: {
        responseTime: {
          avg,
          p95: this.percentile(allTimes, 95),
          p99: this.percentile(allTimes, 99),
        },
        throughput,
      },
      cache: this.cacheService.getCacheStats(),
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
    if (this.httpStats.requestsByEndpoint.size <= MONITORING_THRESHOLDS.MAX_TRACKED_ENDPOINTS) {
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
