import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SystemHealthRedisRateLimiterService } from './system-health-redis-rate-limiter.service';
import { SYSTEM_HEALTH_RATE_LIMITER } from './contract';

/**
 * SystemHealthModule — rate limiter DI 등록.
 *
 * DashboardModule 이 import — `@Global()` 불필요 (dashboard scope 한정).
 * MetricsModule 은 DashboardModule 이 이미 import 하므로 여기서 중복 import 없음.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    SystemHealthRedisRateLimiterService,
    { provide: SYSTEM_HEALTH_RATE_LIMITER, useExisting: SystemHealthRedisRateLimiterService },
  ],
  exports: [SYSTEM_HEALTH_RATE_LIMITER],
})
export class SystemHealthModule {}
