import { Injectable } from '@nestjs/common';
import * as os from 'os';
import * as process from 'process';
import { LoggerService } from '../../common/logger/logger.service';
import { MetricsService } from '../../common/metrics/metrics.service';
import { getErrorStack } from '../../common/utils/error';
import { MONITORING_THRESHOLDS } from '@equipment-management/shared-constants';
import { ClientErrorDto } from './dto/client-error.dto';

// 추적할 엔드포인트 최대 수 (메모리 누수 방지)
const MAX_TRACKED_ENDPOINTS = 500;

// UUID 패턴 (경로 정규화용)
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

// 숫자 ID 패턴 (경로 정규화용)
const NUMERIC_ID_PATTERN = /\/\d+(?=\/|$)/g;

@Injectable()
export class MonitoringService {
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

  constructor(
    private readonly logger: LoggerService,
    private readonly metricsService: MetricsService
  ) {
    this.logger.setContext('MonitoringService');

    // 최초 메트릭 수집
    this.updateMetrics();
    this.logger.log('모니터링 서비스가 초기화되었습니다.');

    // 주기적 메트릭 수집
    setInterval(() => this.updateMetrics(), this.updateInterval);
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

      // TODO: 실제 시스템 메트릭 연동 필요 — 현재 시뮬레이션 데이터
      this.metrics.storage = {
        diskUsage: 0,
        diskFree: 0,
        diskTotal: 0,
      };

      // TODO: 실제 시스템 메트릭 연동 필요 — 현재 시뮬레이션 데이터
      this.metrics.network = {
        requestsPerMinute: 0,
        errorRate: 0,
        avgResponseTime: 0,
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
    network: {
      requestsPerMinute: number;
      errorRate: number;
      avgResponseTime: number;
      isSimulated: boolean;
    };
    storage: { diskUsage: number; diskFree: number; diskTotal: number; isSimulated: boolean };
  } {
    this.logger.log('시스템 메트릭 조회');
    return {
      ...this.metrics,
      // TODO: 실제 시스템 메트릭 연동 필요 — network/storage는 시뮬레이션 데이터
      network: { ...this.metrics.network, isSimulated: true },
      storage: { ...this.metrics.storage, isSimulated: true },
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
   * 데이터베이스 진단 정보 조회
   */
  getDatabaseDiagnostics(): {
    isSimulated: boolean;
    status: string;
    version: string;
    connections: { active: number; idle: number; max: number };
    metrics: {
      connectionsCreated: number;
      connectionErrors: number;
      queriesExecuted: number;
      queriesFailed: number;
      avgQueryTime: number;
      slowQueries: number;
      queryCacheHitRate: number;
      indexUsage: number;
      deadlocks: number;
      lockWaitTime: number;
    };
    tablesInfo: { name: string; rowCount: number; size: string }[];
    replicationLag: number;
  } {
    this.logger.log('데이터베이스 진단 정보 조회');

    // TODO: 실제 시스템 메트릭 연동 필요 — 현재 시뮬레이션 데이터
    return {
      isSimulated: true,
      status: 'connected',
      version: 'PostgreSQL 15.x',
      connections: {
        active: 0,
        idle: 0,
        max: 0,
      },
      metrics: {
        connectionsCreated: 0,
        connectionErrors: 0,
        queriesExecuted: 0,
        queriesFailed: 0,
        avgQueryTime: 0,
        slowQueries: 0,
        queryCacheHitRate: 0,
        indexUsage: 0,
        deadlocks: 0,
        lockWaitTime: 0,
      },
      tablesInfo: [
        { name: 'users', rowCount: 0, size: '-' },
        { name: 'equipment', rowCount: 0, size: '-' },
        { name: 'checkouts', rowCount: 0, size: '-' },
      ],
      replicationLag: 0,
    };
  }

  /**
   * 애플리케이션 전체 건강 상태 조회
   */
  getHealthStatus(): {
    status: string;
    timestamp: string;
    services: {
      database: {
        status: string;
        isSimulated: boolean;
        metrics: {
          connectionsCreated: number;
          connectionErrors: number;
          queriesExecuted: number;
          queriesFailed: number;
          avgQueryTime: number;
        };
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
      cache: { status: string; hitRate: number; isSimulated: boolean };
    };
    lastChecked: string;
  } {
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
        database: {
          status: 'connected',
          isSimulated: true,
          metrics: {
            connectionsCreated: 0,
            connectionErrors: 0,
            queriesExecuted: 0,
            queriesFailed: 0,
            avgQueryTime: 0,
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
          hitRate: 0, // TODO: 실제 캐시 히트율 연동 필요
          isSimulated: true,
        },
      },
      lastChecked: new Date().toISOString(),
    };
  }

  /**
   * 상세 진단 정보 조회
   */
  getDiagnostics(): {
    system: {
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
    };
    database: {
      isSimulated: boolean;
      status: string;
      version: string;
      connections: { active: number; idle: number; max: number };
      metrics: {
        connectionsCreated: number;
        connectionErrors: number;
        queriesExecuted: number;
        queriesFailed: number;
        avgQueryTime: number;
        slowQueries: number;
        queryCacheHitRate: number;
        indexUsage: number;
        deadlocks: number;
        lockWaitTime: number;
      };
      tablesInfo: { name: string; rowCount: number; size: string }[];
      replicationLag: number;
    };
    http: {
      totalRequests: number;
      successRequests: number;
      errorRequests: number;
      errorRate: number;
      topEndpoints: { endpoint: string; count: number; avgResponseTime: number }[];
    };
    timestamp: string;
    env: string | undefined;
    logging: {
      counts: { error: number; warn: number; info: number; debug: number; verbose: number };
      lastErrors: never[];
    };
    performance: {
      isSimulated: boolean;
      responseTime: { avg: number; p95: number; p99: number };
      throughput: number;
    };
  } {
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
      // TODO: 실제 시스템 메트릭 연동 필요 — 현재 시뮬레이션 데이터
      performance: {
        isSimulated: true,
        responseTime: {
          avg: 0,
          p95: 0,
          p99: 0,
        },
        throughput: 0,
      },
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
