import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ErrorCode } from '@equipment-management/schemas';
import { createRedisClient, resolveRedisConfig } from '../../../common/redis';
import { OneTimeTokenService } from '../../../common/one-time-token';
import type {
  HandoverTokenPurpose,
  IssueHandoverTokenResponse,
  VerifyHandoverTokenResponse,
} from '../dto/handover-token.dto';

/**
 * Handover 토큰 TTL — 대면 인수인계 현실 시간 10분.
 * SSOT: 이 상수가 Redis TTL + JWT exp 양쪽 기준.
 */
export const HANDOVER_TOKEN_TTL_SECONDS = 10 * 60;

const HANDOVER_JTI_PREFIX = 'handover:jti:';

interface HandoverTokenData {
  checkoutId: string;
  purpose: HandoverTokenPurpose;
}

/**
 * QR 기반 인수인계 토큰 — `OneTimeTokenService<HandoverTokenData>` 얇은 래퍼.
 *
 * 도메인 규칙(checkoutId + purpose 매핑, 응답 shape)만 담당하고
 * JWT 서명·Redis jti 소비 로직은 공통 프리미티브에 위임한다.
 */
@Injectable()
export class HandoverTokenService implements OnModuleDestroy {
  private readonly logger = new Logger(HandoverTokenService.name);
  private readonly client: Redis;
  private readonly core: OneTimeTokenService<HandoverTokenData>;

  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('HANDOVER_TOKEN_SECRET');
    if (!secret || secret.length < 32) {
      throw new Error('[HandoverTokenService] HANDOVER_TOKEN_SECRET env must be set (>= 32 chars)');
    }

    const config = resolveRedisConfig(configService);
    this.client = createRedisClient({ ...config, maxRetries: 0 }, HandoverTokenService.name);
    this.client.connect().catch((err) => {
      this.logger.error(`Redis connection error: ${String(err)}`);
    });

    this.core = new OneTimeTokenService<HandoverTokenData>({
      secret,
      redisKeyPrefix: HANDOVER_JTI_PREFIX,
      ttlSeconds: HANDOVER_TOKEN_TTL_SECONDS,
      redisClient: this.client,
      errorCodes: {
        invalid: ErrorCode.HandoverTokenInvalid,
        expired: ErrorCode.HandoverTokenExpired,
        consumed: ErrorCode.HandoverTokenConsumed,
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  async issue(
    checkoutId: string,
    userId: string,
    purpose: HandoverTokenPurpose
  ): Promise<IssueHandoverTokenResponse> {
    const { token, expiresAt } = await this.core.issue({ checkoutId, purpose }, userId);
    return { token, expiresAt, purpose };
  }

  async verify(token: string): Promise<VerifyHandoverTokenResponse> {
    const { checkoutId, purpose } = await this.core.verify(token);
    return { checkoutId, purpose };
  }
}
