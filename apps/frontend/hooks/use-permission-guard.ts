/**
 * 페이지 레벨 Permission Guard 훅
 *
 * 권한이 없는 사용자가 직접 URL로 접근할 때 리다이렉트 처리.
 * SSOT: shared-constants/role-permissions.ts → useAuth().can()
 *
 * @example
 * // 단일 권한
 * const { allowed, loading } = usePermissionGuard(Permission.CREATE_CALIBRATION_PLAN);
 *
 * // 복수 권한 (OR — 하나라도 있으면 허용)
 * const { allowed, loading } = usePermissionGuard([
 *   Permission.APPROVE_CALIBRATION_PLAN,
 *   Permission.REVIEW_CALIBRATION_PLAN,
 * ]);
 */

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Permission } from '@equipment-management/shared-constants';
import { useAuth } from './use-auth';

interface PermissionGuardOptions {
  /** 권한 없을 때 리다이렉트 경로 (기본값: 이전 경로의 부모, 예: /calibration-plans/create → /calibration-plans) */
  redirectTo?: string;
}

interface PermissionGuardResult {
  /** 권한 확인 완료 + 접근 허용 */
  allowed: boolean;
  /** 세션 로딩 중 (아직 판단 불가) */
  loading: boolean;
}

export function usePermissionGuard(
  permission: Permission | Permission[],
  options?: PermissionGuardOptions
): PermissionGuardResult {
  const { can, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // 안정된 의존성 키: Permission은 string enum이므로 join으로 직렬화
  const permissionKey = Array.isArray(permission) ? permission.join(',') : permission;
  const permissions = useMemo(
    () => (Array.isArray(permission) ? permission : [permission]),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- permissionKey는 permission의 직렬화 값으로 안정적 의존성 역할
    [permissionKey]
  );
  const allowed = !isLoading && isAuthenticated && permissions.some((p) => can(p));

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return;
    if (permissions.some((p) => can(p))) return;

    const target = options?.redirectTo ?? getFallbackPath();
    router.replace(target);
  }, [isLoading, isAuthenticated, can, router, options?.redirectTo, permissions]);

  return { allowed, loading: isLoading };
}

/** 현재 pathname에서 부모 경로 추출 (/a/b/c → /a/b) */
function getFallbackPath(): string {
  if (typeof window === 'undefined') return '/';
  const segments = window.location.pathname.split('/').filter(Boolean);
  if (segments.length <= 1) return '/';
  return '/' + segments.slice(0, -1).join('/');
}
