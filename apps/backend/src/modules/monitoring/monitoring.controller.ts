import { Controller, Get, Post, Body, HttpCode, HttpStatus, UsePipes } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { SKIP_ALL_THROTTLES, THROTTLE_PRESETS } from '../../common/config/throttle.constants';
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
   */
  @Public()
  @Throttle({ short: THROTTLE_PRESETS.CLIENT_ERROR })
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
  getMetrics() {
    return this.monitoringService.getSystemMetrics();
  }

  /**
   * 상세 진단 정보 조회 엔드포인트
   * 시스템 설정 조회 권한 필요
   */
  @RequirePermissions(Permission.VIEW_SYSTEM_SETTINGS)
  @Get('diagnostics')
  async getDiagnostics() {
    return this.monitoringService.getDiagnostics();
  }

  /**
   * 애플리케이션 건강 상태 조회 엔드포인트
   * 시스템 설정 조회 권한 필요
   */
  @RequirePermissions(Permission.VIEW_SYSTEM_SETTINGS)
  @Get('status')
  async getStatus() {
    return this.monitoringService.getHealthStatus();
  }

  /**
   * 캐시 통계 전용 조회 엔드포인트
   * DB 호출 없이 in-memory 캐시 메트릭만 반환 (경량)
   * 시스템 설정 조회 권한 필요
   */
  @RequirePermissions(Permission.VIEW_SYSTEM_SETTINGS)
  @Get('cache-stats')
  getCacheStats() {
    return this.monitoringService.getCacheStats();
  }

  /**
   * HTTP 요청 통계 조회 엔드포인트
   * 시스템 설정 조회 권한 필요
   */
  @RequirePermissions(Permission.VIEW_SYSTEM_SETTINGS)
  @Get('http-stats')
  getHttpStats() {
    return this.monitoringService.getHttpStats();
  }
}
