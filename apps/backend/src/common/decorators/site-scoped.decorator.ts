import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@equipment-management/schemas';

export const SITE_SCOPED_KEY = 'siteScoped';

export interface SiteScopedOptions {
  /** 이 역할에 해당하는 사용자는 사이트 필터링을 건너뜁니다 */
  bypassRoles?: UserRole[];
}

/**
 * @SiteScoped 데코레이터
 *
 * 사용자의 사이트에 기반하여 데이터 접근을 제한합니다.
 * SiteScopeInterceptor와 함께 사용하면, 사용자의 JWT에서 site를 추출하여
 * req.query.site에 강제 주입합니다.
 *
 * bypassRoles에 포함된 역할은 사이트 필터링을 건너뜁니다.
 *
 * @example
 * ```typescript
 * @SiteScoped({ bypassRoles: ['lab_manager', 'system_admin'] })
 * @Get()
 * async findAll(@Query() query: UserQueryDto) { ... }
 * ```
 */
export const SiteScoped = (options: SiteScopedOptions = {}): MethodDecorator & ClassDecorator =>
  SetMetadata(SITE_SCOPED_KEY, options);
