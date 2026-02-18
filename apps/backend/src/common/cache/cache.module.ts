import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SimpleCacheService } from './simple-cache.service';
import { RedisCacheService } from './redis-cache.service';
import { CacheInvalidationHelper } from './cache-invalidation.helper';
import { CACHE_SERVICE } from './cache.interface';

const SIMPLE_CACHE_IMPL = 'SIMPLE_CACHE_IMPL';

/**
 * 캐시 모듈
 *
 * 토큰 오버라이드 패턴:
 *   - `SimpleCacheService` 클래스 토큰을 환경에 따라 다른 구현체로 오버라이드
 *   - 소비자는 `SimpleCacheService`를 그대로 주입 (수정 불필요)
 *   - CACHE_DRIVER=redis → 모든 소비자가 RedisCacheService 인스턴스를 받음
 *
 * 환경변수:
 *   CACHE_DRIVER=memory (기본) | redis (프로덕션 권장)
 *   REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    // 실제 구현체 인스턴스 (내부용 토큰으로 등록)
    { provide: SIMPLE_CACHE_IMPL, useClass: SimpleCacheService },
    RedisCacheService,

    // SimpleCacheService 클래스 토큰 오버라이드:
    // CACHE_DRIVER 환경변수에 따라 구현체를 선택.
    // 13개 소비자 모듈이 SimpleCacheService를 주입하면 이 팩토리 결과를 받음.
    {
      provide: SimpleCacheService,
      useFactory: (
        configService: ConfigService,
        simple: SimpleCacheService,
        redis: RedisCacheService
      ) => {
        const driver = configService.get<string>('CACHE_DRIVER');
        if (driver === 'redis') {
          return redis;
        }
        return simple;
      },
      inject: [ConfigService, SIMPLE_CACHE_IMPL, RedisCacheService],
    },

    // CACHE_SERVICE 심볼 — 신규 코드에서 사용 (useExisting으로 위 팩토리와 동일 인스턴스)
    {
      provide: CACHE_SERVICE,
      useExisting: SimpleCacheService,
    },
    CacheInvalidationHelper,
  ],
  exports: [SimpleCacheService, CACHE_SERVICE, CacheInvalidationHelper],
})
export class CacheModule {}
