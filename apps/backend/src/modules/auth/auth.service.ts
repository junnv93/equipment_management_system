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
  site?: 'suwon' | 'uiwang';
  location?: '수원랩' | '의왕랩';
  position?: string;
  teamId?: string;
}

export interface AuthResponse {
  access_token: string;
  user: UserDto;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  // 로컬 로그인 (개발 환경용, 프로덕션에서는 Azure AD만 사용)
  // ✅ 개선: UUID 형식의 사용자 ID 사용 (데이터베이스 스키마와 일치)
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    // 개발 편의를 위한 하드코딩된 사용자 (실제로는 데이터베이스에서 조회해야 함)
    // ✅ UUID 형식의 ID 사용 (users 테이블의 id는 uuid 타입)
    // 일관된 UUID 형식 사용으로 다른 모듈과의 호환성 확보
    const testUsers = {
      'admin@example.com': {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@example.com',
        name: '관리자',
        roles: [UserRole.SITE_ADMIN],
        department: undefined,
        site: 'suwon' as const,
        location: '수원랩' as const,
      },
      'manager@example.com': {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'manager@example.com',
        name: '기술책임자',
        roles: [UserRole.TECHNICAL_MANAGER],
        department: 'RF팀',
        site: 'suwon' as const,
        location: '수원랩' as const,
      },
      'user@example.com': {
        id: '00000000-0000-0000-0000-000000000003',
        email: 'user@example.com',
        name: '시험실무자',
        roles: [UserRole.TEST_OPERATOR],
        department: 'RF팀',
        site: 'suwon' as const,
        location: '수원랩' as const,
      },
    };

    const user = testUsers[loginDto.email as keyof typeof testUsers];
    if (user && loginDto.password === 'admin123' && loginDto.email === 'admin@example.com') {
      return this.generateToken(user);
    } else if (
      user &&
      loginDto.password === 'manager123' &&
      loginDto.email === 'manager@example.com'
    ) {
      return this.generateToken(user);
    } else if (user && loginDto.password === 'user123' && loginDto.email === 'user@example.com') {
      return this.generateToken(user);
    }

    // 인증 실패
    throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  // Azure AD 인증 처리 (프로덕션 환경)
  validateAzureADUser(azureUser: any): AuthResponse {
    if (!azureUser) {
      throw new UnauthorizedException('Azure AD 인증에 실패했습니다.');
    }

    // Azure AD 그룹 정보에서 팀과 위치 추출
    const { teamId, site, location } = this.mapAzureGroupsToTeamAndLocation(azureUser.groups || []);

    // Azure AD에서 받은 정보로 사용자 객체 생성
    const user: UserDto = {
      id: azureUser.oid,
      email: azureUser.preferred_username,
      name: azureUser.name,
      roles: this.mapAzureRolesToAppRoles(azureUser.roles || []),
      department: azureUser.department,
      site,
      location,
      position: azureUser.jobTitle || azureUser.position,
      teamId,
    };

    // 토큰 생성
    return this.generateToken(user);
  }

  // Azure AD 그룹을 팀과 위치로 매핑
  // 예: LST.SUW.RF → RF팀 + 수원랩
  private mapAzureGroupsToTeamAndLocation(azureGroups: string[]): {
    teamId?: string;
    site?: 'suwon' | 'uiwang';
    location?: '수원랩' | '의왕랩';
  } {
    // Azure AD 그룹 패턴: LST.{SITE}.{TEAM}
    // 예: LST.SUW.RF, LST.SUW.SAR, LST.UIW.RF 등

    const teamMapping: Record<string, string> = {
      RF: 'rf',
      SAR: 'sar',
      EMC: 'emc',
      AUTO: 'auto',
    };

    const siteMapping: Record<string, { site: 'suwon' | 'uiwang'; location: '수원랩' | '의왕랩' }> =
      {
        SUW: { site: 'suwon', location: '수원랩' },
        UIW: { site: 'uiwang', location: '의왕랩' },
      };

    for (const group of azureGroups) {
      // 그룹 이름 패턴 파싱: LST.SUW.RF
      const parts = group.split('.');
      if (parts.length >= 3 && parts[0] === 'LST') {
        const siteCode = parts[1]; // SUW, UIW
        const teamCode = parts[2]; // RF, SAR, EMC, AUTO

        const siteInfo = siteMapping[siteCode];
        const teamId = teamMapping[teamCode];

        if (siteInfo && teamId) {
          return {
            teamId,
            site: siteInfo.site,
            location: siteInfo.location,
          };
        }
      }
    }

    // 매핑 실패 시 기본값 반환
    return {};
  }

  // Azure AD 역할을 애플리케이션 역할로 매핑
  private mapAzureRolesToAppRoles(azureRoles: string[]): UserRole[] {
    const roleMap: Record<string, UserRole> = {
      SiteAdmin: UserRole.SITE_ADMIN,
      TechnicalManager: UserRole.TECHNICAL_MANAGER,
      TestOperator: UserRole.TEST_OPERATOR,
      // 하위 호환성을 위한 기존 역할 매핑
      Admin: UserRole.SITE_ADMIN,
      Manager: UserRole.TECHNICAL_MANAGER,
      User: UserRole.TEST_OPERATOR,
    };

    const mappedRoles = azureRoles
      .map((role) => roleMap[role])
      .filter((role) => role !== undefined);

    return mappedRoles.length > 0 ? mappedRoles : [UserRole.TEST_OPERATOR]; // 기본값은 시험실무자
  }

  // JWT 토큰 생성
  private generateToken(user: UserDto): AuthResponse {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      department: user.department,
      site: user.site,
      location: user.location,
      position: user.position,
      teamId: user.teamId,
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
        site: user.site,
        location: user.location,
        position: user.position,
        teamId: user.teamId,
      },
    };
  }
}
