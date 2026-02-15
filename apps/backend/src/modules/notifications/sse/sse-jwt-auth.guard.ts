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
 * EventSource API는 custom HTTP header를 지원하지 않으므로,
 * query parameter로 JWT를 전달받아 인증한다.
 *
 * GET /notifications/stream?token=<jwt>
 *
 * 보안:
 * - HTTPS 환경에서만 사용 (토큰 노출 방지)
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
    const token = request.query?.token as string;

    if (!token) {
      throw new UnauthorizedException('SSE 인증 토큰이 필요합니다.');
    }

    try {
      // JWT 검증
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // refresh token은 거부 (access token만 허용)
      if (payload.type === 'refresh') {
        throw new UnauthorizedException('Access Token만 사용할 수 있습니다.');
      }

      // 블랙리스트 확인
      if (this.authService.isTokenBlacklisted(token)) {
        throw new UnauthorizedException('이 토큰은 로그아웃으로 무효화되었습니다.');
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
      throw new UnauthorizedException('유효하지 않은 인증 토큰입니다.');
    }
  }
}
