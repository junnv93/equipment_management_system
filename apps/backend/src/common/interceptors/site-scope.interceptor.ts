import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { SITE_SCOPED_KEY, SiteScopedOptions } from '../decorators/site-scoped.decorator';
import type { AuthenticatedRequest } from '../../types/auth';

/**
 * SiteScopeInterceptor
 *
 * @SiteScoped() 데코레이터가 적용된 엔드포인트에서
 * 사용자의 JWT site를 req.query.site에 강제 주입하여
 * 사이트 기반 데이터 격리를 보장합니다.
 *
 * bypassRoles에 포함된 역할(예: lab_manager, system_admin)은
 * 모든 사이트의 데이터에 접근할 수 있습니다.
 */
@Injectable()
export class SiteScopeInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SiteScopeInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // @SiteScoped() 메타데이터 확인
    const options = this.reflector.getAllAndOverride<SiteScopedOptions | undefined>(
      SITE_SCOPED_KEY,
      [context.getHandler(), context.getClass()]
    );

    // 메타데이터 없으면 스킵
    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    // 인증되지 않은 요청은 스킵 (JwtAuthGuard가 먼저 처리)
    if (!user) {
      return next.handle();
    }

    // bypassRoles에 사용자 역할이 포함되면 스킵
    const userRole = user.roles?.[0];
    if (options.bypassRoles && userRole && options.bypassRoles.includes(userRole as never)) {
      return next.handle();
    }

    // 사용자의 site가 없으면 차단 (사이트 미할당 비관리자)
    if (!user.site) {
      this.logger.warn(`[SECURITY] User ${user.userId} has no site — blocking access`);
      throw new ForbiddenException(
        '사이트가 할당되지 않은 사용자는 이 리소스에 접근할 수 없습니다.'
      );
    }

    // req.query.site에 사용자 사이트 강제 주입
    if (!request.query) {
      request.query = {};
    }
    (request.query as Record<string, string>).site = user.site;

    return next.handle();
  }
}
