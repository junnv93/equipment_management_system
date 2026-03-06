/**
 * 역할별 권한 매핑
 *
 * ⚠️ SSOT: @equipment-management/shared-constants의 ROLE_PERMISSIONS가 원본
 * 이 파일은 백엔드 코드 호환성을 위해 유지
 *
 * 향후 마이그레이션: shared-constants에서 직접 import 권장
 */

import { UserRoleValues } from './roles.enum';
import { Permission } from './permissions.enum';
import { ROLE_PERMISSIONS as SHARED_ROLE_PERMISSIONS } from '@equipment-management/shared-constants';

/**
 * 역할별 권한 매핑 (백엔드 호환용)
 *
 * TypeScript enum 기반 UserRole을 키로 사용하는 버전
 * SHARED_ROLE_PERMISSIONS와 동기화 유지 필요
 */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  [UserRoleValues.TEST_ENGINEER]: SHARED_ROLE_PERMISSIONS.test_engineer,
  [UserRoleValues.TECHNICAL_MANAGER]: SHARED_ROLE_PERMISSIONS.technical_manager,
  [UserRoleValues.QUALITY_MANAGER]: SHARED_ROLE_PERMISSIONS.quality_manager,
  [UserRoleValues.LAB_MANAGER]: SHARED_ROLE_PERMISSIONS.lab_manager,
  [UserRoleValues.SYSTEM_ADMIN]: SHARED_ROLE_PERMISSIONS.system_admin,
};

// shared-constants의 유틸리티 함수도 re-export
export { hasPermission, getPermissions } from '@equipment-management/shared-constants';
