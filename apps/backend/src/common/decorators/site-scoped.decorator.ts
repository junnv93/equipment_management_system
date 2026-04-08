import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@equipment-management/schemas';
import type { FeatureScopePolicy } from '@equipment-management/shared-constants';

export const SITE_SCOPED_KEY = 'siteScoped';

export interface SiteScopedOptions {
  /**
   * (레거시) 이 역할에 해당하는 사용자는 사이트 필터링을 건너뜁니다.
   * 새 코드에서는 `policy` 방식을 권장합니다.
   */
  bypassRoles?: UserRole[];
  /**
   * (권장) SSOT 스코프 정책 객체.
   * `data-scope.ts`에 정의된 `FeatureScopePolicy`를 사용하면
   * 역할별 접근 범위(none/team/site/all)를 선언적으로 지정할 수 있습니다.
   *
   * @example
   * ```typescript
   * import { CHECKOUT_DATA_SCOPE } from '@equipment-management/shared-constants';
   *
   * @SiteScoped({ policy: CHECKOUT_DATA_SCOPE })
   * @Get()
   * async findAll(@Query() query: CheckoutQueryDto) { ... }
   * ```
   */
  policy?: FeatureScopePolicy;
  /**
   * site 값을 주입할 query 필드명. 기본값: `'site'`
   *
   * DTO의 사이트 필드명이 표준(`site`)과 다를 때 사용합니다.
   * @example
   * // CalibrationPlanQueryInput처럼 `siteId`를 사용하는 경우:
   * @SiteScoped({ policy: CALIBRATION_PLAN_DATA_SCOPE, siteField: 'siteId' })
   */
  siteField?: string;
  /**
   * teamId 값을 주입할 query 필드명. 기본값: `'teamId'`
   *
   * DTO의 팀 필드명이 표준(`teamId`)과 다를 때 사용합니다.
   */
  teamField?: string;
  /**
   * fail-loud 모드 — 기본값: `false`
   *
   * - `false` (default): 인터셉터가 `req.query` 에 enforced 값을 silent 주입.
   *   list / search 라우트의 backward compat 동작.
   * - `true`: `req.query` mutation 생략. enforced 결과를 `req.enforcedScope` 에만
   *   attach 하여 controller / service 가 명시적으로 받아 SQL WHERE 에 바인딩.
   *   민감한 export / 다운로드 라우트에서 사용 권장 — cross-site mismatch 가
   *   ForbiddenException 으로 즉시 실패하고 audit access_denied 에 잡힘.
   *
   * 두 모드 모두 `req.dataScope` 와 `req.enforcedScope` 는 항상 attach 됨
   * (`@CurrentScope()` / `@CurrentEnforcedScope()` parameter decorator 사용 가능).
   */
  failLoud?: boolean;
}

/**
 * @SiteScoped 데코레이터
 *
 * 사용자의 역할/사이트/팀에 기반하여 데이터 접근 범위를 제한합니다.
 * SiteScopeInterceptor와 함께 동작하며, 역할에 따라 req.query에
 * site 또는 teamId를 자동 주입합니다.
 *
 * **권장 방식 (`policy`)**: SSOT `FeatureScopePolicy` 사용
 * **레거시 방식 (`bypassRoles`)**: 사이트 필터링 우회 역할 목록 지정
 *
 * @example
 * ```typescript
 * // 권장: SSOT 정책 객체 사용
 * @SiteScoped({ policy: EQUIPMENT_DATA_SCOPE })
 * @Get()
 * async findAll(@Query() query: EquipmentQueryDto) { ... }
 *
 * // 레거시: bypassRoles 방식
 * @SiteScoped({ bypassRoles: ['lab_manager', 'system_admin'] })
 * @Get()
 * async findAll(@Query() query: UserQueryDto) { ... }
 * ```
 */
export const SiteScoped = (options: SiteScopedOptions = {}): MethodDecorator & ClassDecorator =>
  SetMetadata(SITE_SCOPED_KEY, options);
