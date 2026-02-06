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
import { AuthService, TestUser } from './auth.service';
import { LoginDto, LoginValidationPipe } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { AzureADAuthGuard } from './guards/azure-ad-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../types/auth';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @UsePipes(LoginValidationPipe)
  async login(
    @Body() loginDto: LoginDto
  ): Promise<
    import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/auth/auth.service').AuthResponse
  > {
    return this.authService.login(loginDto);
  }

  @Public()
  @UseGuards(AzureADAuthGuard)
  @Get('azure-login')
  async azureLogin(
    @Req() req: AuthenticatedRequest
  ): Promise<
    import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/auth/auth.service').AuthResponse
  > {
    return this.authService.validateAzureADUser(req.user);
  }

  @UseGuards(JwtAuthGuard)
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
   * 테스트 전용 로그인 엔드포인트
   * E2E 테스트에서 사용됩니다.
   *
   * @param role - 테스트 사용자의 역할 (test_engineer, technical_manager, quality_manager, lab_manager, system_admin)
   * @returns JWT 토큰을 포함한 인증 정보
   */
  @Get('test-login')
  @Public()
  async testLogin(
    @Query('role') role: string
  ): Promise<
    import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/auth/auth.service').AuthResponse
  > {
    // 개발 및 테스트 환경에서만 허용
    if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
      throw new ForbiddenException(
        'Test login is only available in development and test environments'
      );
    }

    if (!role) {
      throw new ForbiddenException('Role parameter is required');
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
}
