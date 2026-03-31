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
} from './dto/dashboard-response.dto';

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
      example: { available: 10, in_use: 5, checked_out: 2 },
    },
  })
  async getEquipmentStatusStats(
    @Req() req: AuthenticatedRequest,
    @Query('teamId') teamId?: string
  ): Promise<EquipmentStatusStatsDto> {
    const { site, teamId: resolvedTeamId } = this.resolveDashboardScope(req, teamId);
    return this.dashboardService.getEquipmentStatusStats(resolvedTeamId, site);
  }
}
