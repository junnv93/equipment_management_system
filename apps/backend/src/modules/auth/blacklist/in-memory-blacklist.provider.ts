import { Injectable } from '@nestjs/common';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { TokenBlacklistProvider } from './token-blacklist.interface';

const BLACKLIST_PREFIX = 'token_blacklist:';

/**
 * In-Memory 토큰 블랙리스트 Provider
 *
 * SimpleCacheService를 활용하여 TTL 기반 블랙리스트를 구현합니다.
 * 단일 인스턴스 운영 환경에 적합합니다.
 */
@Injectable()
export class InMemoryBlacklistProvider implements TokenBlacklistProvider {
  constructor(private readonly cacheService: SimpleCacheService) {}

  add(token: string, ttlMs: number): void {
    if (ttlMs > 0) {
      this.cacheService.set(`${BLACKLIST_PREFIX}${token}`, true, ttlMs);
    }
  }

  isBlacklisted(token: string): Promise<boolean> {
    return Promise.resolve(this.cacheService.get<boolean>(`${BLACKLIST_PREFIX}${token}`) === true);
  }
}
