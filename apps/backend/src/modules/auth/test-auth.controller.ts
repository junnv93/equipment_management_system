import { Controller, Get, Post, Body, Query, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import { randomUUID } from 'crypto';
import { DEFAULT_ROLE_EMAILS, ALL_TEST_EMAILS } from '@equipment-management/shared-constants';
import { THROTTLE_PRESETS } from '../../common/config/throttle.constants';
import { AuthService, AuthResponse } from './auth.service';
import { Public } from './decorators/public.decorator';
import { SkipPermissions } from './decorators/skip-permissions.decorator';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';

/**
 * 테스트 전용 Auth 컨트롤러
 *
 * ⚠️ 이 컨트롤러는 개발/테스트 환경에서만 AuthModule에 등록됩니다.
 * app.module.ts 또는 auth.module.ts에서 NODE_ENV 조건부로 controllers에 포함됩니다.
 * 프로덕션에서는 라우트 자체가 존재하지 않습니다.
 *
 * @see AuthModule — NODE_ENV !== 'production' 시에만 controllers에 포함
 */
@Controller('auth')
export class TestAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cacheService: SimpleCacheService,
    private readonly configService: ConfigService
  ) {}

  /**
   * 테스트 전용 헬스체크 엔드포인트
   * E2E 테스트에서 백엔드 접근 가능 여부를 확인할 때 사용됩니다.
   */
  @Get('test')
  @Public()
  @SkipPermissions()
  testHealthCheck(): { message: string; timestamp: number } {
    return {
      message: 'Backend API is accessible',
      timestamp: Date.now(),
    };
  }

  /**
   * 테스트 전용 로그인 엔드포인트
   * E2E 테스트에서 사용됩니다.
   *
   * @param role - (레거시) 테스트 사용자의 역할
   * @param email - (권장) 테스트 사용자의 이메일 주소
   * @returns JWT 토큰을 포함한 인증 정보
   */
  @Get('test-login')
  @Public()
  @SkipPermissions()
  @Throttle({ short: THROTTLE_PRESETS.TEST_LOGIN })
  async testLogin(
    @Query('role') role?: string,
    @Query('email') email?: string
  ): Promise<AuthResponse> {
    if (email) {
      if (!ALL_TEST_EMAILS.includes(email)) {
        throw new ForbiddenException(
          `Not a test user email: ${email}. Use one of: ${ALL_TEST_EMAILS.join(', ')}`
        );
      }
      return this.authService.generateTestTokenByEmail(email);
    }

    if (!role) {
      throw new ForbiddenException('Either role or email parameter is required');
    }

    // SSOT: shared-constants에서 역할 → 이메일 매핑
    const resolvedEmail = DEFAULT_ROLE_EMAILS[role];
    if (!resolvedEmail) {
      const validRoles = Object.keys(DEFAULT_ROLE_EMAILS).join(', ');
      throw new ForbiddenException(`Invalid role: ${role}. Valid roles: ${validRoles}`);
    }

    return this.authService.generateTestTokenByEmail(resolvedEmail);
  }

  /**
   * 테스트 전용 캐시 초기화 엔드포인트
   * E2E 테스트에서 DB를 직접 리셋한 후 백엔드 인메모리 캐시를 무효화할 때 사용합니다.
   */
  @Post('test-cache-clear')
  @Public()
  @SkipPermissions()
  testCacheClear(): { cleared: boolean; message: string } {
    // Fail-closed: NODE_ENV 미설정/빈값 시 'production'으로 간주 → 차단
    const env = (process.env.NODE_ENV || 'production').trim().toLowerCase();
    if (env !== 'development' && env !== 'test') {
      throw new ForbiddenException(
        'Cache clear is only available in development/test environments'
      );
    }

    const size = this.cacheService.size();
    this.cacheService.clear();

    return {
      cleared: true,
      message: `Cleared ${size} cache entries`,
    };
  }

  /**
   * [TEST ONLY] 만료된 handover 서명 토큰 강제 발급 — E2E 토큰 만료 시나리오 전용.
   *
   * 보안 가드:
   * - NODE_ENV !== production 체크 (프로덕션에서 403)
   * - TestAuthController 자체가 AuthModule에 production 시 미등록 (기본 정책)
   * - Body에 checkoutId + expSecondsAgo(과거 경과 초) 명시. jti는 랜덤 발급.
   *
   * 실제 HandoverTokenService.issue()는 미래 exp로만 발급 가능하므로 테스트에서는
   * HANDOVER_TOKEN_SECRET을 직접 읽어 과거 exp로 sign.
   */
  @Post('forge-handover-token')
  @Public()
  @SkipPermissions()
  async forgeHandoverToken(
    @Body() body: { checkoutId?: string; expSecondsAgo?: number }
  ): Promise<{ token: string; note: string }> {
    // Fail-closed: NODE_ENV 미설정/빈값 시 'production'으로 간주 → 차단
    const env = (process.env.NODE_ENV || 'production').trim().toLowerCase();
    if (env !== 'development' && env !== 'test') {
      throw new ForbiddenException('forge-handover-token is only available in dev/test');
    }

    const checkoutId = body?.checkoutId;
    if (!checkoutId) {
      throw new ForbiddenException('checkoutId is required');
    }
    const expSecondsAgo = Math.max(1, Number(body?.expSecondsAgo ?? 60));

    const secret = this.configService.get<string>('HANDOVER_TOKEN_SECRET');
    if (!secret) {
      throw new ForbiddenException('HANDOVER_TOKEN_SECRET not configured');
    }

    const jwt = new JwtService({
      secret,
      signOptions: { algorithm: 'HS256' },
    });
    const nowSec = Math.floor(Date.now() / 1000);
    const expiredPayload = {
      checkoutId,
      purpose: 'borrower_receive' as const,
      jti: randomUUID(),
      iss: 'test-auth-forge',
      iat: nowSec - expSecondsAgo - 10,
      exp: nowSec - expSecondsAgo, // 과거 exp → jwt.verify가 TokenExpiredError
    };

    const token = await jwt.signAsync(expiredPayload, { noTimestamp: true });
    return {
      token,
      note: `Expired handover token forged — exp=${expSecondsAgo}s ago. Dev/test only.`,
    };
  }
}
