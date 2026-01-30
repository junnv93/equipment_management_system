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
 */

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
} from './roles';

// 권한 관련
export { Permission, PERMISSION_LABELS } from './permissions';

// 역할-권한 매핑
export { ROLE_PERMISSIONS, hasPermission, getPermissions } from './role-permissions';

// API 엔드포인트
export { API_ENDPOINTS, type ApiEndpoints } from './api-endpoints';

// 프론트엔드 라우트
export { FRONTEND_ROUTES, type FrontendRoutes } from './frontend-routes';
