/**
 * @equipment-management/shared-constants
 *
 * 공유 상수 패키지 - SSOT (Single Source of Truth)
 *
 * 이 패키지는 백엔드/프론트엔드 간 공유되는 상수들의 단일 소스입니다.
 * - 역할 (Roles): @equipment-management/schemas에서 re-export
 * - 권한 (Permissions): 이 패키지에서 정의
 * - 역할-권한 매핑 (Role-Permissions): 이 패키지에서 정의
 * - API 엔드포인트: 이 패키지에서 정의
 * - 인증 토큰 라이프사이클: auth-token.ts에서 정의 (FE/BE 공유)
 */

// 인증 토큰 라이프사이클 상수 (프론트엔드 NextAuth + 백엔드 JWT 공유)
export {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  ABSOLUTE_SESSION_MAX_AGE_SECONDS,
  REFRESH_BUFFER_SECONDS,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  IDLE_TIMEOUT_SECONDS,
  IDLE_WARNING_BEFORE_SECONDS,
  IDLE_ACTIVITY_THROTTLE_MS,
  SESSION_SYNC_CHANNEL,
  SESSION_SYNC_MESSAGE,
  type SessionSyncMessageType,
} from './auth-token';

// 역할 관련
export {
  UserRoleEnum,
  type UserRole,
  USER_ROLE_VALUES,
  USER_ROLE_LABELS,
  UserRoleValues,
  ROLE_HIERARCHY,
  hasEqualOrHigherRole,
  isTechnicalManagerOrAbove,
  isLabManager,
  isLabManagerOrAbove,
  isSystemAdmin,
  APPROVAL_ROLES,
  ADMIN_ROLES,
  TEAM_RESTRICTED_ROLES,
  SITE_RESTRICTED_ROLES,
  TEAMS_SITE_RESTRICTED_ROLES,
  canApprove,
  isTeamRestricted,
  isSiteRestricted,
} from './roles';

// 권한 관련
export { Permission, PERMISSION_LABELS } from './permissions';

// 역할-권한 매핑
export { ROLE_PERMISSIONS, hasPermission, getPermissions } from './role-permissions';

// 권한 카테고리
export {
  PERMISSION_CATEGORIES,
  PERMISSION_CATEGORY_KEYS,
  type PermissionCategoryKey,
} from './permission-categories';

// API 엔드포인트
export { API_ENDPOINTS, type ApiEndpoints } from './api-endpoints';

// 프론트엔드 라우트
export { FRONTEND_ROUTES, type FrontendRoutes } from './frontend-routes';

// 반출 목적별 장비 선택 가능성 규칙
export {
  CALIBRATION_REPAIR_ALLOWED_STATUSES,
  RENTAL_ALLOWED_STATUSES,
  PURPOSE_ALLOWED_STATUSES,
  getAllowedStatusesForPurpose,
  CHECKOUT_HIDDEN_STATUSES,
  CHECKOUT_BLOCKED_REASONS,
  getBlockedReason,
  type EquipmentSelectability,
} from './checkout-selectability';

// 반출 목적 배지 스타일
export { CHECKOUT_PURPOSE_STYLES, type CheckoutPurposeStyle } from './checkout-purpose-styles';

// 사이트 필터 옵션
export { SITE_FILTER_OPTIONS } from './site-options';

// 알림 카테고리
export {
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_CATEGORY_DESCRIPTIONS,
  NOTIFICATION_CATEGORY_FORM_FIELDS,
} from './notification-categories';

// 엔티티 라우팅
export { ENTITY_ROUTES, getEntityRoute, hasEntityRoute } from './entity-routes';

// 캐시 TTL (Backend SimpleCacheService + Frontend React Query 공유)
export { CACHE_TTL, type CacheTTLTier } from './cache-config';

// 데이터 스코프 정책 (역할별 접근 범위)
export {
  type DataScopeType,
  type DataScopePolicy,
  type FeatureScopePolicy,
  type UserScopeContext,
  type ResolvedDataScope,
  AUDIT_LOG_SCOPE,
  EQUIPMENT_DATA_SCOPE,
  CHECKOUT_DATA_SCOPE,
  NON_CONFORMANCE_DATA_SCOPE,
  CALIBRATION_DATA_SCOPE,
  EQUIPMENT_IMPORT_DATA_SCOPE,
  CALIBRATION_PLAN_DATA_SCOPE,
  SOFTWARE_DATA_SCOPE,
  USER_DATA_SCOPE,
  NOTIFICATION_DATA_SCOPE,
  resolveDataScope,
} from './data-scope';
