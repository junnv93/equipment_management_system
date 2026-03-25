import { Controller, Get, Post, Query, ForbiddenException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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
    private readonly cacheService: SimpleCacheService
  ) {}

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
    // staging 환경 보호: development/test에서만 캐시 클리어 허용
    const env = process.env.NODE_ENV;
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
}
