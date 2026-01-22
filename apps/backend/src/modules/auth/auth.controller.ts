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
import { AuthService } from './auth.service';
import { LoginDto, LoginValidationPipe } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { AzureADAuthGuard } from './guards/azure-ad-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @UsePipes(LoginValidationPipe)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @UseGuards(AzureADAuthGuard)
  @Get('azure-login')
  async azureLogin(@Req() req) {
    return this.authService.validateAzureADUser(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
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
  test() {
    return {
      message: '인증 API가 정상적으로 동작 중입니다.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 테스트 전용 로그인 엔드포인트
   * E2E 테스트에서 사용됩니다.
   *
   * @param role - 테스트 사용자의 역할 (test_engineer, technical_manager, lab_manager, system_admin)
   * @returns JWT 토큰을 포함한 인증 정보
   */
  @Get('test-login')
  @Public()
  async testLogin(@Query('role') role: string) {
    // 개발 및 테스트 환경에서만 허용
    if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
      throw new ForbiddenException(
        'Test login is only available in development and test environments'
      );
    }

    if (!role) {
      throw new ForbiddenException('Role parameter is required');
    }

    // 역할별 테스트 사용자 정보
    const testUsers: Record<string, any> = {
      test_engineer: {
        id: 'test-engineer-id',
        uuid: 'test-engineer-uuid',
        email: 'test.engineer@example.com',
        name: '테스트 시험실무자',
        role: 'test_engineer',
        site: 'suwon',
        teamId: 'test-team-id',
      },
      technical_manager: {
        id: 'test-tech-manager-id',
        uuid: 'test-tech-manager-uuid',
        email: 'tech.manager@example.com',
        name: '테스트 기술책임자',
        role: 'technical_manager',
        site: 'suwon',
        teamId: 'test-team-id',
      },
      lab_manager: {
        id: 'test-lab-manager-id',
        uuid: 'test-lab-manager-uuid',
        email: 'lab.manager@example.com',
        name: '테스트 시험소장',
        role: 'lab_manager',
        site: 'suwon',
        teamId: 'test-team-id',
      },
      system_admin: {
        id: 'test-system-admin-id',
        uuid: 'test-system-admin-uuid',
        email: 'system.admin@example.com',
        name: '테스트 시스템 관리자',
        role: 'system_admin',
        site: 'suwon',
        teamId: 'test-team-id',
      },
    };

    const testUser = testUsers[role];
    if (!testUser) {
      throw new ForbiddenException(
        `Invalid role: ${role}. Valid roles: test_engineer, technical_manager, lab_manager, system_admin`
      );
    }

    // AuthService의 login 메서드를 사용하여 JWT 토큰 생성
    return this.authService.generateTestToken(testUser);
  }
}
