import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from './rbac/roles.enum';
import { LoginDto } from './dto/login.dto';

// 인터페이스 추가
export interface UserDto {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  department?: string;
}

export interface AuthResponse {
  access_token: string;
  user: UserDto;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // 로컬 로그인 (개발 환경용, 프로덕션에서는 Azure AD만 사용)
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    // 개발 편의를 위한 하드코딩된 사용자 (실제로는 데이터베이스에서 조회해야 함)
    if (loginDto.email === 'admin@example.com' && loginDto.password === 'admin123') {
      return this.generateToken({
        id: '1',
        email: 'admin@example.com',
        name: '관리자',
        roles: [UserRole.ADMIN],
        department: undefined,
      });
    } else if (loginDto.email === 'manager@example.com' && loginDto.password === 'manager123') {
      return this.generateToken({
        id: '2',
        email: 'manager@example.com',
        name: '매니저',
        roles: [UserRole.MANAGER],
        department: 'IT',
      });
    } else if (loginDto.email === 'user@example.com' && loginDto.password === 'user123') {
      return this.generateToken({
        id: '3',
        email: 'user@example.com',
        name: '일반 사용자',
        roles: [UserRole.USER],
        department: 'RF팀',
      });
    }

    // 인증 실패
    throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  // Azure AD 인증 처리 (프로덕션 환경)
  validateAzureADUser(azureUser: any): AuthResponse {
    if (!azureUser) {
      throw new UnauthorizedException('Azure AD 인증에 실패했습니다.');
    }

    // Azure AD에서 받은 정보로 사용자 객체 생성
    const user: UserDto = {
      id: azureUser.oid,
      email: azureUser.preferred_username,
      name: azureUser.name,
      roles: this.mapAzureRolesToAppRoles(azureUser.roles || []),
      department: azureUser.department,
    };

    // 토큰 생성
    return this.generateToken(user);
  }

  // Azure AD 역할을 애플리케이션 역할로 매핑
  private mapAzureRolesToAppRoles(azureRoles: string[]): UserRole[] {
    const roleMap: Record<string, UserRole> = {
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
  private generateToken(user: UserDto): AuthResponse {
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