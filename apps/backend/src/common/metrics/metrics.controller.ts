import { Controller, Get, Header } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { SKIP_ALL_THROTTLES } from '../config/throttle.constants';
import { MetricsService } from './metrics.service';
import { Public } from '../../modules/auth/decorators/public.decorator';

@SkipThrottle(SKIP_ALL_THROTTLES)
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Prometheus 메트릭 엔드포인트
   * @Public() — Prometheus가 인증 없이 스크래핑할 수 있도록 허용
   * 외부 접근은 monitoring-network 격리 + Nginx 프록시로 차단
   */
  @Public()
  @Get()
  @Header('Content-Type', 'text/plain')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
