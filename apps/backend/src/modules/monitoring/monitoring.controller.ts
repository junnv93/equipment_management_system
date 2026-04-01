import { Controller, Get, Post, Body, HttpCode, HttpStatus, UsePipes } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { SKIP_ALL_THROTTLES } from '../../common/config/throttle.constants';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@equipment-management/shared-constants';
import { MonitoringService } from './monitoring.service';
import { ClientErrorDto, ClientErrorPipe } from './dto/client-error.dto';

@SkipThrottle(SKIP_ALL_THROTTLES)
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  /**
   * 프론트엔드 클라이언트 에러 수집 엔드포인트
   * 인증 없이 접근 가능합니다. (에러는 로그인 전에도 발생할 수 있음)
   *
   * @AuditLog 미적용 — 다음 세 조건 중 하나라도 해당하면 적용 금지:
   *   1. @Public() 엔드포인트: req.user=undefined → AuditInterceptor graceful skip
   *   2. 고빈도 텔레메트리: 감사 로그 DB write 부하 불가
   *   3. void 응답(NO_CONTENT): entityId 추출 불가 → 감사 레코드 미생성
   * 로깅은 MonitoringService.logClientError() → NestJS Logger(구조화 로그)로 처리.
   * @see packages/schemas/src/enums/audit.ts — 감사 로그 적용 기준 SSOT
   */
  @Public()
  @Post('client-errors')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ClientErrorPipe)
  reportClientError(@Body() dto: ClientErrorDto): void {
    this.monitoringService.logClientError(dto);
  }

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
