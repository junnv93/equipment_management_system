import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { JwtUser } from '../../../types/auth';
import { TOKEN_BLACKLIST, TokenBlacklistProvider } from '../blacklist/token-blacklist.interface';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../../common/cache/cache-key-prefixes';
import { UsersService } from '../../users/users.service';

/**
 * JWT 토큰 페이로드 타입
 *
 * JWT 토큰에 포함되는 클레임(claims)을 정의합니다.
 * - sub: Subject - 사용자 ID (JWT 표준 클레임)
 * - iat: Issued At - 토큰 발급 시간 (자동 추가)
 * - exp: Expiration - 토큰 만료 시간 (자동 추가)
 */
interface JwtPayload {
  /** Subject - 사용자 ID (JWT 표준 클레임) */
  sub: string;
  /** 사용자 이메일 */
  email: string;
  /** 사용자 이름 */
  name?: string;
  /** 사용자 역할 목록 */
  roles: string[];
  /** 부서 */
  department?: string;
  /** 사이트 코드 (suwon | uiwang) */
  site?: string;
  /** 팀 ID */
  teamId?: string;
  /** 토큰 발급 시간 (Unix timestamp) */
  iat?: number;
  /** 토큰 만료 시간 (Unix timestamp) */
  exp?: number;
}

/**
 * JWT 인증 전략
 *
 * Authorization: Bearer <token> 헤더에서 JWT를 추출하고 검증합니다.
 * 검증 성공 시 validate() 메서드가 호출되어 req.user에 사용자 정보를 설정합니다.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @Inject(TOKEN_BLACKLIST) private readonly blacklist: TokenBlacklistProvider,
    private readonly usersService: UsersService,
    private readonly cacheService: SimpleCacheService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      algorithms: ['HS256'],
      passReqToCallback: true, // req 객체를 validate()에 전달
    });
  }

  /**
   * JWT 페이로드 검증 및 사용자 객체 반환
   *
   * @param req - HTTP 요청 객체 (passReqToCallback: true)
   * @param payload - 디코딩된 JWT 페이로드
   * @returns req.user에 설정될 사용자 정보
   */
  async validate(
    req: { headers: { authorization?: string } },
    payload: JwtPayload
  ): Promise<JwtUser> {
    // 1. 토큰 블랙리스트 확인
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token && (await this.blacklist.isBlacklisted(token))) {
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_BLACKLISTED',
        message: 'This token has been invalidated by logout.',
      });
    }

    // 2. 사용자 활성화 상태 확인 (캐시 기반, 60초 TTL)
    const userId = payload.sub;
    const cacheKey = `${CACHE_KEY_PREFIXES.USER_ACTIVE}${userId}`;

    const isActive = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // 캐시 미스 시 DB에서 조회
        const user = await this.usersService.findOne(userId);
        return user?.isActive ?? false;
      },
      60 * 1000 // 60초 TTL - 비활성화 후 최대 60초 지연 (장비 관리 시스템에서 충분)
    );

    if (!isActive) {
      throw new UnauthorizedException({
        code: 'AUTH_USER_INACTIVE',
        message: 'User account is deactivated.',
      });
    }

    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
      roles: payload.roles,
      department: payload.department,
      site: payload.site,
      teamId: payload.teamId,
    };
  }
}
