import { DASHBOARD_ROLE_CONFIG, DEFAULT_ROLE } from '@/lib/config/dashboard-config';
import type { DashboardRoleConfig } from '@/lib/config/dashboard-config';

/**
 * 역할 문자열을 정규화하여 DashboardRoleConfig를 반환
 *
 * - null/undefined → DEFAULT_ROLE
 * - 대소문자 정규화 (lowercase)
 * - 미등록 role → DEFAULT_ROLE fallback
 *
 * page.tsx(서버)와 DashboardClient(클라이언트) 양쪽에서 동일하게 사용하여
 * role 분기 로직 중복을 제거 (ADD-01 SSOT).
 */
export function resolveDashboardRoleConfig(rawRole: string | null | undefined): {
  role: string;
  config: DashboardRoleConfig;
} {
  const role = rawRole?.toLowerCase() || DEFAULT_ROLE;
  const config = DASHBOARD_ROLE_CONFIG[role] ?? DASHBOARD_ROLE_CONFIG[DEFAULT_ROLE];
  return { role, config };
}
