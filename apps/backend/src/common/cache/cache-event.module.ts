import { Module } from '@nestjs/common';
import { CacheEventListener } from './cache-event-listener';

/**
 * 이벤트 기반 캐시 무효화 모듈
 *
 * CacheModule(@Global)과 분리된 이유:
 * - CacheEventListener는 EventEmitter2에 의존
 * - EventEmitterModule은 AppModule에서만 import
 * - CacheModule은 @Global()이므로 EventEmitter2 없는 테스트에서 DI 실패 방지
 *
 * AppModule에서 EventEmitterModule 뒤에 import해야 합니다.
 */
@Module({
  providers: [CacheEventListener],
})
export class CacheEventModule {}
