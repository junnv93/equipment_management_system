import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  ForbiddenException,
  UsePipes,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE_PRESETS } from '../../common/config/throttle.constants';
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
  @Throttle({ short: THROTTLE_PRESETS.LOGIN }) // 1분당 5회
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
  @Throttle({ medium: THROTTLE_PRESETS.TOKEN_REFRESH }) // 1분당 10회
  @Post('refresh') // @BodyPipeExempt: single JWT string field, JWT validity verified by authService
  async refresh(@Body('refresh_token') refreshToken: string): Promise<AuthResponse> {
    if (!refreshToken) {
      throw new ForbiddenException('refresh_token is required');
    }
    return this.authService.refreshTokens(refreshToken);
  }
}
