/**
 * RoleGate — 역할 기반 UI 가시성 제어 (대시보드 개선안 §A.19.2).
 *
 * 효과 역할(`useEffectiveRole().effectiveRole`)이 허용 목록에 포함될 때만 children 렌더.
 * 시뮬 모드 중에는 시뮬 역할로 평가되므로 시뮬 view 미리보기에 사용 가능.
 *
 * API 권한 가드는 백엔드의 `RequirePermissions` 데코레이터가 actualRole을 기준으로 별도 처리한다.
 * 본 컴포넌트는 UI presentation 전용 — 실제 권한 분리는 API에서 강제된다.
 *
 * 사용 예:
 *   <RoleGate roles={['system_admin']} fallback={<UpgradePrompt />}>
 *     <SystemHealthCard ... />
 *   </RoleGate>
 */

'use client';

import type { ReactNode } from 'react';
import type { UserRole } from '@equipment-management/schemas';
import { useEffectiveRole } from '@/hooks/use-effective-role';

interface RoleGateProps {
  roles: readonly UserRole[];
  children: ReactNode;
  /** 권한 없을 때 렌더할 콘텐츠 (기본 null = 숨김). */
  fallback?: ReactNode;
}

export function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const { effectiveRole } = useEffectiveRole();
  if (!effectiveRole || !roles.includes(effectiveRole)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
