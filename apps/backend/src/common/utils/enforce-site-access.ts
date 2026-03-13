import { ForbiddenException } from '@nestjs/common';
import {
  type FeatureScopePolicy,
  type UserRole,
  resolveDataScope,
} from '@equipment-management/shared-constants';
import type { AuthenticatedRequest } from '../../types/auth';

/**
 * 데이터 스코프 격리 검증 — UUID 기반 변형 엔드포인트에서 post-fetch 검증용.
 *
 * 목록 엔드포인트는 @SiteScoped + SiteScopeInterceptor가 query 주입으로 처리하지만,
 * 상세/수정/삭제 등 단일 엔티티 엔드포인트는 이 함수로 사후 검증합니다.
 *
 * scope.type별 검증:
 * - 'all'  → 검증 생략 (lab_manager, system_admin)
 * - 'site' → entitySite와 사용자 사이트 비교
 * - 'team' → entityTeamId와 사용자 팀 비교 (entityTeamId가 전달된 경우)
 *
 * @param req           인증된 요청 (JWT에서 추출된 user 포함)
 * @param entitySite    대상 엔티티의 사이트 (equipment.site 등)
 * @param policy        해당 기능의 FeatureScopePolicy
 * @param errorCode     ForbiddenException에 포함할 에러 코드
 * @param entityTeamId  대상 엔티티의 팀 ID (team scope 검증 시 필수)
 */
export function enforceSiteAccess(
  req: AuthenticatedRequest,
  entitySite: string,
  policy: FeatureScopePolicy,
  errorCode: string,
  entityTeamId?: string | null
): void {
  const userRole = req.user?.roles?.[0] as UserRole | undefined;
  if (!userRole) {
    throw new ForbiddenException({
      code: errorCode,
      message: 'User role not found in request.',
    });
  }

  const scope = resolveDataScope(
    { role: userRole, site: req.user?.site, teamId: req.user?.teamId },
    policy
  );

  if (scope.type === 'site' && scope.site && entitySite !== scope.site) {
    throw new ForbiddenException({
      code: errorCode,
      message: `No permission to access resources from other sites.`,
    });
  }

  if (scope.type === 'team' && scope.teamId && entityTeamId && entityTeamId !== scope.teamId) {
    throw new ForbiddenException({
      code: errorCode,
      message: `No permission to access resources from other teams.`,
    });
  }
}
