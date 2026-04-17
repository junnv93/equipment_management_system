import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  OnModuleDestroy,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import Redis from 'ioredis';
import { ErrorCode } from '@equipment-management/schemas';
import { createRedisClient, resolveRedisConfig } from '../../../common/redis';
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

const JTI_REDIS_PREFIX = 'handover:jti:';

interface HandoverJwtPayload {
  checkoutId: string;
  purpose: HandoverTokenPurpose;
  jti: string;
  /** issuer userId — 발급자 감사 추적. */
  iss: string;
}

/**
 * QR 기반 인수인계 토큰 서명·검증 서비스.
 *
 * ## 보안 원칙
 * 1. **JWT HS256 서명** — `HANDOVER_TOKEN_SECRET` env (JWT_SECRET 재사용 금지)
 * 2. **Redis jti nonce** — 발급 시 Redis에 jti 저장, 검증 성공 시 즉시 DEL (1회 소비)
 * 3. **TTL 10분** — JWT exp + Redis key TTL 동일하게 설정 (이중 만료)
 * 4. **issuer claim** — 발급자 userId를 iss에 기록 (감사 로그 연계)
 *
 * ## 검증 실패 분기
 * - 서명 불일치/포맷 오류 → `HANDOVER_TOKEN_INVALID` (400)
 * - exp 초과 → `HANDOVER_TOKEN_EXPIRED` (401)
 * - Redis jti 부재 (이미 소비 or TTL 초과) → `HANDOVER_TOKEN_CONSUMED` (409)
 */
@Injectable()
export class HandoverTokenService implements OnModuleDestroy {
  private readonly logger = new Logger(HandoverTokenService.name);
  private readonly client: Redis;
  private readonly jwtService: JwtService;
  private readonly secret: string;

  constructor(private readonly configService: ConfigService) {
    const secret = this.configService.get<string>('HANDOVER_TOKEN_SECRET');
    if (!secret || secret.length < 32) {
      throw new Error('[HandoverTokenService] HANDOVER_TOKEN_SECRET env must be set (>= 32 chars)');
    }
    this.secret = secret;
    // 별도 JwtService 인스턴스 — AuthModule JWT_SECRET과 완전 격리.
    this.jwtService = new JwtService({
      secret,
      signOptions: { algorithm: 'HS256' },
    });

    const config = resolveRedisConfig(this.configService);
    this.client = createRedisClient({ ...config, maxRetries: 0 }, HandoverTokenService.name);
    this.client.connect().catch((err) => {
      this.logger.error(`Redis connection error: ${String(err)}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  /**
   * 토큰 발급 + Redis jti 저장.
   *
   * @returns `{ token, expiresAt, purpose }` — 프론트엔드가 QR 렌더 + 카운트다운에 사용
   */
  async issue(
    checkoutId: string,
    userId: string,
    purpose: HandoverTokenPurpose
  ): Promise<IssueHandoverTokenResponse> {
    const jti = randomUUID();
    const expiresInSeconds = HANDOVER_TOKEN_TTL_SECONDS;
    const now = Date.now();
    const expiresAt = new Date(now + expiresInSeconds * 1000).toISOString();

    const payload: HandoverJwtPayload = {
      checkoutId,
      purpose,
      jti,
      iss: userId,
    };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: expiresInSeconds,
    });

    // Redis SET — jti 존재 = 1회 소비 가능. 검증 시 DEL로 소비.
    // SET NX로 중복 jti 방지(사실상 randomUUID라 충돌 0이지만 방어).
    const redisKey = `${JTI_REDIS_PREFIX}${jti}`;
    const result = await this.client.set(redisKey, '1', 'EX', expiresInSeconds, 'NX');
    if (result !== 'OK') {
      throw new Error('[HandoverTokenService] jti collision — retry issuance');
    }

    return { token, expiresAt, purpose };
  }

  /**
   * 토큰 검증 + jti 소비 (1회용).
   *
   * 검증 순서: JWT 서명 → jti Redis 조회 → jti DEL (atomic 소비).
   * Redis DEL이 0 반환 시 이미 다른 요청이 소비했으므로 `HANDOVER_TOKEN_CONSUMED`.
   */
  async verify(token: string): Promise<VerifyHandoverTokenResponse> {
    let payload: HandoverJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<HandoverJwtPayload>(token, {
        algorithms: ['HS256'],
      });
    } catch (err) {
      const name = (err as Error)?.name;
      if (name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          code: ErrorCode.HandoverTokenExpired,
          message: 'Handover token expired',
        });
      }
      throw new BadRequestException({
        code: ErrorCode.HandoverTokenInvalid,
        message: 'Invalid handover token',
      });
    }

    const redisKey = `${JTI_REDIS_PREFIX}${payload.jti}`;
    const deleted = await this.client.del(redisKey);
    if (deleted === 0) {
      // jti 부재: 이미 소비됐거나 TTL 초과 (jwt.verify 통과했으므로 TTL이 아직 남았음).
      throw new ConflictException({
        code: ErrorCode.HandoverTokenConsumed,
        message: 'Handover token has already been consumed',
      });
    }

    return {
      checkoutId: payload.checkoutId,
      purpose: payload.purpose,
    };
  }
}
