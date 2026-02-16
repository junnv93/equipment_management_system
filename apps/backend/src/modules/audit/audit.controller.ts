import { Controller, Get, Query, UseGuards, ParseUUIDPipe, Param, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AuditService, AuditLogFilter, PaginationOptions } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import {
  Permission,
  resolveDataScope,
  AUDIT_LOG_SCOPE,
} from '@equipment-management/shared-constants';
import type { UserRole } from '@equipment-management/schemas';
import type { AuthenticatedRequest } from '../../types/auth';

/**
 * 감사 로그 조회 컨트롤러
 *
 * - lab_manager만 조회 가능
 * - 페이지네이션 지원
 * - 필터링 지원 (userId, entityType, action, dateRange)
 */
@ApiTags('감사 로그')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({
    summary: '감사 로그 목록 조회',
    description: '감사 로그 목록을 조회합니다. lab_manager만 조회 가능합니다.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본값: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 항목 수 (기본값: 20, 최대: 100)',
  })
  @ApiQuery({ name: 'userId', required: false, type: String, description: '사용자 ID 필터' })
  @ApiQuery({
    name: 'entityType',
    required: false,
    type: String,
    description: '엔티티 타입 필터 (equipment, calibration, checkout 등)',
  })
  @ApiQuery({ name: 'entityId', required: false, type: String, description: '엔티티 ID 필터' })
  @ApiQuery({
    name: 'action',
    required: false,
    type: String,
    description: '액션 필터 (create, update, delete, approve 등)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: '시작 날짜 (ISO 8601 형식)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: '종료 날짜 (ISO 8601 형식)',
  })
  @ApiResponse({ status: 200, description: '감사 로그 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  @ApiResponse({ status: 403, description: '권한 없음 (lab_manager만 조회 가능)' })
  @RequirePermissions(Permission.VIEW_AUDIT_LOGS)
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    // SSOT: resolveDataScope()로 역할별 스코프 해석 — switch/if 없음
    const scope = resolveDataScope(
      {
        role: req.user.roles[0] as UserRole,
        site: req.user.site,
        teamId: req.user.teamId,
      },
      AUDIT_LOG_SCOPE
    );

    const filter: AuditLogFilter = {
      userId,
      entityType,
      entityId,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      // 서버 강제 스코프 — 클라이언트 파라미터로 우회 불가
      userSite: scope.site,
      userTeamId: scope.teamId,
    };

    const pagination: PaginationOptions = {
      page: page ? parseInt(page, 10) : 1,
      limit: Math.min(limit ? parseInt(limit, 10) : 20, 100),
    };

    return this.auditService.findAll(filter, pagination);
  }

  @Get(':id')
  @ApiOperation({
    summary: '감사 로그 단건 조회',
    description: '감사 로그를 ID로 조회합니다.',
  })
  @ApiParam({ name: 'id', description: '감사 로그 ID (UUID)' })
  @ApiResponse({ status: 200, description: '감사 로그 조회 성공' })
  @ApiResponse({ status: 404, description: '감사 로그를 찾을 수 없음' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_AUDIT_LOGS)
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<{
    id: string;
    timestamp: Date;
    userId: string;
    userName: string;
    userRole: string;
    action: string;
    entityType: string;
    entityId: string;
    entityName: string | null;
    details:
      | import('/home/kmjkds/equipment_management_system/packages/db/src/schema/audit-logs').AuditLogDetails
      | null;
    ipAddress: string | null;
    createdAt: Date;
  }> {
    return this.auditService.findOne(id);
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({
    summary: '특정 엔티티의 감사 로그 조회',
    description: '특정 엔티티(장비, 교정 등)의 감사 로그를 조회합니다.',
  })
  @ApiParam({
    name: 'entityType',
    description: '엔티티 타입',
    enum: [
      'equipment',
      'calibration',
      'checkout',
      'rental',
      'user',
      'team',
      'calibration_factor',
      'non_conformance',
      'software',
      'calibration_plan',
      'repair_history',
    ],
  })
  @ApiParam({ name: 'entityId', description: '엔티티 ID (UUID)' })
  @ApiResponse({ status: 200, description: '엔티티 감사 로그 조회 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_AUDIT_LOGS)
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string
  ): Promise<{
    items: {
      id: string;
      timestamp: Date;
      userId: string;
      userName: string;
      userRole: string;
      action: string;
      entityType: string;
      entityId: string;
      entityName: string | null;
      details:
        | import('/home/kmjkds/equipment_management_system/packages/db/src/schema/audit-logs').AuditLogDetails
        | null;
      ipAddress: string | null;
      createdAt: Date;
    }[];
    formattedLogs: string[];
  }> {
    const logs = await this.auditService.findByEntity(entityType, entityId);
    return {
      items: logs,
      formattedLogs: logs.map((log) => this.auditService.formatLogMessage(log)),
    };
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: '특정 사용자의 감사 로그 조회',
    description: '특정 사용자의 감사 로그를 조회합니다.',
  })
  @ApiParam({ name: 'userId', description: '사용자 ID (UUID)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '조회 개수 (기본값: 100)',
  })
  @ApiResponse({ status: 200, description: '사용자 감사 로그 조회 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_AUDIT_LOGS)
  async findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit') limit?: string
  ): Promise<{
    items: {
      id: string;
      timestamp: Date;
      userId: string;
      userName: string;
      userRole: string;
      action: string;
      entityType: string;
      entityId: string;
      entityName: string | null;
      details:
        | import('/home/kmjkds/equipment_management_system/packages/db/src/schema/audit-logs').AuditLogDetails
        | null;
      ipAddress: string | null;
      createdAt: Date;
    }[];
    formattedLogs: string[];
  }> {
    const logs = await this.auditService.findByUser(userId, limit ? parseInt(limit, 10) : 100);
    return {
      items: logs,
      formattedLogs: logs.map((log) => this.auditService.formatLogMessage(log)),
    };
  }
}
