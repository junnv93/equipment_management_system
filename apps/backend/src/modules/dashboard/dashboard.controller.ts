import {
  Controller,
  Get,
  Query,
  Req,
  ParseIntPipe,
  DefaultValuePipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SKIP_ALL_THROTTLES } from '../../common/config/throttle.constants';
import { DashboardService } from './dashboard.service';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import {
  Permission,
  DASHBOARD_DATA_SCOPE,
  resolveDataScope,
  type UserScopeContext,
} from '@equipment-management/shared-constants';
import { UserRole } from '@equipment-management/schemas';
import type { AuthenticatedRequest } from '../../types/auth';
import {
  DashboardSummaryDto,
  DashboardAggregateDto,
  EquipmentByTeamDto,
  OverdueCalibrationDto,
  UpcomingCalibrationDto,
  OverdueCheckoutDto,
  RecentActivityDto,
  PendingApprovalCountsDto,
  EquipmentStatusStatsDto,
  DashboardCheckoutsScopeDto,
  SystemHealthMetricsDto,
  QualityReviewPendingDto,
  MyQuickSummaryDto,
} from './dto/dashboard-response.dto';
import { UserRoleValues as URVal } from '@equipment-management/schemas';

/**
 * 대시보드 컨트롤러
 *
 * 역할별 맞춤형 대시보드 데이터를 제공합니다.
 * - 모든 엔드포인트는 JWT 인증 및 권한 검증 필요
 * - 역할에 따라 데이터 범위 자동 필터링
 */
@SkipThrottle(SKIP_ALL_THROTTLES)
@ApiTags('대시보드')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * DASHBOARD_DATA_SCOPE 정책으로 teamId/site를 강제화
   *
   * - all: 클라이언트 teamId 허용 (관리자 드릴다운)
   * - site: site 강제 + 클라이언트 teamId 허용 (사이트 내 드릴다운)
   * - team: teamId를 사용자 소속 팀으로 강제 (클라이언트 값 무시)
   * - none: ForbiddenException
   */
  private resolveDashboardScope(
    req: AuthenticatedRequest,
    clientTeamId?: string
  ): { site?: string; teamId?: string } {
    const userRole = req.user.roles?.[0] as UserRole;
    const userCtx: UserScopeContext = {
      role: userRole,
      site: req.user.site,
      teamId: req.user.teamId,
    };
    const scope = resolveDataScope(userCtx, DASHBOARD_DATA_SCOPE);

    switch (scope.type) {
      case 'all':
        return { teamId: clientTeamId };
      case 'site':
        return { site: scope.site, teamId: clientTeamId };
      case 'team':
        return { site: scope.site, teamId: scope.teamId };
      case 'none':
        throw new ForbiddenException('대시보드 접근 권한이 없습니다.');
    }
  }

  /**
   * 대시보드 전체 집계 (SSR 단일 요청용)
   *
   * Next.js Server Component에서 7개의 개별 요청 대신 이 엔드포인트 하나를 사용합니다.
   * 내부적으로 Promise.allSettled로 병렬 처리하며, 부분 실패 시 null 반환.
   */
  @Get('aggregate')
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  @ApiOperation({
    summary: '대시보드 전체 집계 조회 (SSR용)',
    description:
      'SSR에서 단일 HTTP 요청으로 대시보드 전체 데이터를 가져옵니다. ' +
      '내부적으로 7개 서브 쿼리를 병렬 실행하며, 부분 실패 시 해당 필드를 null로 반환합니다.',
  })
  @ApiQuery({ name: 'teamId', required: false, description: '팀 필터' })
  @ApiQuery({ name: 'days', required: false, description: '교정 예정 조회 기간(일)', example: 30 })
  @ApiQuery({
    name: 'activitiesLimit',
    required: false,
    description: '최근 활동 조회 개수',
    example: 20,
  })
  @ApiResponse({ status: 200, description: '대시보드 집계 데이터', type: DashboardAggregateDto })
  async getAggregate(
    @Req() req: AuthenticatedRequest,
    @Query('teamId') teamId?: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number = 30,
    @Query('activitiesLimit', new DefaultValuePipe(20), ParseIntPipe) activitiesLimit: number = 20
  ): Promise<DashboardAggregateDto> {
    const userRole = req.user.roles?.[0] as UserRole;
    const { site, teamId: resolvedTeamId } = this.resolveDashboardScope(req, teamId);

    return this.dashboardService.getAggregate(
      userRole,
      site,
      resolvedTeamId,
      days,
      activitiesLimit
    );
  }

  @Get('summary')
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  @ApiOperation({
    summary: '대시보드 요약 정보 조회',
    description:
      '전체 장비 수, 사용 가능 장비 수, 활성 대여/반출 수, 교정 예정 장비 수를 조회합니다.',
  })
  @ApiQuery({
    name: 'teamId',
    required: false,
    description: '팀 필터 (선택사항)',
  })
  @ApiResponse({
    status: 200,
    description: '대시보드 요약 정보',
    type: DashboardSummaryDto,
  })
  async getSummary(
    @Req() req: AuthenticatedRequest,
    @Query('teamId') teamId?: string
  ): Promise<DashboardSummaryDto> {
    const { site, teamId: resolvedTeamId } = this.resolveDashboardScope(req, teamId);
    return this.dashboardService.getSummary(resolvedTeamId, site);
  }

  @Get('equipment-by-team')
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  @ApiOperation({
    summary: '팀별 장비 현황 조회',
    description: '팀별로 장비 수를 집계하여 반환합니다.',
  })
  @ApiQuery({
    name: 'teamId',
    required: false,
    description: '팀 필터 (선택사항)',
  })
  @ApiResponse({
    status: 200,
    description: '팀별 장비 현황',
    type: [EquipmentByTeamDto],
  })
  async getEquipmentByTeam(
    @Req() req: AuthenticatedRequest,
    @Query('teamId') teamId?: string
  ): Promise<EquipmentByTeamDto[]> {
    const { site, teamId: resolvedTeamId } = this.resolveDashboardScope(req, teamId);
    return this.dashboardService.getEquipmentByTeam(resolvedTeamId, site);
  }

  @Get('overdue-calibrations')
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  @ApiOperation({
    summary: '교정 지연 장비 조회',
    description: '교정 예정일이 지난 장비 목록을 조회합니다.',
  })
  @ApiQuery({
    name: 'teamId',
    required: false,
    description: '팀 필터 (선택사항)',
  })
  @ApiResponse({
    status: 200,
    description: '교정 지연 장비 목록',
    type: [OverdueCalibrationDto],
  })
  async getOverdueCalibrations(
    @Req() req: AuthenticatedRequest,
    @Query('teamId') teamId?: string
  ): Promise<{ items: OverdueCalibrationDto[]; hasMore: boolean }> {
    const { site, teamId: resolvedTeamId } = this.resolveDashboardScope(req, teamId);
    return this.dashboardService.getOverdueCalibrations(resolvedTeamId, site);
  }

  @Get('upcoming-calibrations')
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  @ApiOperation({
    summary: '교정 예정 장비 조회',
    description: '지정된 일수 이내에 교정 예정인 장비 목록을 조회합니다.',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: '조회할 일수 (기본값: 30일)',
    example: 30,
  })
  @ApiQuery({
    name: 'teamId',
    required: false,
    description: '팀 필터 (선택사항)',
  })
  @ApiResponse({
    status: 200,
    description: '교정 예정 장비 목록',
    type: [UpcomingCalibrationDto],
  })
  async getUpcomingCalibrations(
    @Req() req: AuthenticatedRequest,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
    @Query('teamId') teamId?: string
  ): Promise<{ items: UpcomingCalibrationDto[]; hasMore: boolean }> {
    const { site, teamId: resolvedTeamId } = this.resolveDashboardScope(req, teamId);
    return this.dashboardService.getUpcomingCalibrations(days, resolvedTeamId, site);
  }

  @Get('overdue-rentals')
  @RequirePermissions(Permission.VIEW_CHECKOUTS)
  @ApiOperation({
    summary: '반출 지연 조회',
    description: '반납 예정일이 지난 반출(대여/교정/수리 포함) 목록을 조회합니다.',
  })
  @ApiQuery({
    name: 'teamId',
    required: false,
    description: '팀 필터 (선택사항)',
  })
  @ApiResponse({
    status: 200,
    description: '반출 지연 목록',
    type: [OverdueCheckoutDto],
  })
  async getOverdueCheckouts(
    @Req() req: AuthenticatedRequest,
    @Query('teamId') teamId?: string
  ): Promise<{ items: OverdueCheckoutDto[]; hasMore: boolean }> {
    const { site, teamId: resolvedTeamId } = this.resolveDashboardScope(req, teamId);
    return this.dashboardService.getOverdueCheckouts(resolvedTeamId, site);
  }

  @Get('recent-activities')
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  @ApiOperation({
    summary: '최근 활동 내역 조회',
    description: '최근 활동 내역을 조회합니다. 역할에 따라 필터링됩니다.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '조회할 개수 (기본값: 20)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: '최근 활동 내역',
    type: [RecentActivityDto],
  })
  async getRecentActivities(
    @Req() req: AuthenticatedRequest,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
  ): Promise<RecentActivityDto[]> {
    const { site, teamId } = this.resolveDashboardScope(req);
    return this.dashboardService.getRecentActivities(limit, teamId, site);
  }

  @Get('pending-approval-counts')
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  @ApiOperation({
    summary: '승인 대기 카운트 조회',
    description: '각 카테고리별 승인 대기 건수를 조회합니다. 역할에 따라 필터링됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '승인 대기 카운트',
    type: PendingApprovalCountsDto,
  })
  async getPendingApprovalCounts(
    @Req() req: AuthenticatedRequest
  ): Promise<PendingApprovalCountsDto> {
    const userRole = req.user.roles?.[0] as UserRole;
    const { site, teamId } = this.resolveDashboardScope(req);
    return this.dashboardService.getPendingApprovalCounts(userRole, teamId, site);
  }

  @Get('equipment-status-stats')
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  @ApiOperation({
    summary: '장비 상태별 통계 조회',
    description: '장비 상태별 개수를 집계하여 반환합니다.',
  })
  @ApiQuery({
    name: 'teamId',
    required: false,
    description: '팀 필터 (선택사항)',
  })
  @ApiResponse({
    status: 200,
    description: '장비 상태별 통계 (상태명: 개수)',
    schema: {
      type: 'object',
      additionalProperties: { type: 'number' },
      example: { available: 10, checked_out: 2, spare: 3 },
    },
  })
  async getEquipmentStatusStats(
    @Req() req: AuthenticatedRequest,
    @Query('teamId') teamId?: string
  ): Promise<EquipmentStatusStatsDto> {
    const { site, teamId: resolvedTeamId } = this.resolveDashboardScope(req, teamId);
    return this.dashboardService.getEquipmentStatusStats(resolvedTeamId, site);
  }

  // ============================================================================
  // 대시보드 개선안 v1 — 신규 엔드포인트 (§3.9, §4.3, §A.4, §A.7)
  // ============================================================================

  /**
   * §A.7 — 반출 현황 (scope=me|team|lab|all).
   * 단일 컴포넌트 + scope prop으로 4가지 역할 모두 처리.
   * 권한: scope=team(이상)은 TECH_MANAGER+, scope=lab(이상)은 LAB_MANAGER+, scope=all은 SYSTEM_ADMIN.
   */
  @Get('checkouts')
  @RequirePermissions(Permission.VIEW_CHECKOUTS)
  @ApiOperation({
    summary: '반출 현황 조회 (scope 통합)',
    description:
      'scope=me|team|lab|all 별로 반납 예정/기한 초과/대기 신청을 통합 반환합니다. ' +
      '권한 가드: 사용자 역할이 scope에 부합해야 합니다.',
  })
  @ApiQuery({
    name: 'scope',
    required: true,
    enum: ['me', 'team', 'lab', 'all'],
    description: '반출 데이터 범위',
  })
  @ApiResponse({ status: 200, type: DashboardCheckoutsScopeDto })
  async getCheckoutsByScope(
    @Req() req: AuthenticatedRequest,
    @Query('scope') scope: 'me' | 'team' | 'lab' | 'all'
  ): Promise<DashboardCheckoutsScopeDto> {
    const userRole = req.user.roles?.[0] as UserRole;
    const userId = req.user.userId;
    const userTeamId = req.user.teamId;
    const userSite = req.user.site;

    // scope별 권한 가드 (계층적: 상위 scope 사용 시 상위 권한 필요).
    if (scope === 'team') {
      if (
        userRole !== URVal.TECHNICAL_MANAGER &&
        userRole !== URVal.QUALITY_MANAGER &&
        userRole !== URVal.LAB_MANAGER &&
        userRole !== URVal.SYSTEM_ADMIN
      ) {
        throw new ForbiddenException('팀 단위 반출 현황 조회 권한이 없습니다.');
      }
    } else if (scope === 'lab') {
      if (userRole !== URVal.LAB_MANAGER && userRole !== URVal.SYSTEM_ADMIN) {
        throw new ForbiddenException('시험소 단위 반출 현황 조회 권한이 없습니다.');
      }
    } else if (scope === 'all') {
      if (userRole !== URVal.SYSTEM_ADMIN) {
        throw new ForbiddenException('전사 반출 현황 조회 권한이 없습니다.');
      }
    }

    return this.dashboardService.getCheckoutsByScope({
      scope,
      userId,
      teamId: scope === 'team' ? userTeamId : undefined,
      site: scope === 'lab' ? userSite : undefined,
    });
  }

  /**
   * §3.9 — 시스템관리자 시스템 상태 메트릭.
   */
  @Get('system-health')
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  @ApiOperation({
    summary: '시스템 상태 메트릭 (시스템관리자 전용)',
    description:
      'activeUsers/dbResponseMs/storagePct/queueSize/errorCount24h를 포함한 실시간 시스템 상태.',
  })
  @ApiResponse({ status: 200, type: SystemHealthMetricsDto })
  async getSystemHealth(@Req() req: AuthenticatedRequest): Promise<SystemHealthMetricsDto> {
    const userRole = req.user.roles?.[0] as UserRole;
    if (userRole !== URVal.SYSTEM_ADMIN) {
      throw new ForbiddenException('시스템 상태 조회 권한이 없습니다.');
    }
    return this.dashboardService.getSystemHealth();
  }

  /**
   * §4.3 — 품질책임자 검토 대기 hero 요약.
   */
  @Get('quality-review-pending')
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  @ApiOperation({
    summary: '품질책임자 검토 대기 요약',
    description: 'plan_review 단계 calibration plans 카운트 + 평균/최장 대기 + 처리율.',
  })
  @ApiResponse({ status: 200, type: QualityReviewPendingDto })
  async getQualityReviewPending(
    @Req() req: AuthenticatedRequest
  ): Promise<QualityReviewPendingDto> {
    const userRole = req.user.roles?.[0] as UserRole;
    if (
      userRole !== URVal.QUALITY_MANAGER &&
      userRole !== URVal.LAB_MANAGER &&
      userRole !== URVal.SYSTEM_ADMIN
    ) {
      throw new ForbiddenException('검토 대기 요약 조회 권한이 없습니다.');
    }
    return this.dashboardService.getQualityReviewPending();
  }

  /**
   * §A.4 — 시험실무자 빠른 요약.
   */
  @Get('me/quick-summary')
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  @ApiOperation({
    summary: '내 빠른 요약 (시험실무자)',
    description: 'pendingCheckoutRequests / upcomingCalibrations / nonconformanceItems.',
  })
  @ApiResponse({ status: 200, type: MyQuickSummaryDto })
  async getMyQuickSummary(@Req() req: AuthenticatedRequest): Promise<MyQuickSummaryDto> {
    return this.dashboardService.getMyQuickSummary(req.user.userId, req.user.teamId);
  }
}
