import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from './rbac/roles.enum';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';

// 인터페이스 추가
export interface UserDto {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  department?: string;
  site?: 'suwon' | 'uiwang' | 'pyeongtaek';
  location?: '수원랩' | '의왕랩' | '평택랩';
  position?: string;
  teamId?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp (초)
  user: UserDto;
}

/**
 * Azure AD 사용자 정보 인터페이스
 * Microsoft Identity Platform에서 받는 JWT 클레임 기반
 * 다양한 인증 소스와 호환되도록 optional 필드로 정의
 */
export interface AzureADUser {
  // Object ID (Azure AD) 또는 다른 인증 소스의 ID
  oid?: string;
  sub?: string;
  userId?: string;
  id?: string;
  // 이메일/사용자명
  preferred_username?: string;
  email?: string;
  upn?: string;
  // 이름
  name?: string;
  // 권한 관련
  roles?: string[];
  groups?: string[];
  // 추가 정보
  department?: string;
  jobTitle?: string;
  position?: string;
  site?: string;
  teamId?: string;
}

/**
 * 테스트 사용자 정보 인터페이스
 * E2E 테스트에서 사용되는 사용자 정보
 */
export interface TestUser {
  id?: string;
  uuid?: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  site?: 'suwon' | 'uiwang' | 'pyeongtaek';
  location?: '수원랩' | '의왕랩' | '평택랩';
  position?: string;
  teamId?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService
  ) {}

  // 로컬 로그인 (개발/테스트 환경 전용, 프로덕션에서는 Azure AD만 사용)
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    // 프로덕션 환경에서는 로컬 로그인 비활성화
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('프로덕션 환경에서는 Azure AD 인증만 사용할 수 있습니다.');
    }

    // 환경 변수에서 테스트 비밀번호 가져오기 (기본값은 개발용)
    const testPasswords: Record<string, string> = {
      'admin@example.com': process.env.DEV_ADMIN_PASSWORD || 'admin123',
      'manager@example.com': process.env.DEV_MANAGER_PASSWORD || 'manager123',
      'user@example.com': process.env.DEV_USER_PASSWORD || 'user123',
    };

    // 비밀번호 검증용 최소 사용자 정보 (DB 조회 키로만 사용)
    const testUserDefaults: Record<string, { roles: UserRole[]; name: string }> = {
      'admin@example.com': { roles: [UserRole.LAB_MANAGER], name: '관리자' },
      'manager@example.com': { roles: [UserRole.TECHNICAL_MANAGER], name: '기술책임자' },
      'user@example.com': { roles: [UserRole.TEST_ENGINEER], name: '시험실무자' },
    };

    const defaults = testUserDefaults[loginDto.email];
    const expectedPassword = testPasswords[loginDto.email];

    if (!defaults || !expectedPassword || loginDto.password !== expectedPassword) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // DB에서 사용자 정보 조회하여 site, teamId 등 보강
    // DB row에는 site/location 컬럼이 있지만 User 스키마 타입에는 미포함
    const dbUser = (await this.usersService.findByEmail(loginDto.email)) as
      | (Record<string, unknown> & {
          id: string;
          email: string;
          name: string;
          role: string;
          teamId?: string | null;
          position?: string | null;
        })
      | null;
    if (dbUser) {
      return this.generateToken({
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        roles: [dbUser.role as UserRole],
        department: undefined,
        site: (dbUser.site as UserDto['site']) ?? undefined,
        location: (dbUser.location as UserDto['location']) ?? undefined,
        position: dbUser.position ?? undefined,
        teamId: dbUser.teamId ?? undefined,
      });
    }

    // DB에 없으면 최소 정보로 폴백 (site/teamId 없음)
    this.logger.warn(`login(): DB에서 사용자를 찾을 수 없음 (${loginDto.email}), 기본값 사용`);
    return this.generateToken({
      id: '',
      email: loginDto.email,
      name: defaults.name,
      roles: defaults.roles,
    });
  }

  // Azure AD 인증 처리 (프로덕션 환경)
  validateAzureADUser(azureUser: AzureADUser): AuthResponse {
    if (!azureUser) {
      throw new UnauthorizedException('Azure AD 인증에 실패했습니다.');
    }

    // Azure AD 그룹 정보에서 팀과 위치 추출
    const { teamId, site, location } = this.mapAzureGroupsToTeamAndLocation(azureUser.groups || []);

    // Azure AD에서 받은 정보로 사용자 객체 생성
    // 다양한 인증 소스 호환을 위해 fallback 처리
    const userId = azureUser.oid ?? azureUser.sub ?? azureUser.userId ?? azureUser.id ?? '';
    const userEmail = azureUser.preferred_username ?? azureUser.email ?? azureUser.upn ?? '';
    const userName = azureUser.name ?? '';

    const user: UserDto = {
      id: userId,
      email: userEmail,
      name: userName,
      roles: this.mapAzureRolesToAppRoles(azureUser.roles || []),
      department: azureUser.department,
      site,
      location,
      position: azureUser.jobTitle ?? azureUser.position,
      teamId: teamId ?? azureUser.teamId,
    };

    // 토큰 생성
    return this.generateToken(user);
  }

  // Azure AD 그룹을 팀과 위치로 매핑
  // ✅ Best Practice: 팀 이름 = 분류 이름 (통일)
  // ✅ 사이트별 팀 구성:
  //    - 수원(SUW): FCC EMC/RF(E), General EMC(R), SAR(S), Automotive EMC(A)
  //    - 의왕(UIW): General RF(W)
  //    - 평택(PYT): Automotive EMC(A)
  private mapAzureGroupsToTeamAndLocation(azureGroups: string[]): {
    teamId?: string;
    site?: 'suwon' | 'uiwang' | 'pyeongtaek';
    location?: '수원랩' | '의왕랩' | '평택랩';
  } {
    // Azure AD 그룹 패턴: LST.{SITE}.{TEAM}
    // 예: LST.SUW.RF (수원 FCC EMC/RF팀)

    // ✅ Azure AD 그룹 → 팀 UUID 매핑
    // 팀 이름은 분류 이름과 동일: FCC EMC/RF, General EMC, General RF, SAR, Automotive EMC
    const teamMapping: Record<'suwon' | 'uiwang' | 'pyeongtaek', Record<string, string>> = {
      suwon: {
        // 수원 사이트 팀 (Azure AD 그룹 Object ID 기반)
        RF: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1', // LST.SUW.RF → FCC EMC/RF (E)
        SAR: '7fd28076-fd5e-4d36-b051-bbf8a97b82db', // LST.SUW.SAR → SAR (S)
        EMC: 'bb6c860d-9d7c-4e2d-b289-2b2e416ec289', // LST.SUW.EMC → General EMC (R)
        Automotive: 'f0a32655-00f9-4ecd-b43c-af4faed499b6', // LST.SUW.Automotive → Automotive EMC (A)
      },
      uiwang: {
        // 의왕 사이트 팀 - General RF만 존재
        RF: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789', // LST.UIW.RF → General RF (W)
      },
      pyeongtaek: {
        // 평택 사이트 팀 - Automotive EMC만 존재
        Automotive: 'b2c3d4e5-f6a7-4890-bcde-f01234567890', // LST.PYT.Automotive → Automotive EMC (A)
      },
    };

    const siteMapping: Record<
      string,
      {
        site: 'suwon' | 'uiwang' | 'pyeongtaek';
        location: '수원랩' | '의왕랩' | '평택랩';
      }
    > = {
      SUW: { site: 'suwon', location: '수원랩' },
      UIW: { site: 'uiwang', location: '의왕랩' },
      PYT: { site: 'pyeongtaek', location: '평택랩' },
    };

    for (const group of azureGroups) {
      // 그룹 이름 패턴 파싱: LST.SUW.RF
      const parts = group.split('.');
      if (parts.length >= 3 && parts[0] === 'LST') {
        const siteCode = parts[1]; // SUW, UIW, PYT
        const teamCode = parts[2]; // RF, SAR, EMC, Automotive

        const siteInfo = siteMapping[siteCode];
        if (siteInfo) {
          const siteTeams = teamMapping[siteInfo.site];
          const teamId = siteTeams ? siteTeams[teamCode] : undefined;

          // ✅ 사이트별 팀 매핑 성공
          if (teamId) {
            return {
              teamId,
              site: siteInfo.site,
              location: siteInfo.location,
            };
          }
        }
      }
    }

    // 매핑 실패 시 기본값 반환 (Azure 그룹 없음)
    return {};
  }

  // Azure AD 역할을 애플리케이션 역할로 매핑
  private mapAzureRolesToAppRoles(azureRoles: string[]): UserRole[] {
    const roleMap: Record<string, UserRole> = {
      SiteAdmin: UserRole.LAB_MANAGER,
      TechnicalManager: UserRole.TECHNICAL_MANAGER,
      TestOperator: UserRole.TEST_ENGINEER,
      // 하위 호환성을 위한 기존 역할 매핑
      Admin: UserRole.LAB_MANAGER,
      Manager: UserRole.TECHNICAL_MANAGER,
      User: UserRole.TEST_ENGINEER,
    };

    const mappedRoles = azureRoles
      .map((role) => roleMap[role])
      .filter((role) => role !== undefined);

    return mappedRoles.length > 0 ? mappedRoles : [UserRole.TEST_ENGINEER]; // 기본값은 시험실무자
  }

  /**
   * 테스트 전용 토큰 생성
   * E2E 테스트에서 사용됩니다.
   * DB에서 사용자 정보를 조회하여 site, teamId 등을 보강합니다.
   *
   * @param testUser - 테스트 사용자 정보 (email을 DB 조회 키로 사용)
   * @returns JWT 토큰을 포함한 인증 정보
   */
  async generateTestToken(testUser: TestUser): Promise<AuthResponse> {
    // DB에서 실제 사용자 정보 조회
    // DB row에는 site/location 컬럼이 있지만 User 스키마 타입에는 미포함
    const dbUser = (await this.usersService.findByEmail(testUser.email)) as
      | (Record<string, unknown> & {
          id: string;
          email: string;
          name: string;
          role: string;
          teamId?: string | null;
          position?: string | null;
        })
      | null;
    if (dbUser) {
      return this.generateToken({
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        roles: [testUser.role as UserRole],
        department: undefined,
        site: (dbUser.site as UserDto['site']) ?? undefined,
        location: (dbUser.location as UserDto['location']) ?? undefined,
        position: dbUser.position ?? undefined,
        teamId: dbUser.teamId ?? undefined,
      });
    }

    // DB에 없으면 전달된 정보로 폴백
    this.logger.warn(
      `generateTestToken(): DB에서 사용자를 찾을 수 없음 (${testUser.email}), 전달된 정보 사용`
    );
    return this.generateToken({
      id: testUser.id ?? testUser.uuid ?? '',
      email: testUser.email,
      name: testUser.name,
      roles: [testUser.role as UserRole],
      department: testUser.department,
      site: testUser.site,
      location: testUser.location,
      position: testUser.position,
      teamId: testUser.teamId,
    });
  }

  /**
   * 이메일로 테스트 토큰 생성 (신규 방식 - 권장)
   * DB에서 이메일로 사용자를 조회하여 JWT 토큰을 생성합니다.
   *
   * @param email - 테스트 사용자의 이메일 주소
   * @returns JWT 토큰을 포함한 인증 정보
   */
  async generateTestTokenByEmail(email: string): Promise<AuthResponse> {
    const dbUser = (await this.usersService.findByEmail(email)) as
      | (Record<string, unknown> & {
          id: string;
          email: string;
          name: string;
          role: string;
          teamId?: string | null;
          position?: string | null;
        })
      | null;

    if (!dbUser) {
      throw new UnauthorizedException(`사용자를 찾을 수 없습니다: ${email}`);
    }

    return this.generateToken({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      roles: [dbUser.role as UserRole],
      department: undefined,
      site: (dbUser.site as UserDto['site']) ?? undefined,
      location: (dbUser.location as UserDto['location']) ?? undefined,
      position: dbUser.position ?? undefined,
      teamId: dbUser.teamId ?? undefined,
    });
  }

  /**
   * Refresh Token으로 새 Access Token + Refresh Token 발급 (Rotation)
   *
   * - refresh_token 검증 (별도 시크릿, type === 'refresh' 확인)
   * - payload.sub로 DB에서 최신 사용자 정보 조회 (역할 변경 즉시 반영)
   * - 새 access_token + 새 refresh_token 발급
   */
  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    try {
      const refreshSecret =
        this.configService.get<string>('REFRESH_TOKEN_SECRET') ||
        this.configService.get<string>('JWT_SECRET') + '_refresh';

      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });

      // type 클레임 확인: access token으로 refresh 시도 방지
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
      }

      const userId = payload.sub;
      if (!userId) {
        throw new UnauthorizedException('리프레시 토큰에 사용자 정보가 없습니다.');
      }

      // DB에서 최신 사용자 정보 조회 (역할 변경 즉시 반영)
      const dbUser = (await this.usersService.findOne(userId)) as
        | (Record<string, unknown> & {
            id: string;
            email: string;
            name: string;
            role: string;
            teamId?: string | null;
            position?: string | null;
          })
        | null;

      if (!dbUser) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
      }

      return this.generateToken({
        id: dbUser.id,
        email: dbUser.email as string,
        name: dbUser.name as string,
        roles: [dbUser.role as UserRole],
        department: undefined,
        site: (dbUser.site as UserDto['site']) ?? undefined,
        location: (dbUser.location as UserDto['location']) ?? undefined,
        position: dbUser.position ?? undefined,
        teamId: dbUser.teamId ?? undefined,
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.warn(`refreshTokens() 실패: ${(error as Error).message}`);
      throw new UnauthorizedException('리프레시 토큰이 만료되었거나 유효하지 않습니다.');
    }
  }

  // JWT 토큰 생성 (Access Token 15분 + Refresh Token 7일)
  private generateToken(user: UserDto): AuthResponse {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const refreshSecret =
      this.configService.get<string>('REFRESH_TOKEN_SECRET') || jwtSecret + '_refresh';

    const accessPayload = {
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

    const refreshPayload = {
      sub: user.id,
      email: user.email,
      type: 'refresh' as const,
    };

    const accessTokenExpiresInSeconds = 15 * 60; // 15분

    return {
      access_token: this.jwtService.sign(accessPayload, {
        secret: jwtSecret,
        expiresIn: '15m',
      }),
      refresh_token: this.jwtService.sign(refreshPayload, {
        secret: refreshSecret,
        expiresIn: '7d',
      }),
      expires_at: Math.floor(Date.now() / 1000) + accessTokenExpiresInSeconds,
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
