import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import type Redis from 'ioredis';
import { ErrorCode } from '@equipment-management/schemas';

export interface OneTimeTokenOptions {
  /** HS256 서명 키 */
  secret: string;
  /** Redis 키 prefix (예: 'handover:jti:') */
  redisKeyPrefix: string;
  /** 토큰 유효 초 — JWT exp + Redis TTL 동시 적용 */
  ttlSeconds: number;
  /** 외부에서 주입된 Redis 클라이언트 (라이프사이클은 호출자 책임) */
  redisClient: Redis;
  /**
   * HTTP 오류 응답에 담길 error code 오버라이드.
   * 미지정 시 HandoverToken* 기본값 사용.
   */
  errorCodes?: {
    invalid?: string;
    expired?: string;
    consumed?: string;
  };
}

export interface OneTimeTokenResult {
  token: string;
  /** ISO 8601 — 프론트엔드 카운트다운용 */
  expiresAt: string;
}

interface OneTimeTokenJwtPayload<T> {
  /** 도메인 페이로드 */
  data: T;
  jti: string;
  /** 발급자 userId — 감사 추적 */
  iss: string;
}

/**
 * 범용 1회용 JWT + Redis jti nonce 서비스.
 *
 * ## 보안 원칙
 * 1. HS256 서명 — `secret`은 호출자가 환경변수에서 주입
 * 2. Redis jti nonce — 발급 시 SET NX, 검증 성공 시 즉시 DEL (1회 소비)
 * 3. JWT exp + Redis TTL 이중 만료로 TTL 드리프트 방지
 *
 * ## 사용법
 * ```typescript
 * const core = new OneTimeTokenService<MyPayload>({ secret, redisKeyPrefix: 'my:jti:', ttlSeconds: 600, redisClient });
 * const { token, expiresAt } = await core.issue({ ...payload }, userId);
 * const data = await core.verify(token);
 * ```
 *
 * NestJS `@Injectable()` 없이 평범한 클래스로 설계 — 소유자 서비스가 인스턴스를 직접 관리.
 */
export class OneTimeTokenService<T extends object> {
  private readonly jwtService: JwtService;

  constructor(private readonly options: OneTimeTokenOptions) {
    this.jwtService = new JwtService({
      secret: options.secret,
      signOptions: { algorithm: 'HS256' },
    });
  }

  async issue(data: T, issuerId: string): Promise<OneTimeTokenResult> {
    const jti = randomUUID();
    const { ttlSeconds, redisKeyPrefix, redisClient } = this.options;

    const payload: OneTimeTokenJwtPayload<T> = { data, jti, iss: issuerId };
    const token = await this.jwtService.signAsync(payload, { expiresIn: ttlSeconds });

    const result = await redisClient.set(`${redisKeyPrefix}${jti}`, '1', 'EX', ttlSeconds, 'NX');
    if (result !== 'OK') {
      throw new Error('[OneTimeTokenService] jti collision — retry issuance');
    }

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    return { token, expiresAt };
  }

  async verify(token: string): Promise<T> {
    const { redisKeyPrefix, redisClient } = this.options;
    const codes = this.options.errorCodes ?? {};

    let payload: OneTimeTokenJwtPayload<T>;
    try {
      payload = await this.jwtService.verifyAsync<OneTimeTokenJwtPayload<T>>(token, {
        algorithms: ['HS256'],
      });
    } catch (err) {
      if ((err as Error)?.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          code: codes.expired ?? ErrorCode.HandoverTokenExpired,
          message: 'Token expired',
        });
      }
      throw new BadRequestException({
        code: codes.invalid ?? ErrorCode.HandoverTokenInvalid,
        message: 'Invalid token',
      });
    }

    const deleted = await redisClient.del(`${redisKeyPrefix}${payload.jti}`);
    if (deleted === 0) {
      throw new ConflictException({
        code: codes.consumed ?? ErrorCode.HandoverTokenConsumed,
        message: 'Token has already been consumed',
      });
    }

    return payload.data;
  }
}
