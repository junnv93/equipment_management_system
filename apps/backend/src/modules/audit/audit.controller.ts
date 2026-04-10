import { Controller, Get, Query, ParseUUIDPipe, Param, Request, UsePipes } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AuditService, AuditLogFilter, PaginationOptions } from './audit.service';
import { AuditLogQueryValidationPipe, type AuditLogQueryInput } from './dto/audit-log-query.dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import {
  Permission,
  resolveDataScope,
  AUDIT_LOG_SCOPE,
} from '@equipment-management/shared-constants';
import {
  AUDIT_ACTION_VALUES,
  AUDIT_ENTITY_TYPE_VALUES,
  type UserRole,
} from '@equipment-management/schemas';
import type { AuthenticatedRequest } from '../../types/auth';

/**
 * 감사 로그 조회 컨트롤러
 *
 * - lab_manager만 조회 가능
 * - 페이지네이션 지원
 * - 필터링 지원 (userId, entityType, action, dateRange)
 * - 모든 엔드포인트에 RBAC 스코프 적용 (C-1 보안 수정)
 */
@ApiTags('감사 로그')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions(Permission.VIEW_AUDIT_LOGS)
  @UsePipes(AuditLogQueryValidationPipe)
  @ApiOperation({
    summary: '감사 로그 목록 조회',
    description:
      '감사 로그 목록을 조회합니다. technical_manager(팀), lab_manager(사이트), quality_manager/system_admin(전체) 스코프별로 접근 가능합니다.',
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
    enum: AUDIT_ENTITY_TYPE_VALUES,
    description: '엔티티 타입 필터',
  })
  @ApiQuery({ name: 'entityId', required: false, type: String, description: '엔티티 ID 필터' })
  @ApiQuery({
    name: 'action',
    required: false,
    enum: AUDIT_ACTION_VALUES,
    description: '액션 필터',
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
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: '커서 토큰 (page와 상호 배타, 커서 기반 페이지네이션)',
  })
  @ApiResponse({ status: 200, description: '감사 로그 목록 조회 성공' })
  @ApiResponse({ status: 400, description: '잘못된 쿼리 파라미터' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  @ApiResponse({ status: 403, description: '권한 없음 (lab_manager만 조회 가능)' })
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: AuditLogQueryInput
  ): Promise<unknown> {
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
      userId: query.userId,
      entityType: query.entityType,
      entityId: query.entityId,
      action: query.action,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      // 서버 강제 스코프 — 클라이언트 파라미터로 우회 불가
      userSite: scope.site,
      userTeamId: scope.teamId,
    };

    // cursor 파라미터 → 커서 모드, page 파라미터 → offset 모드 (하위 호환)
    if (query.cursor !== undefined || query.page === undefined) {
      const limit = Math.min(query.limit ?? 30, 100);
      return this.auditService.findAllCursor(filter, query.cursor, limit);
    }

    const pagination: PaginationOptions = {
      page: query.page,
      limit: Math.min(query.limit ?? 20, 100),
    };

    return this.auditService.findAll(filter, pagination);
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_AUDIT_LOGS)
  @ApiOperation({
    summary: '감사 로그 단건 조회',
    description: '감사 로그를 ID로 조회합니다.',
  })
  @ApiParam({ name: 'id', description: '감사 로그 ID (UUID)' })
  @ApiResponse({ status: 200, description: '감사 로그 조회 성공' })
  @ApiResponse({ status: 404, description: '감사 로그를 찾을 수 없음' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<unknown> {
    const scope = resolveDataScope(
      {
        role: req.user.roles[0] as UserRole,
        site: req.user.site,
        teamId: req.user.teamId,
      },
      AUDIT_LOG_SCOPE
    );
    return this.auditService.findOne(id, scope);
  }

  @Get('entity/:entityType/:entityId')
  @RequirePermissions(Permission.VIEW_AUDIT_LOGS)
  @ApiOperation({
    summary: '특정 엔티티의 감사 로그 조회',
    description: '특정 엔티티(장비, 교정 등)의 감사 로그를 조회합니다.',
  })
  @ApiParam({
    name: 'entityType',
    description: '엔티티 타입',
    enum: AUDIT_ENTITY_TYPE_VALUES,
  })
  @ApiParam({ name: 'entityId', description: '엔티티 ID (UUID)' })
  @ApiResponse({ status: 200, description: '엔티티 감사 로그 조회 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async findByEntity(
    @Request() req: AuthenticatedRequest,
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string
  ): Promise<unknown> {
    const scope = resolveDataScope(
      {
        role: req.user.roles[0] as UserRole,
        site: req.user.site,
        teamId: req.user.teamId,
      },
      AUDIT_LOG_SCOPE
    );
    const logs = await this.auditService.findByEntity(entityType, entityId, scope);
    return {
      items: logs,
      formattedLogs: logs.map((log) => this.auditService.formatLogMessage(log)),
    };
  }

  @Get('user/:userId')
  @RequirePermissions(Permission.VIEW_AUDIT_LOGS)
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
  async findByUser(
    @Request() req: AuthenticatedRequest,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit') limit?: string
  ): Promise<unknown> {
    const scope = resolveDataScope(
      {
        role: req.user.roles[0] as UserRole,
        site: req.user.site,
        teamId: req.user.teamId,
      },
      AUDIT_LOG_SCOPE
    );
    const parsedLimit = Math.min(parseInt(limit ?? '', 10) || 100, 100);
    const logs = await this.auditService.findByUser(userId, parsedLimit, scope);
    return {
      items: logs,
      formattedLogs: logs.map((log) => this.auditService.formatLogMessage(log)),
    };
  }
}
