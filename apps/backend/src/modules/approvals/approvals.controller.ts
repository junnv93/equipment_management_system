import { Controller, Get, Query, Req, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedRequest } from '../../types/auth';
import { UserRole } from '@equipment-management/schemas';
import type { UserScopeContext } from '@equipment-management/shared-constants';
import {
  ApprovalsService,
  PendingCountsByCategory,
  ApprovalKpiResponse,
} from './approvals.service';
import { SkipPermissions } from '../auth/decorators/skip-permissions.decorator';

/**
 * 승인 관리 컨트롤러
 *
 * 통합 승인 카운트 API를 제공하여 프론트엔드가
 * 한 번의 요청으로 모든 승인 배지 개수를 가져올 수 있도록 함
 */
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  /**
   * 승인 대기 개수 조회
   *
   * GET /api/approvals/counts
   *
   * 현재 사용자의 역할과 권한에 따라 접근 가능한
   * 모든 승인 카테고리의 대기 개수를 반환
   *
   * @returns 카테고리별 승인 대기 개수
   *
   * @example
   * Response:
   * {
   *   "outgoing": 5,        // 반출 (checkouts + vendor returns)
   *   "incoming": 3,        // 반입 (returns + rental imports + shared imports)
   *   "equipment": 2,       // 장비 등록/수정/삭제
   *   "calibration": 4,     // 교정 기록
   *   "inspection": 0,      // 중간점검
   *   "nonconformity": 1,   // 부적합 종료
   *   "disposal_review": 2, // 폐기 검토
   *   "disposal_final": 1,  // 폐기 최종 승인
   *   "plan_review": 0,     // 교정계획서 검토
   *   "plan_final": 0,      // 교정계획서 최종
   *   "software": 0         // 소프트웨어 검증
   * }
   */
  @Get('counts')
  @SkipPermissions()
  async getCounts(@Req() req: AuthenticatedRequest): Promise<PendingCountsByCategory> {
    const userId = req.user?.userId;
    const userRole = req.user?.roles?.[0] as UserRole;

    if (!userId) {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_SESSION',
        message: 'Authentication info is invalid. Please log in again.',
      });
    }

    const userCtx: UserScopeContext = {
      role: userRole,
      site: req.user.site ?? undefined,
      teamId: req.user.teamId ?? undefined,
    };

    return this.approvalsService.getPendingCountsByRole(userCtx);
  }

  /**
   * 승인 KPI 조회
   *
   * GET /api/approvals/kpi?category=outgoing
   *
   * 서버 사이드 집계 KPI:
   * - todayProcessed: 오늘 처리 건수
   * - urgentCount: 카테고리별 긴급 건수 (URGENT_THRESHOLD_DAYS 이상 경과)
   * - avgWaitDays: 카테고리별 평균 대기일
   *
   * @param category - 선택적 카테고리 (미지정 시 urgentCount/avgWaitDays = 0)
   */
  @Get('kpi')
  @SkipPermissions()
  async getKpi(
    @Req() req: AuthenticatedRequest,
    @Query('category') category?: string
  ): Promise<ApprovalKpiResponse> {
    const userId = req.user?.userId;
    const userRole = req.user?.roles?.[0] as UserRole;

    if (!userId) {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_SESSION',
        message: 'Authentication info is invalid. Please log in again.',
      });
    }

    const userCtx: UserScopeContext = {
      role: userRole,
      site: req.user.site ?? undefined,
      teamId: req.user.teamId ?? undefined,
    };

    return this.approvalsService.getKpi(userId, userCtx, category);
  }
}
