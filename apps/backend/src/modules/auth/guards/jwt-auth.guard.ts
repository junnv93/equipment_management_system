import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SKIP_GLOBAL_JWT_KEY } from '../../../common/decorators/sse-authenticated.decorator';
import { Observable } from 'rxjs';
import { JwtUser } from '../../../types/auth';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // @Public(): 인증 + 권한 모두 생략
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // @SseAuthenticated(): 글로벌 JWT만 우회 (자체 SseJwtAuthGuard 사용, PermissionsGuard는 유지)
    const skipGlobalJwt = this.reflector.getAllAndOverride<boolean>(SKIP_GLOBAL_JWT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipGlobalJwt) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = JwtUser>(
    err: Error | null,
    user: TUser | false,
    _info: unknown,
    _context: ExecutionContext,
    _status?: unknown
  ): TUser {
    // 오류가 있거나 사용자가 없는 경우
    if (err || !user) {
      throw err || new UnauthorizedException('인증에 실패했습니다.');
    }
    return user;
  }
}
