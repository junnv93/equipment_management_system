import { Injectable, Inject, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ABSOLUTE_SESSION_MAX_AGE_SECONDS,
  ACCESS_TOKEN_TTL_SECONDS,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
} from '@equipment-management/shared-constants';
import {
  type SiteCode,
  type Site,
  type Location,
  CODE_TO_SITE,
  SITE_TO_LOCATION,
} from '@equipment-management/schemas';
import { UserRoleValues, type UserRole } from './rbac/roles.enum';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { TOKEN_BLACKLIST, TokenBlacklistProvider } from './blacklist/token-blacklist.interface';
import {
  TEAM_FCC_EMC_RF_SUWON_ID,
  TEAM_SAR_SUWON_ID,
  TEAM_GENERAL_EMC_SUWON_ID,
  TEAM_AUTOMOTIVE_EMC_SUWON_ID,
} from '../../database/utils/uuid-constants';

// 인터페이스 추가
export interface UserDto {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  department?: string;
  site?: Site;
  location?: Location;
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
  site?: Site;
  location?: Location;
  position?: string;
  teamId?: string;
}

// 토큰 라이프사이클 상수는 @equipment-management/shared-constants/auth-token에서 import
// ABSOLUTE_SESSION_MAX_AGE_SECONDS, ACCESS_TOKEN_TTL_SECONDS, ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN

/** 로그인 실패 제한 (dev/test 전용) */
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15분
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15분 윈도우

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  /** 이메일 → { 실패 횟수, 윈도우 시작 시간 } (dev/test 전용) */
  private readonly loginAttempts = new Map<string, { count: number; windowStart: number }>();
  /** 이메일 → 잠금 해제 시각 (ms) (dev/test 전용) */
  private readonly loginLocks = new Map<string, number>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
    @Inject(TOKEN_BLACKLIST) private blacklist: TokenBlacklistProvider,
    private eventEmitter: EventEmitter2
  ) {}

  // 로컬 로그인 (개발/테스트 환경 전용, 프로덕션에서는 Azure AD만 사용)
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    // 프로덕션 환경에서는 로컬 로그인 비활성화
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException({
        code: 'AUTH_PRODUCTION_AZURE_ONLY',
        message: 'Only Azure AD authentication is available in production.',
      });
    }

    // 계정 잠금 확인
    const lockUntil = this.loginLocks.get(loginDto.email);
    if (lockUntil && Date.now() < lockUntil) {
      const lockMinutes = LOCK_DURATION_MS / (60 * 1000);
      this.eventEmitter.emit('audit.auth.failed', {
        event: 'login_failed',
        email: loginDto.email,
        reason: 'account_locked',
        timestamp: new Date().toISOString(),
      });
      throw new UnauthorizedException({
        code: 'AUTH_ACCOUNT_LOCKED',
        message: `Account is temporarily locked. Please try again in ${lockMinutes} minutes.`,
      });
    }

    // 환경 변수에서 테스트 비밀번호 가져오기 (기본값은 개발용)
    const testPasswords: Record<string, string> = {
      'admin@example.com': process.env.DEV_ADMIN_PASSWORD || 'admin123',
      'manager@example.com': process.env.DEV_MANAGER_PASSWORD || 'manager123',
      'user@example.com': process.env.DEV_USER_PASSWORD || 'user123',
    };

    // 비밀번호 검증용 최소 사용자 정보 (DB 조회 키로만 사용)
    const testUserDefaults: Record<string, { roles: UserRole[]; name: string }> = {
      'admin@example.com': { roles: [UserRoleValues.LAB_MANAGER], name: '관리자' },
      'manager@example.com': { roles: [UserRoleValues.TECHNICAL_MANAGER], name: '기술책임자' },
      'user@example.com': { roles: [UserRoleValues.TEST_ENGINEER], name: '시험실무자' },
    };

    const defaults = testUserDefaults[loginDto.email];
    const expectedPassword = testPasswords[loginDto.email];

    if (!defaults || !expectedPassword || loginDto.password !== expectedPassword) {
      // 실패 카운터 증가
      const now = Date.now();
      const prev = this.loginAttempts.get(loginDto.email);
      const windowActive = prev !== undefined && now - prev.windowStart < ATTEMPT_WINDOW_MS;
      const newCount = windowActive ? prev.count + 1 : 1;
      const windowStart = windowActive ? prev.windowStart : now;

      if (newCount >= MAX_LOGIN_ATTEMPTS) {
        this.loginLocks.set(loginDto.email, now + LOCK_DURATION_MS);
        this.loginAttempts.delete(loginDto.email);
        const lockMinutes = LOCK_DURATION_MS / (60 * 1000);
        this.eventEmitter.emit('audit.auth.failed', {
          event: 'login_failed',
          email: loginDto.email,
          reason: 'account_locked',
          timestamp: new Date().toISOString(),
        });
        throw new UnauthorizedException({
          code: 'AUTH_ACCOUNT_LOCKED',
          message: `Account is temporarily locked. Please try again in ${lockMinutes} minutes.`,
        });
      }

      this.loginAttempts.set(loginDto.email, { count: newCount, windowStart });
      this.eventEmitter.emit('audit.auth.failed', {
        event: 'login_failed',
        email: loginDto.email,
        reason: 'invalid_credentials',
        timestamp: new Date().toISOString(),
      });
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    // 로그인 성공 시 카운터 리셋
    this.loginAttempts.delete(loginDto.email);
    this.loginLocks.delete(loginDto.email);

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
      throw new UnauthorizedException({
        code: 'AUTH_AZURE_AD_FAILED',
        message: 'Azure AD authentication failed.',
      });
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
    site?: Site;
    location?: Location;
  } {
    // Azure AD 그룹 패턴: LST.{SITE}.{TEAM}
    // 예: LST.SUW.RF (수원 FCC EMC/RF팀)

    // ✅ Azure AD 그룹 → 팀 UUID 매핑 (환경변수 기반 — 배포 환경에서 실제 UUID로 교체)
    // 팀 이름은 분류 이름과 동일: FCC EMC/RF, General EMC, General RF, SAR, Automotive EMC
    const cfg = this.configService;
    const teamMapping: Record<Site, Record<string, string>> = {
      suwon: {
        RF: cfg.get<string>('AZURE_TEAM_ID_SUW_RF') ?? TEAM_FCC_EMC_RF_SUWON_ID,
        SAR: cfg.get<string>('AZURE_TEAM_ID_SUW_SAR') ?? TEAM_SAR_SUWON_ID,
        EMC: cfg.get<string>('AZURE_TEAM_ID_SUW_EMC') ?? TEAM_GENERAL_EMC_SUWON_ID,
        Automotive: cfg.get<string>('AZURE_TEAM_ID_SUW_AUTO') ?? TEAM_AUTOMOTIVE_EMC_SUWON_ID,
      },
      uiwang: {
        RF: cfg.get<string>('AZURE_TEAM_ID_UIW_RF') ?? '',
      },
      pyeongtaek: {
        Automotive: cfg.get<string>('AZURE_TEAM_ID_PYT_AUTO') ?? '',
      },
    };

    for (const group of azureGroups) {
      // 그룹 이름 패턴 파싱: LST.SUW.RF
      const parts = group.split('.');
      if (parts.length >= 3 && parts[0] === 'LST') {
        const siteCode = parts[1] as SiteCode; // SUW, UIW, PYT
        const teamCode = parts[2]; // RF, SAR, EMC, Automotive

        const site = CODE_TO_SITE[siteCode];
        if (site) {
          const siteTeams = teamMapping[site];
          const teamId = siteTeams ? siteTeams[teamCode] : undefined;

          // ✅ 사이트별 팀 매핑 성공
          if (teamId) {
            return {
              teamId,
              site,
              location: SITE_TO_LOCATION[site],
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
      SiteAdmin: UserRoleValues.LAB_MANAGER,
      TechnicalManager: UserRoleValues.TECHNICAL_MANAGER,
      TestOperator: UserRoleValues.TEST_ENGINEER,
      // 하위 호환성을 위한 기존 역할 매핑
      Admin: UserRoleValues.LAB_MANAGER,
      Manager: UserRoleValues.TECHNICAL_MANAGER,
      User: UserRoleValues.TEST_ENGINEER,
    };

    const mappedRoles = azureRoles
      .map((role) => roleMap[role])
      .filter((role) => role !== undefined);

    return mappedRoles.length > 0 ? mappedRoles : [UserRoleValues.TEST_ENGINEER]; // 기본값은 시험실무자
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
      throw new UnauthorizedException({
        code: 'AUTH_USER_NOT_FOUND',
        message: `User not found: ${email}`,
      });
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
    // 블랙리스트 확인 (로그아웃된 토큰 거부)
    if (await this.blacklist.isBlacklisted(refreshToken)) {
      this.eventEmitter.emit('audit.auth.failed', {
        event: 'refresh_denied',
        reason: 'blacklisted_token',
        timestamp: new Date().toISOString(),
      });
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_BLACKLISTED',
        message: 'This refresh token has been invalidated by logout.',
      });
    }

    try {
      const refreshSecret =
        this.configService.get<string>('REFRESH_TOKEN_SECRET') ||
        this.configService.get<string>('JWT_SECRET') + '_refresh';

      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });

      // type 클레임 확인: access token으로 refresh 시도 방지
      if (payload.type !== 'refresh') {
        this.eventEmitter.emit('audit.auth.failed', {
          event: 'refresh_denied',
          reason: 'invalid_token_type',
          email: payload.email,
          timestamp: new Date().toISOString(),
        });
        throw new UnauthorizedException({
          code: 'AUTH_INVALID_REFRESH_TOKEN',
          message: 'Invalid refresh token.',
        });
      }

      // 절대 세션 만료 검증 (30일)
      // 하위 호환: sessionStartedAt 없는 기존 토큰은 스킵
      if (payload.sessionStartedAt) {
        const sessionAge = Math.floor(Date.now() / 1000) - payload.sessionStartedAt;
        if (sessionAge > ABSOLUTE_SESSION_MAX_AGE_SECONDS) {
          this.eventEmitter.emit('audit.auth.failed', {
            event: 'refresh_denied',
            reason: 'absolute_session_expired',
            email: payload.email,
            sessionAge,
            timestamp: new Date().toISOString(),
          });
          throw new UnauthorizedException({
            code: 'AUTH_SESSION_EXPIRED',
            message: 'Session has expired. Please log in again.',
          });
        }
      }

      const userId = payload.sub;
      if (!userId) {
        throw new UnauthorizedException({
          code: 'AUTH_REFRESH_NO_USER',
          message: 'No user information in refresh token.',
        });
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
        throw new UnauthorizedException({
          code: 'AUTH_USER_NOT_FOUND',
          message: 'User not found.',
        });
      }

      // sessionStartedAt 전파: 기존 값 유지 (세션 시작 시점 보존)
      return this.generateToken(
        {
          id: dbUser.id,
          email: dbUser.email as string,
          name: dbUser.name as string,
          roles: [dbUser.role as UserRole],
          department: undefined,
          site: (dbUser.site as UserDto['site']) ?? undefined,
          location: (dbUser.location as UserDto['location']) ?? undefined,
          position: dbUser.position ?? undefined,
          teamId: dbUser.teamId ?? undefined,
        },
        payload.sessionStartedAt
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.warn(`refreshTokens() 실패: ${(error as Error).message}`);
      throw new UnauthorizedException({
        code: 'AUTH_REFRESH_EXPIRED',
        message: 'Refresh token is expired or invalid.',
      });
    }
  }

  /**
   * 로그아웃 처리 — Access Token + Refresh Token 블랙리스트 등록
   *
   * 토큰의 남은 TTL만큼 블랙리스트에 유지하여 메모리 낭비를 방지합니다.
   * Access Token (최대 15분) + Refresh Token (최대 7일)
   */
  async logout(accessToken: string, refreshToken?: string): Promise<void> {
    // Access Token 블랙리스트 등록
    try {
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      const accessPayload = this.jwtService.verify(accessToken, {
        secret: jwtSecret,
        ignoreExpiration: true, // 만료된 토큰도 블랙리스트 등록 (이중 안전)
      });

      this.blacklist.add(accessToken, this.getRemainingTtlMs(accessPayload.exp));
    } catch {
      this.logger.warn('logout(): access token 디코딩 실패 (이미 만료된 토큰일 수 있음)');
    }

    // Refresh Token 블랙리스트 등록
    if (refreshToken) {
      try {
        const refreshSecret =
          this.configService.get<string>('REFRESH_TOKEN_SECRET') ||
          this.configService.get<string>('JWT_SECRET') + '_refresh';

        const refreshPayload = this.jwtService.verify(refreshToken, {
          secret: refreshSecret,
          ignoreExpiration: true,
        });

        this.blacklist.add(refreshToken, this.getRemainingTtlMs(refreshPayload.exp));
      } catch {
        this.logger.warn('logout(): refresh token 디코딩 실패');
      }
    }

    this.logger.log('사용자 로그아웃 처리 완료 (토큰 블랙리스트 등록)');
  }

  /**
   * 토큰이 블랙리스트에 등록되었는지 확인
   */
  isTokenBlacklisted(token: string): Promise<boolean> {
    return this.blacklist.isBlacklisted(token);
  }

  /**
   * JWT exp 클레임으로부터 남은 TTL(ms) 계산
   */
  private getRemainingTtlMs(exp?: number): number {
    if (!exp) return 0;
    const remaining = exp * 1000 - Date.now();
    return Math.max(remaining, 0);
  }

  /**
   * JWT 토큰 생성 (Access Token 15분 + Refresh Token 7일)
   *
   * @param user - 사용자 정보
   * @param sessionStartedAt - 세션 시작 시간 (refresh 시 전파, 신규 로그인 시 현재 시간)
   */
  private generateToken(user: UserDto, sessionStartedAt?: number): AuthResponse {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const refreshSecret =
      this.configService.get<string>('REFRESH_TOKEN_SECRET') || jwtSecret + '_refresh';

    // 신규 로그인 시 현재 시간, refresh 시 기존 값 전파
    const sessionStart = sessionStartedAt ?? Math.floor(Date.now() / 1000);

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
      sessionStartedAt: sessionStart,
    };

    const refreshPayload = {
      sub: user.id,
      email: user.email,
      type: 'refresh' as const,
      sessionStartedAt: sessionStart,
    };

    return {
      access_token: this.jwtService.sign(accessPayload, {
        secret: jwtSecret,
        expiresIn: ACCESS_TOKEN_EXPIRES_IN, // shared-constants: '900s'
      }),
      refresh_token: this.jwtService.sign(refreshPayload, {
        secret: refreshSecret,
        expiresIn: REFRESH_TOKEN_EXPIRES_IN, // shared-constants: '604800s'
      }),
      expires_at: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS, // shared-constants
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
