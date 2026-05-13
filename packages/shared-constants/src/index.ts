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
  AUTH_ERROR_CODE,
  type AuthErrorCode,
  AUTH_EVENT,
  type AuthEventType,
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
  EQUIPMENT_MANAGER_ELIGIBLE_ROLES,
  isEligibleAsEquipmentManager,
} from './roles';

// 권한 관련
export {
  Permission,
  PERMISSION_LABELS,
  PERMISSION_LABELS_EN,
  PERMISSION_LABELS_LOCALIZED,
} from './permissions';

// 역할-권한 매핑
export {
  ROLE_PERMISSIONS,
  hasPermission,
  getPermissions,
  derivePermissionsFromRoles,
  userHasPermission,
} from './role-permissions';

// 역할-권한 reverse-index 매트릭스 (DERIVED VIEW from ROLE_PERMISSIONS)
export {
  ROLE_PERMISSION_MATRIX,
  getRolesWithPermission,
  roleHasPermission,
  type RolePermissionMatrix,
} from './role-permission-matrix';

// 권한 카테고리
export {
  PERMISSION_CATEGORIES,
  PERMISSION_CATEGORY_KEYS,
  type PermissionCategoryKey,
} from './permission-categories';

// API 엔드포인트
export { API_ENDPOINTS, type ApiEndpoints } from './api-endpoints';

// API 라우팅 SSOT — Same-Origin Reverse-Proxy 모델 (ADR-0006)
// next.config.js rewrites + nginx 분기 + proxy.ts matcher + auth.ts 호출이 모두 같은 SSOT 사용
export {
  RELATIVE_API_BASE,
  NEXTAUTH_PATH_PREFIX,
  BACKEND_AUTH_PATHS,
  type BackendAuthPath,
  NEXTAUTH_HANDLER_PATHS,
  type NextAuthHandlerPath,
  NEXTAUTH_HANDLER_PATH_REGEX,
  BACKEND_AUTH_PATH_REGEX,
  isNextAuthHandlerPath,
  isBackendAuthPath,
  API_ROUTING_ENV,
} from './api-routing';

// Dashboard scope (BE Zod enum + FE 타입 SSOT)
export { DASHBOARD_SCOPES, type DashboardScope } from './dashboard-scope';

// 프론트엔드 라우트 + URL intent 상수
export {
  FRONTEND_ROUTES,
  type FrontendRoutes,
  getApprovalPageUrl,
  QUERY_INTENTS,
  CHECKOUT_QUERY_PARAMS,
  HELP_TOPIC_KEYS,
  type HelpTopicKey,
} from './frontend-routes';

// 반출 목적별 장비 선택 가능성 규칙
export {
  CALIBRATION_REPAIR_ALLOWED_STATUSES,
  RENTAL_ALLOWED_STATUSES,
  PURPOSE_ALLOWED_STATUSES,
  getAllowedStatusesForPurpose,
  CHECKOUT_HIDDEN_STATUSES,
  CHECKOUT_BLOCKED_REASONS,
  getBlockedReasonKey,
  CHECKOUT_MAX_EQUIPMENT_COUNT,
  USER_SELECTABLE_PURPOSES,
  getAvailablePurposes,
  isPurposeCompatibleWithEquipment,
  type BlockedReasonI18n,
  type EquipmentSelectability,
  type UserSelectablePurpose,
  type PurposeAvailability,
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
export { VALIDATION_RULES, UUID_TEST_REGEX, UUID_PATTERN_SOURCE } from './validation-rules';

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
  QUERY_SAFETY_LIMITS,
  UTILIZATION_THRESHOLDS,
  REPORT_UTILIZATION_THRESHOLDS,
  CALIBRATION_THRESHOLDS,
  SIGNATURE_UPLOAD_LIMITS,
  EXPORT_QUERY_LIMITS,
  HISTORY_CARD_QUERY_LIMIT,
  HISTORY_CARD_QUERY_LIMITS,
  MIGRATION_SESSION_TTL_MS,
  MIGRATION_EXECUTION_TIMEOUT_MS,
  APPROVAL_REVOCATION_WINDOW_MS,
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

// 파일 업로드 타입 (MIME 타입, 확장자, 문서별 규칙)
export {
  FILE_TYPES,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MIME_TO_EXTENSIONS,
  EXTENSION_TO_MIME,
  DOCUMENT_FILE_RULES,
  FILE_UPLOAD_LIMITS,
  MIME_TO_MAGIC_BYTES,
  REPORT_EXPORT_MIME,
  MIME_TO_CATEGORY,
  getMimeCategory,
  FORM_TEMPLATE_FILE_RULE,
  FORM_TEMPLATE_ALLOWED_EXTENSIONS,
  FORM_TEMPLATE_ALLOWED_MIMES,
  resolveFormTemplateExtension,
  type FileTypeEntry,
  type DocumentFileRule,
  type MimeCategory,
} from './file-types';

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
  SELF_INSPECTION_DATA_SCOPE,
  EQUIPMENT_IMPORT_DATA_SCOPE,
  CALIBRATION_PLAN_DATA_SCOPE,
  TEST_SOFTWARE_DATA_SCOPE,
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

// 중간점검 항목 프리셋 (UL-QP-18 기반)
export {
  INSPECTION_CHECK_ITEM_PRESETS,
  type InspectionCheckItemPreset,
  type InspectionCheckItemPresetKey,
} from './inspection-check-item-presets';

// UL-QP-18 양식 카탈로그 (SSOT)
export {
  FORM_CATALOG,
  FORM_NUMBERS,
  FORM_NAMES,
  isFormImplemented,
  isFormDedicatedEndpoint,
  getFormCatalogEntryByName,
  type FormCatalogEntry,
  type FormCategory,
  type FormNumber,
} from './form-catalog';

// 폰트 정책 SSOT (Web UI + 출력물 공통)
export {
  FONT_FAMILY,
  FONT_STACKS,
  CSS_FONT_STACKS,
  FONT_CSS_VARIABLE_NAMES,
  FONT_CSS_VARIABLES,
  FONT_USAGE_CLASSES,
  DOCUMENT_FONT_POLICY,
  toCssFontFamily,
  buildDocxRunPropertiesXml,
} from './font-policy';

// 에러 코드 (백엔드 throw payload.code + 프론트엔드 비교 SSOT)
export {
  MigrationErrorCode,
  type MigrationErrorCode as MigrationErrorCodeType,
} from './error-codes';

// QR 코드 및 라벨 인쇄 설정 (FE 컴포넌트 + 라벨 PDF 공유)
export {
  QR_CONFIG,
  LABEL_CONFIG,
  LABEL_SIZE_PRESETS,
  LABEL_LAYOUT_CONSTRAINTS,
  getLabelCellDimensions,
  resolveLayoutMode,
  LABEL_SAMPLER_LAYOUT,
  LABEL_SAMPLER_CONFIG,
  PT_TO_MM,
  getSamplerPresetOrder,
  type QrConfig,
  type LabelConfig,
  type LabelItem,
  type LabelSizePreset,
  type LabelLayoutMode,
  type LabelSamplerConfig,
  type LabelSamplerLayout,
} from './qr-config';

// QR URL 빌더 / 파서 (FE/BE 공용 SSOT)
export { EQUIPMENT_QR_PATH_PREFIX, buildEquipmentQRUrl, parseEquipmentQRUrl } from './qr-url';

// QR 모바일 랜딩 액션 권한 (FE/BE 공용 SSOT — 서버가 계산, 클라이언트는 렌더)
export {
  QR_ACTION_VALUES,
  QR_ACTION_I18N_KEYS,
  QR_ACTION_PRIORITY,
  QR_ACTION_GROUP,
  QR_ACTION_GROUP_ORDER,
  type QRAllowedAction,
  type QRActionGroup,
} from './qr-access';

// 장비 상태 → 시각 톤 매핑 (FE/BE 공용 SSOT — 4-tier 색 분리)
export {
  EQUIPMENT_STATUS_TONE,
  EQUIPMENT_STATUS_I18N_KEYS,
  EQUIPMENT_STATUS_VALUES,
  type EquipmentStatusTone,
} from './equipment-status-tone';

// 교정기한 초과 대상 제외 장비 상태 (Scheduler + API 공유 SSOT)
export { EXCLUDED_OVERDUE_EQUIPMENT_STATUSES } from './calibration-overdue';

// 대시보드 임계값 SSOT (대시보드 개선안 v1)
// — D-day 톤, 가동률 게이지, 분포 막대, 시스템 상태, 검토 처리율 모두 단일 소스
export {
  DDAY_THRESHOLDS,
  UTILIZATION_GAUGE_THRESHOLDS,
  DISTRIBUTION_BAR_THRESHOLDS,
  SYSTEM_HEALTH_THRESHOLDS,
  SYSTEM_HEALTH_GAUGE_CAPS,
  SYSTEM_HEALTH_OVERALL_THRESHOLDS,
  REVIEW_PROCESSING_RATE_THRESHOLDS,
  TEAM_DISTRIBUTION_DEFAULT_VISIBLE_ROWS,
  DASHBOARD_TIME_WINDOWS,
  DASHBOARD_CARD_DISPLAY_LIMITS,
} from './dashboard-thresholds';

// 반출 도메인 임계값 SSOT (REVIEW_RESULT.md §4.3 — D-day pill 색상 명세)
// — 대시보드 임계값과 분리: 반출은 단기 워크플로 즉시 조치 의미
export {
  CHECKOUT_DDAY_THRESHOLDS,
  getCheckoutDdayTier,
  resolveInlineActionVariant,
  type CheckoutDdayTier,
  type InlineActionVariantKey,
} from './checkout-thresholds';

// SystemHealthMetricsDto backend identity SSOT (storage / queue / error 데이터 소스 투명성)
export {
  SYSTEM_HEALTH_STORAGE_BACKENDS,
  SYSTEM_HEALTH_QUEUE_BACKENDS,
  SYSTEM_HEALTH_ERROR_SOURCES,
  type SystemHealthStorageBackend,
  type SystemHealthQueueBackend,
  type SystemHealthErrorSource,
} from './system-health-backends';
