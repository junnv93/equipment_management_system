import { Injectable } from '@nestjs/common';
import * as os from 'os';
import * as process from 'process';
import { LoggerService } from '../../common/logger/logger.service';
import { MetricsService } from '../../common/metrics/metrics.service';
import { getErrorStack } from '../../common/utils/error';

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

      // 스토리지 정보 (실제로는 API를 통해 수집해야 함)
      // 개발 환경에서는 더미 데이터 사용
      this.metrics.storage = {
        diskUsage: 75.5,
        diskFree: 107374182400, // 100GB
        diskTotal: 429496729600, // 400GB
      };

      // 네트워크 메트릭 (실제로는 API를 통해 수집해야 함)
      // 개발 환경에서는 더미 데이터 사용
      this.metrics.network = {
        requestsPerMinute: Math.floor(Math.random() * 100) + 50,
        errorRate: Math.random() * 2,
        avgResponseTime: Math.random() * 100 + 50, // ms
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

    // 엔드포인트별 요청 수 기록
    const currentCount = this.httpStats.requestsByEndpoint.get(endpoint) || 0;
    this.httpStats.requestsByEndpoint.set(endpoint, currentCount + 1);

    // 엔드포인트별 응답 시간 기록
    const responseTimes = this.httpStats.responseTimeByEndpoint.get(endpoint) || [];
    responseTimes.push(responseTime);
    // 최대 100개까지만 보관 (메모리 사용량 제한)
    if (responseTimes.length > 100) {
      responseTimes.shift();
    }
    this.httpStats.responseTimeByEndpoint.set(endpoint, responseTimes);

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
   * 데이터베이스 진단 정보 조회
   */
  getDatabaseDiagnostics(): {
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

    // 임시로 더미 데이터 반환
    return {
      status: 'connected',
      version: 'PostgreSQL 15.x',
      connections: {
        active: 10,
        idle: 5,
        max: 50,
      },
      metrics: {
        connectionsCreated: 15,
        connectionErrors: 0,
        queriesExecuted: 1250,
        queriesFailed: 2,
        avgQueryTime: 15,
        slowQueries: 3,
        queryCacheHitRate: 0.89,
        indexUsage: 0.95,
        deadlocks: 0,
        lockWaitTime: 25, // ms
      },
      tablesInfo: [
        { name: 'users', rowCount: 125, size: '12MB' },
        { name: 'equipment', rowCount: 1458, size: '56MB' },
        { name: 'loans', rowCount: 8754, size: '120MB' }, // reservations 테이블은 loans로 통합됨
        { name: 'rentals', rowCount: 6542, size: '95MB' },
      ],
      replicationLag: 0, // ms (Primary DB)
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
      cache: { status: string; hitRate: number };
    };
    lastChecked: string;
  } {
    this.logger.log('애플리케이션 건강 상태 조회');

    // 임계치 설정
    const cpuThreshold = 90;
    const memoryThreshold = 85;
    const errorRateThreshold = 5; // 5%

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
          metrics: {
            connectionsCreated: 15,
            connectionErrors: 0,
            queriesExecuted: 1250,
            queriesFailed: 2,
            avgQueryTime: 15,
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
          hitRate: 0.93,
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
    performance: { responseTime: { avg: number; p95: number; p99: number }; throughput: number };
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
      performance: {
        responseTime: {
          avg: 120, // ms
          p95: 350, // ms
          p99: 700, // ms
        },
        throughput: 85, // requests/sec
      },
    };
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
