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
  isQualityManagerOrAbove,
  isQualityManager,
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
export { FRONTEND_ROUTES, type FrontendRoutes, getApprovalPageUrl } from './frontend-routes';

// 반출 목적별 장비 선택 가능성 규칙
export {
  CALIBRATION_REPAIR_ALLOWED_STATUSES,
  RENTAL_ALLOWED_STATUSES,
  PURPOSE_ALLOWED_STATUSES,
  getAllowedStatusesForPurpose,
  CHECKOUT_HIDDEN_STATUSES,
  CHECKOUT_BLOCKED_REASONS,
  getBlockedReason,
  CHECKOUT_MAX_EQUIPMENT_COUNT,
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

// 페이지네이션 (Backend 서비스 기본값 + Frontend 목록 컴포넌트 공유)
export {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  DASHBOARD_ITEM_LIMIT,
  DASHBOARD_ACTIVITIES_LIMIT,
  SELECTOR_PAGE_SIZE,
  type PageSizeOption,
} from './pagination';

// 검증 규칙 (Backend DTO + Frontend Form 공유)
export { VALIDATION_RULES } from './validation-rules';

// 승인 KPI 상수 (긴급 임계값 등)
export { APPROVAL_KPI } from './approval-kpi';

// 승인 카테고리 (역할별 매핑 — Backend/Frontend SSOT)
export {
  type ApprovalCategory,
  APPROVAL_CATEGORY_VALUES,
  ROLE_APPROVAL_CATEGORIES,
  hasApprovalCategory,
} from './approval-categories';

// 비즈니스 규칙 상수 (리포트, 모니터링, 알림 등)
export {
  REPORT_CONSTANTS,
  REPORT_EXPORT_ROW_LIMIT,
  MONITORING_THRESHOLDS,
  NOTIFICATION_RETENTION_DAYS,
  BATCH_QUERY_LIMITS,
  UTILIZATION_THRESHOLDS,
  REPORT_UTILIZATION_THRESHOLDS,
  CALIBRATION_THRESHOLDS,
} from './business-rules';

// 보안 상수 (로그인 제한, 잠금 정책)
export { SECURITY } from './security';

// 알림 설정 (TTL 등)
export {
  NOTIFICATION_CONFIG,
  SSE_APPROVAL_CHANGED_SENTINEL,
  DIGEST_TIME_OPTIONS,
  DEFAULT_DIGEST_TIME,
  type DigestTime,
} from './notification-config';

// 공용장비 소유처 옵션
export {
  EQUIPMENT_OWNER_OPTIONS,
  type EquipmentOwnerOption,
  type EquipmentOwnerValue,
} from './equipment-owner-options';

// 로케일/타임존 (날짜 포맷팅, 리포트 출력 등 공유)
export { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from './locale';

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
  INTERMEDIATE_CHECK_DATA_SCOPE,
  EQUIPMENT_IMPORT_DATA_SCOPE,
  CALIBRATION_PLAN_DATA_SCOPE,
  SOFTWARE_DATA_SCOPE,
  USER_DATA_SCOPE,
  NOTIFICATION_DATA_SCOPE,
  DISPOSAL_DATA_SCOPE,
  DASHBOARD_DATA_SCOPE,
  EQUIPMENT_REQUEST_DATA_SCOPE,
  REPORT_DATA_SCOPE,
  resolveDataScope,
} from './data-scope';

// 테스트 사용자 상수 (Dev Login + E2E 공유)
export {
  TEST_USERS_BY_TEAM,
  DEFAULT_ROLE_EMAILS,
  ALL_TEST_EMAILS,
  DEFAULT_TEST_TEAM_KEY,
  type TestUserEntry,
  type TestTeamEntry,
  type TestUserSemanticColor,
} from './test-users';
