import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserDto } from './dto/user.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from './rbac/roles.enum';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // 로컬 로그인 (개발 환경용, 프로덕션에서는 Azure AD만 사용)
  async login(loginDto: LoginDto) {
    // 실제 환경에서는 사용자 DB 조회 로직이 필요함
    // 예제를 위한 임시 코드
    if (loginDto.email === 'admin@example.com' && loginDto.password === 'admin123') {
      const user: UserDto = {
        id: '1',
        email: 'admin@example.com',
        name: '관리자',
        roles: [UserRole.ADMIN],
      };
      
      return this.generateToken(user);
    }
    
    if (loginDto.email === 'manager@example.com' && loginDto.password === 'manager123') {
      const user: UserDto = {
        id: '2',
        email: 'manager@example.com',
        name: '매니저',
        roles: [UserRole.MANAGER],
        department: 'IT',
      };
      
      return this.generateToken(user);
    }
    
    if (loginDto.email === 'user@example.com' && loginDto.password === 'user123') {
      const user: UserDto = {
        id: '3',
        email: 'user@example.com',
        name: '일반 사용자',
        roles: [UserRole.USER],
        department: 'RF팀',
      };
      
      return this.generateToken(user);
    }
    
    throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  // Azure AD 인증 처리 (프로덕션 환경)
  validateAzureADUser(azureUser: any) {
    if (!azureUser) {
      throw new UnauthorizedException('Azure AD 인증에 실패했습니다.');
    }

    // Azure AD에서 받은 정보로 사용자 생성
    const user: UserDto = {
      id: azureUser.oid,
      email: azureUser.preferred_username,
      name: azureUser.name,
      roles: this.mapAzureRolesToAppRoles(azureUser.roles || []),
      department: azureUser.department,
      employeeId: azureUser.employeeId,
    };

    return this.generateToken(user);
  }

  // Azure AD 역할을 앱 역할로 매핑
  private mapAzureRolesToAppRoles(azureRoles: string[]): UserRole[] {
    const roleMap = {
      'Admin': UserRole.ADMIN,
      'Manager': UserRole.MANAGER,
      'User': UserRole.USER,
    };

    return azureRoles
      .map(role => roleMap[role])
      .filter(role => role !== undefined)
      .length > 0
      ? azureRoles.map(role => roleMap[role]).filter(role => role !== undefined)
      : [UserRole.USER]; // 기본값은 USER 역할
  }

  // JWT 토큰 생성
  private generateToken(user: UserDto) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      department: user.department,
    };

    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1d', // 토큰 만료 시간
      }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        department: user.department,
      },
    };
  }
} 