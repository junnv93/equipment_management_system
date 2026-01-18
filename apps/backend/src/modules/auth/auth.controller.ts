import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { AzureADAuthGuard } from './guards/azure-ad-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
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
}
