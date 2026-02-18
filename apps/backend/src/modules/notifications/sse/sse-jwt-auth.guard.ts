import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../auth/auth.service';

/**
 * SSE 전용 JWT 인증 가드
 *
 * 클라이언트(use-notification-stream.ts)는 fetch + ReadableStream 기반으로
 * Authorization: Bearer <jwt> 헤더로 토큰을 전송합니다.
 * EventSource API는 사용하지 않으므로 query param 폴백은 불필요합니다.
 *
 * 보안:
 * - Authorization 헤더 전용 (URL에 토큰 노출 없음)
 * - Access Token 수명 15분 (단기)
 * - 토큰 블랙리스트 확인 (로그아웃 시)
 */
@Injectable()
export class SseJwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(SseJwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Authorization 헤더에서 토큰 추출 (Bearer 방식 전용)
    const authHeader = request.headers?.authorization as string | undefined;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    if (!token) {
      throw new UnauthorizedException({
        code: 'AUTH_SSE_TOKEN_REQUIRED',
        message: 'SSE authentication token is required.',
      });
    }

    try {
      // JWT 검증
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // refresh token은 거부 (access token만 허용)
      if (payload.type === 'refresh') {
        throw new UnauthorizedException({
          code: 'AUTH_ACCESS_TOKEN_ONLY',
          message: 'Only access tokens can be used.',
        });
      }

      // 블랙리스트 확인
      if (await this.authService.isTokenBlacklisted(token)) {
        throw new UnauthorizedException({
          code: 'AUTH_TOKEN_BLACKLISTED',
          message: 'This token has been invalidated by logout.',
        });
      }

      // req.user에 사용자 정보 설정 (JwtStrategy.validate()와 동일 구조)
      request.user = {
        userId: payload.sub,
        email: payload.email,
        name: payload.name,
        roles: payload.roles,
        department: payload.department,
        site: payload.site,
        teamId: payload.teamId,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.debug(
        `SSE JWT 검증 실패: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_TOKEN',
        message: 'Invalid authentication token.',
      });
    }
  }
}
