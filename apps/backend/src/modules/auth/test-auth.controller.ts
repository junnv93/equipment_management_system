import { Controller, Get, Post, Query, ForbiddenException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserRoleValues } from '@equipment-management/schemas';
import { THROTTLE_PRESETS } from '../../common/config/throttle.constants';
import { AuthService, AuthResponse, TestUser } from './auth.service';
import { Public } from './decorators/public.decorator';
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
  @Throttle({ short: THROTTLE_PRESETS.TEST_LOGIN })
  async testLogin(
    @Query('role') role?: string,
    @Query('email') email?: string
  ): Promise<AuthResponse> {
    if (email) {
      return this.authService.generateTestTokenByEmail(email);
    }

    if (!role) {
      throw new ForbiddenException('Either role or email parameter is required');
    }

    const testUsers: Record<string, TestUser> = {
      [UserRoleValues.TEST_ENGINEER]: {
        email: 'test.engineer@example.com',
        name: '시험실무자 (Suwon)',
        role: UserRoleValues.TEST_ENGINEER,
      },
      [UserRoleValues.TECHNICAL_MANAGER]: {
        email: 'tech.manager@example.com',
        name: '기술책임자 (Suwon)',
        role: UserRoleValues.TECHNICAL_MANAGER,
      },
      [UserRoleValues.QUALITY_MANAGER]: {
        email: 'quality.manager@example.com',
        name: '품질책임자 (Suwon)',
        role: UserRoleValues.QUALITY_MANAGER,
      },
      [UserRoleValues.LAB_MANAGER]: {
        email: 'lab.manager@example.com',
        name: '시험소장 (Suwon)',
        role: UserRoleValues.LAB_MANAGER,
      },
      [UserRoleValues.SYSTEM_ADMIN]: {
        email: 'system.admin@example.com',
        name: '시스템 관리자',
        role: UserRoleValues.SYSTEM_ADMIN,
      },
    };

    const testUser = testUsers[role];
    if (!testUser) {
      const validRoles = Object.values(UserRoleValues).join(', ');
      throw new ForbiddenException(`Invalid role: ${role}. Valid roles: ${validRoles}`);
    }

    return this.authService.generateTestToken(testUser);
  }

  /**
   * 테스트 전용 캐시 초기화 엔드포인트
   * E2E 테스트에서 DB를 직접 리셋한 후 백엔드 인메모리 캐시를 무효화할 때 사용합니다.
   */
  @Post('test-cache-clear')
  @Public()
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
