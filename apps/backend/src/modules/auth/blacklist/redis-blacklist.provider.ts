import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { TokenBlacklistProvider } from './token-blacklist.interface';

const BLACKLIST_PREFIX = 'token_blacklist:';

/**
 * Redis 기반 토큰 블랙리스트 Provider
 *
 * 다중 인스턴스 운영 환경(수평 확장)에서 모든 서버가 공유하는 블랙리스트를 제공합니다.
 * 서버 재시작 후에도 블랙리스트가 유지됩니다.
 *
 * 환경변수:
 *   REDIS_URL (redis://host:port) 또는
 *   REDIS_HOST + REDIS_PORT + REDIS_PASSWORD
 */
@Injectable()
export class RedisBlacklistProvider implements TokenBlacklistProvider, OnModuleDestroy {
  private readonly logger = new Logger(RedisBlacklistProvider.name);
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.client = redisUrl
      ? new Redis(redisUrl, { lazyConnect: true })
      : new Redis({
          host: this.configService.get<string>('REDIS_HOST') || 'localhost',
          port: this.configService.get<number>('REDIS_PORT') || 6379,
          password: this.configService.get<string>('REDIS_PASSWORD'),
          lazyConnect: true,
        });

    this.client.connect().catch((err) => {
      this.logger.error(`Redis blacklist connection error: ${String(err)}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  /**
   * 토큰 등록 — fire-and-forget (로그아웃 응답을 블로킹하지 않음)
   * Redis 장애 시 토큰이 남아있어도 TTL 만료(최대 15분)로 자연 소멸
   */
  add(token: string, ttlMs: number): void {
    if (ttlMs <= 0) return;
    const ttlSeconds = Math.ceil(ttlMs / 1000);
    void this.client.set(`${BLACKLIST_PREFIX}${token}`, '1', 'EX', ttlSeconds).catch((err) => {
      this.logger.error(`Failed to blacklist token: ${String(err)}`);
    });
  }

  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const result = await this.client.get(`${BLACKLIST_PREFIX}${token}`);
      return result === '1';
    } catch (err) {
      // Redis 장애 시 fail-open (토큰을 유효로 처리) — fail-closed보다 가용성 우선
      // 장비 관리 시스템 특성상 서비스 중단이 보안 위험보다 비용이 큼
      this.logger.error(`Redis blacklist check failed, failing open: ${String(err)}`);
      return false;
    }
  }
}
