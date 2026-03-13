import { ForbiddenException } from '@nestjs/common';
import {
  type FeatureScopePolicy,
  type UserRole,
  resolveDataScope,
} from '@equipment-management/shared-constants';
import { ErrorCode } from '@equipment-management/schemas';
import type { AuthenticatedRequest } from '../../types/auth';

/**
 * 데이터 스코프 격리 검증 — UUID 기반 변형 엔드포인트에서 post-fetch 검증용.
 *
 * 목록 엔드포인트는 @SiteScoped + SiteScopeInterceptor가 query 주입으로 처리하지만,
 * 상세/수정/삭제 등 단일 엔티티 엔드포인트는 이 함수로 사후 검증합니다.
 *
 * scope.type별 검증 (SiteScopeInterceptor와 대칭):
 * - 'all'  → 즉시 통과
 * - 'none' → ForbiddenException (fail-close)
 * - 'site' → user.site 없으면 거부 / entitySite !== user.site → 거부
 * - 'team' → ① site 먼저 검증 (defense-in-depth, 팀⊂사이트)
 *           → ② entityTeamId null → site 통과했으므로 허용 (site fallback)
 *           → ③ user.teamId null → site 통과했으므로 허용 (site fallback)
 *           → ④ entityTeamId !== user.teamId → 거부
 *
 * @param req           인증된 요청 (JWT에서 추출된 user 포함)
 * @param entitySite    대상 엔티티의 사이트 (equipment.site 등)
 * @param policy        해당 기능의 FeatureScopePolicy
 * @param entityTeamId  대상 엔티티의 팀 ID (team scope 검증 시)
 */
export function enforceSiteAccess(
  req: AuthenticatedRequest,
  entitySite: string,
  policy: FeatureScopePolicy,
  entityTeamId?: string | null
): void {
  const userRole = req.user?.roles?.[0] as UserRole | undefined;
  if (!userRole) {
    throw new ForbiddenException({
      code: ErrorCode.ScopeAccessDenied,
      message: 'User role not found in request.',
    });
  }

  const scope = resolveDataScope(
    { role: userRole, site: req.user?.site, teamId: req.user?.teamId },
    policy
  );

  // 'all' → 즉시 통과
  if (scope.type === 'all') {
    return;
  }

  // 'none' → fail-close
  if (scope.type === 'none') {
    throw new ForbiddenException({
      code: ErrorCode.ScopeAccessDenied,
      message: 'No data access scope assigned for this role.',
    });
  }

  // 'site' 및 'team'(defense-in-depth) → site 검증
  const userSite = req.user?.site;
  if (!userSite) {
    throw new ForbiddenException({
      code: ErrorCode.ScopeAccessDenied,
      message: 'User site information not found.',
    });
  }

  if (entitySite !== userSite) {
    throw new ForbiddenException({
      code: ErrorCode.ScopeAccessDenied,
      message: 'No permission to access resources from other sites.',
    });
  }

  // 'team' → 추가 팀 검증 (site 통과 후)
  if (scope.type === 'team') {
    // entityTeamId null → site fallback 허용 (SiteScopeInterceptor 대칭)
    if (!entityTeamId) return;
    // user.teamId null → site fallback 허용
    if (!req.user?.teamId) return;
    // 팀 불일치 → 거부
    if (entityTeamId !== req.user.teamId) {
      throw new ForbiddenException({
        code: ErrorCode.ScopeAccessDenied,
        message: 'No permission to access resources from other teams.',
      });
    }
  }
}
