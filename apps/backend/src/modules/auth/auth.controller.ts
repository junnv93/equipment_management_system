import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Query,
  ForbiddenException,
  UsePipes,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService, AuthResponse, TestUser } from './auth.service';
import { LoginDto, LoginValidationPipe } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { SkipPermissions } from './decorators/skip-permissions.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { AzureADAuthGuard } from './guards/azure-ad-auth.guard';
import { AuthenticatedRequest } from '../../types/auth';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cacheService: SimpleCacheService
  ) {}

  @Public()
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 1분당 5회
  @Post('login')
  @UsePipes(LoginValidationPipe)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Public()
  @UseGuards(AzureADAuthGuard)
  @Get('azure-login')
  async azureLogin(@Req() req: AuthenticatedRequest): Promise<AuthResponse> {
    return this.authService.validateAzureADUser(req.user);
  }

  @SkipPermissions()
  @Get('profile')
  getProfile(@Req() req: AuthenticatedRequest): {
    id: string;
    email: string;
    roles: string[];
    department: string | undefined;
  } {
    return {
      id: req.user.userId,
      email: req.user.email,
      roles: req.user.roles,
      department: req.user.department,
    };
  }

  // 개발 환경용 테스트 엔드포인트
  @Get('test')
  @Public()
  test(): { message: string; timestamp: string } {
    return {
      message: '인증 API가 정상적으로 동작 중입니다.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 로그아웃 — 토큰 블랙리스트 등록
   *
   * 클라이언트는 Authorization 헤더 (access token) +
   * Body의 refresh_token을 전송합니다.
   */
  @SkipPermissions()
  @AuditLog({ action: 'logout', entityType: 'user', entityIdPath: 'user.userId' })
  @Post('logout') // @BodyPipeExempt: optional single-field extraction, no JSON body schema
  async logout(
    @Req() req: AuthenticatedRequest,
    @Body('refresh_token') refreshToken?: string
  ): Promise<{ success: boolean; message: string }> {
    // Authorization 헤더에서 access token 추출
    const authHeader = (req.headers as Record<string, string | undefined>).authorization;
    const accessToken = authHeader?.replace('Bearer ', '') || '';

    await this.authService.logout(accessToken, refreshToken);

    return {
      success: true,
      message: '로그아웃되었습니다.',
    };
  }

  /**
   * Refresh Token으로 새 Access Token 발급
   * Access Token 만료 시 호출되므로 @Public() 필수 (JWT Guard 우회)
   */
  @Public()
  @Throttle({ medium: { limit: 10, ttl: 60000 } }) // 1분당 10회
  @Post('refresh') // @BodyPipeExempt: single JWT string field, JWT validity verified by authService
  async refresh(@Body('refresh_token') refreshToken: string): Promise<AuthResponse> {
    if (!refreshToken) {
      throw new ForbiddenException('refresh_token is required');
    }
    return this.authService.refreshTokens(refreshToken);
  }

  /**
   * 테스트 전용 로그인 엔드포인트
   * E2E 테스트에서 사용됩니다.
   *
   * @param role - (레거시) 테스트 사용자의 역할 (test_engineer, technical_manager, quality_manager, lab_manager, system_admin)
   * @param email - (권장) 테스트 사용자의 이메일 주소 (여러 팀의 사용자 지원)
   * @returns JWT 토큰을 포함한 인증 정보
   */
  @Get('test-login')
  @Public()
  @Throttle({ short: { limit: 10, ttl: 60000 } }) // 1분당 10회 (테스트 환경 고려)
  async testLogin(
    @Query('role') role?: string,
    @Query('email') email?: string
  ): Promise<AuthResponse> {
    // 개발 및 테스트 환경에서만 허용
    if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
      throw new ForbiddenException(
        'Test login is only available in development and test environments'
      );
    }

    // email이 제공되면 email로 직접 조회 (우선순위)
    if (email) {
      // DB에서 사용자 조회하여 JWT 생성 (AuthService에서 처리)
      return this.authService.generateTestTokenByEmail(email);
    }

    // role만 제공된 경우 레거시 동작 (수원 FCC EMC/RF 팀 사용자)
    if (!role) {
      throw new ForbiddenException('Either role or email parameter is required');
    }

    // 역할별 테스트 사용자 정보 (최소한의 role→email 매핑만 유지)
    // site, teamId, location 등은 DB에서 조회됨 (AuthService.generateTestToken)
    const testUsers: Record<string, TestUser> = {
      test_engineer: {
        email: 'test.engineer@example.com',
        name: '시험실무자 (Suwon)',
        role: 'test_engineer',
      },
      technical_manager: {
        email: 'tech.manager@example.com',
        name: '기술책임자 (Suwon)',
        role: 'technical_manager',
      },
      quality_manager: {
        email: 'quality.manager@example.com',
        name: '품질책임자 (Suwon)',
        role: 'quality_manager',
      },
      lab_manager: {
        email: 'lab.manager@example.com',
        name: '시험소장 (Suwon)',
        role: 'lab_manager',
      },
      system_admin: {
        email: 'system.admin@example.com',
        name: '시스템 관리자',
        role: 'system_admin',
      },
    };

    const testUser = testUsers[role];
    if (!testUser) {
      throw new ForbiddenException(
        `Invalid role: ${role}. Valid roles: test_engineer, technical_manager, quality_manager, lab_manager, system_admin`
      );
    }

    // AuthService의 login 메서드를 사용하여 JWT 토큰 생성
    return this.authService.generateTestToken(testUser);
  }

  /**
   * 테스트 전용 캐시 초기화 엔드포인트
   * E2E 테스트에서 DB를 직접 리셋한 후 백엔드 인메모리 캐시를 무효화할 때 사용합니다.
   */
  @Post('test-cache-clear')
  @Public()
  testCacheClear(): { cleared: boolean; message: string } {
    if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
      throw new ForbiddenException(
        'Test cache clear is only available in development and test environments'
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
