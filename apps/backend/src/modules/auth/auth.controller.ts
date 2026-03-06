import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  ForbiddenException,
  NotFoundException,
  UsePipes,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService, AuthResponse } from './auth.service';
import { LoginDto, LoginValidationPipe } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { SkipPermissions } from './decorators/skip-permissions.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { AzureADAuthGuard } from './guards/azure-ad-auth.guard';
import { AuthenticatedRequest } from '../../types/auth';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  // 개발 환경용 테스트 엔드포인트 — 프로덕션에서는 404 (엔드포인트 존재 자체를 숨김)
  @Get('test')
  @Public()
  test(): { message: string; timestamp: string } {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
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
}
