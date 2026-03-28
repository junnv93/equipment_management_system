import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Redis 연결 설정 (SSOT)
 *
 * resolveRedisConfig()가 환경변수에서 해석한 결과를 담습니다.
 * createRedisClient()의 입력으로 사용됩니다.
 */
export interface RedisConnectionConfig {
  /** redis:// 또는 rediss:// URL (설정 시 host/port/password 무시) */
  redisUrl?: string;
  host: string;
  port: number;
  password?: string;
  tlsEnabled: boolean;
  tlsRejectUnauthorized: boolean;
  /**
   * 재시도 횟수.
   * - 0: retryStrategy 미설정 (ioredis 기본 재시도)
   * - N > 0: N회 실패 후 중단 (RedisCacheService 패턴)
   */
  maxRetries: number;
}

/**
 * Redis 환경변수를 한 곳에서 해석 (SSOT)
 *
 * 모든 Redis 소비자(RedisCacheService, RedisBlacklistProvider)는
 * 이 함수를 통해 동일한 환경변수를 동일한 방식으로 해석합니다.
 */
export function resolveRedisConfig(configService: ConfigService): RedisConnectionConfig {
  return {
    redisUrl: configService.get<string>('REDIS_URL'),
    host: configService.get<string>('REDIS_HOST') || 'localhost',
    port: configService.get<number>('REDIS_PORT') || 6379,
    password: configService.get<string>('REDIS_PASSWORD'),
    tlsEnabled: configService.get<string>('REDIS_TLS') === 'true',
    tlsRejectUnauthorized: configService.get<string>('REDIS_TLS_REJECT_UNAUTHORIZED') !== 'false',
    maxRetries: 0,
  };
}

/**
 * Redis 클라이언트 생성 팩토리
 *
 * REDIS_URL과 개별 옵션 분기, TLS 설정, 재시도 전략을 통일합니다.
 * 각 서비스는 독립적인 클라이언트 인스턴스를 소유하며 자체 라이프사이클을 관리합니다.
 */
export function createRedisClient(config: RedisConnectionConfig, loggerName: string): Redis {
  const logger = new Logger(loggerName);

  const tlsConfig = config.tlsEnabled
    ? { rejectUnauthorized: config.tlsRejectUnauthorized }
    : undefined;

  const retryStrategy =
    config.maxRetries > 0
      ? (times: number): number | null => {
          if (times > config.maxRetries) {
            logger.error(`Redis connection failed after ${config.maxRetries} retries`);
            return null;
          }
          return Math.min(times * 100, 3000);
        }
      : undefined;

  const sharedOptions = {
    tls: tlsConfig,
    lazyConnect: true as const,
    ...(retryStrategy ? { retryStrategy } : {}),
  };

  const client = config.redisUrl
    ? new Redis(config.redisUrl, sharedOptions)
    : new Redis({
        host: config.host,
        port: config.port,
        password: config.password,
        ...sharedOptions,
      });

  return client;
}
