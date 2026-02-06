import { Module, Global } from '@nestjs/common';
import { SimpleCacheService } from './simple-cache.service';
import { CacheInvalidationHelper } from './cache-invalidation.helper';

@Global()
@Module({
  providers: [SimpleCacheService, CacheInvalidationHelper],
  exports: [SimpleCacheService, CacheInvalidationHelper],
})
export class CacheModule {}
