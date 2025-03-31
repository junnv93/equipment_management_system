import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { MonitoringService } from './monitoring.service';

@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}
  
  /**
   * 기본 건강 상태 확인 엔드포인트
   * 이 엔드포인트는 인증 없이 접근 가능합니다. (로드 밸런서, 모니터링 시스템 등에서 사용)
   */
  @Public()
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Health check successful'
    };
  }
  
  /**
   * 시스템 메트릭 조회 엔드포인트
   */
  @Get('metrics')
  getMetrics() {
    return this.monitoringService.getSystemMetrics();
  }
  
  /**
   * 상세 진단 정보 조회 엔드포인트
   */
  @Get('diagnostics')
  getDiagnostics() {
    return this.monitoringService.getDiagnostics();
  }
  
  /**
   * 애플리케이션 건강 상태 조회 엔드포인트
   */
  @Get('status')
  getStatus() {
    return this.monitoringService.getHealthStatus();
  }
  
  /**
   * HTTP 요청 통계 조회 엔드포인트
   */
  @Get('http-stats')
  getHttpStats() {
    return this.monitoringService.getHttpStats();
  }
} 