import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@equipment-management/shared-constants';
import { UserRole } from '@equipment-management/schemas';
import type { AuthenticatedRequest } from '../../types/auth';
import {
  DashboardSummaryDto,
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
@ApiTags('대시보드')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

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
    const userId = req.user.userId;
    const userRole = req.user.roles?.[0] as UserRole;
    const site = req.user.site;

    return this.dashboardService.getSummary(userId, userRole, teamId, site);
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
    const userId = req.user.userId;
    const userRole = req.user.roles?.[0] as UserRole;
    const site = req.user.site;

    return this.dashboardService.getEquipmentByTeam(userId, userRole, teamId, site);
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
  ): Promise<OverdueCalibrationDto[]> {
    const userId = req.user.userId;
    const userRole = req.user.roles?.[0] as UserRole;
    const site = req.user.site;

    return this.dashboardService.getOverdueCalibrations(userId, userRole, teamId, site);
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
  ): Promise<UpcomingCalibrationDto[]> {
    const userId = req.user.userId;
    const userRole = req.user.roles?.[0] as UserRole;
    const site = req.user.site;

    return this.dashboardService.getUpcomingCalibrations(userId, userRole, days, teamId, site);
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
  ): Promise<OverdueCheckoutDto[]> {
    const userId = req.user.userId;
    const userRole = req.user.roles?.[0] as UserRole;
    const site = req.user.site;

    return this.dashboardService.getOverdueCheckouts(userId, userRole, teamId, site);
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
    const userId = req.user.userId;
    const userRole = req.user.roles?.[0] as UserRole;
    const teamId = req.user.teamId;
    const site = req.user.site;

    return this.dashboardService.getRecentActivities(userId, userRole, limit, teamId, site);
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
    const userId = req.user.userId;
    const userRole = req.user.roles?.[0] as UserRole;
    const teamId = req.user.teamId;
    const site = req.user.site;

    return this.dashboardService.getPendingApprovalCounts(userId, userRole, teamId, site);
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
    const userId = req.user.userId;
    const userRole = req.user.roles?.[0] as UserRole;
    const site = req.user.site;

    return this.dashboardService.getEquipmentStatusStats(userId, userRole, teamId, site);
  }
}
