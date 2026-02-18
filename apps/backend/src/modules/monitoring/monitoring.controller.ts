import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@equipment-management/shared-constants';
import { MonitoringService } from './monitoring.service';

@SkipThrottle()
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  /**
   * 기본 건강 상태 확인 엔드포인트
   * 이 엔드포인트는 인증 없이 접근 가능합니다. (로드 밸런서, 모니터링 시스템 등에서 사용)
   */
  @Public()
  @Get('health')
  getHealth(): { status: string; timestamp: string; message: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Health check successful',
    };
  }

  /**
   * 시스템 메트릭 조회 엔드포인트
   * 시스템 설정 조회 권한 필요
   */
  @RequirePermissions(Permission.VIEW_SYSTEM_SETTINGS)
  @Get('metrics')
  getMetrics(): {
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
    return this.monitoringService.getSystemMetrics();
  }

  /**
   * 상세 진단 정보 조회 엔드포인트
   * 시스템 설정 조회 권한 필요
   */
  @RequirePermissions(Permission.VIEW_SYSTEM_SETTINGS)
  @Get('diagnostics')
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
    return this.monitoringService.getDiagnostics();
  }

  /**
   * 애플리케이션 건강 상태 조회 엔드포인트
   * 시스템 설정 조회 권한 필요
   */
  @RequirePermissions(Permission.VIEW_SYSTEM_SETTINGS)
  @Get('status')
  getStatus(): {
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
    return this.monitoringService.getHealthStatus();
  }

  /**
   * HTTP 요청 통계 조회 엔드포인트
   * 시스템 설정 조회 권한 필요
   */
  @RequirePermissions(Permission.VIEW_SYSTEM_SETTINGS)
  @Get('http-stats')
  getHttpStats(): {
    totalRequests: number;
    successRequests: number;
    errorRequests: number;
    errorRate: number;
    topEndpoints: { endpoint: string; count: number; avgResponseTime: number }[];
  } {
    return this.monitoringService.getHttpStats();
  }
}
