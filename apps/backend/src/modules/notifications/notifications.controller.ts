import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Param,
  Query,
  Body,
  Request,
  ParseUUIDPipe,
  UsePipes,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService, type NotificationRecord } from './notifications.service';
import { NotificationPreferencesService } from './services/notification-preferences.service';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission, NOTIFICATION_DATA_SCOPE } from '@equipment-management/shared-constants';
import { AuthenticatedRequest } from '../../types/auth';
import { SiteScoped } from '../../common/decorators/site-scoped.decorator';
import { CurrentEnforcedScope } from '../../common/decorators/current-scope.decorator';
import type { EnforcedScope } from '../../common/scope/scope-enforcer';
import { CalibrationOverdueScheduler } from './schedulers/calibration-overdue-scheduler';
import { CheckoutOverdueScheduler } from './schedulers/checkout-overdue-scheduler';
import {
  NotificationQueryValidationPipe,
  type NotificationQueryInput,
} from './dto/notification-query.dto';
import {
  UpdateNotificationSettingsPipe,
  UpdateNotificationSettingsDto,
} from './dto/update-notification-settings.dto';
import {
  CreateSystemNotificationPipe,
  CreateSystemNotificationDto,
} from './dto/create-system-notification.dto';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

/**
 * 알림 API 컨트롤러
 *
 * 보안 수정: 모든 엔드포인트에서 req.user.userId 사용 (URL 파라미터 신뢰 금지)
 *
 * ⚠️ 라우트 순서 중요:
 *   NestJS는 메서드 선언 순서대로 라우트를 등록합니다.
 *   정적 라우트(settings, unread-count)를 파라미터 라우트(:id) 보다
 *   반드시 먼저 선언해야 합니다. 그렇지 않으면 :id가 'settings' 등을 가로챕니다.
 */

/** 페이지네이션 포함 목록 응답 */
interface PaginatedNotificationResponse {
  items: NotificationRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@ApiTags('알림 관리')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly preferencesService: NotificationPreferencesService,
    private readonly calibrationOverdueScheduler: CalibrationOverdueScheduler,
    private readonly checkoutOverdueScheduler: CheckoutOverdueScheduler
  ) {}

  // ─── 알림 목록 조회 ──────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: '내 알림 목록 조회',
    description: '인증된 사용자의 알림 목록을 조회합니다 (개인 + 팀 + 시스템).',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '알림 목록 조회 성공' })
  @RequirePermissions(Permission.VIEW_NOTIFICATIONS)
  @UsePipes(NotificationQueryValidationPipe)
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: NotificationQueryInput
  ): Promise<PaginatedNotificationResponse> {
    const userId = req.user.userId;
    const userTeamId = req.user.teamId ?? null;

    return this.notificationsService.findAllForUser(userId, userTeamId, {
      category: query.category,
      isRead: query.isRead,
      search: query.search,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  // ─── 정적 라우트 (반드시 :id 보다 먼저 선언) ─────────────────────────

  @Get('unread-count')
  @ApiOperation({
    summary: '미읽음 알림 개수 조회',
    description: '인증된 사용자의 미읽음 알림 개수를 조회합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '미읽음 알림 개수 조회 성공' })
  @RequirePermissions(Permission.VIEW_NOTIFICATIONS)
  countUnread(@Request() req: AuthenticatedRequest): Promise<{ count: number }> {
    const userId = req.user.userId;
    const userTeamId = req.user.teamId ?? null;
    return this.notificationsService.countUnread(userId, userTeamId);
  }

  @Get('settings')
  @ApiOperation({
    summary: '내 알림 설정 조회',
    description: '인증된 사용자의 알림 설정을 조회합니다.',
  })
  @RequirePermissions(Permission.VIEW_NOTIFICATIONS)
  getSettings(
    @Request() req: AuthenticatedRequest
  ): ReturnType<NotificationPreferencesService['getOrCreate']> {
    return this.preferencesService.getOrCreate(req.user.userId);
  }

  @Patch('settings')
  @ApiOperation({
    summary: '내 알림 설정 업데이트',
    description: '인증된 사용자의 알림 설정을 업데이트합니다.',
  })
  @RequirePermissions(Permission.UPDATE_NOTIFICATION)
  @AuditLog({ action: 'update', entityType: 'settings' })
  @UsePipes(UpdateNotificationSettingsPipe)
  updateSettings(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateNotificationSettingsDto
  ): ReturnType<NotificationPreferencesService['update']> {
    return this.preferencesService.update(req.user.userId, dto);
  }

  @Patch('read-all')
  @ApiOperation({
    summary: '모든 알림 읽음 표시',
    description: '인증된 사용자의 모든 알림을 읽음으로 표시합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '모든 알림 읽음 표시 성공' })
  @RequirePermissions(Permission.UPDATE_NOTIFICATION)
  @AuditLog({ action: 'update', entityType: 'notification' })
  markAllAsRead(
    @Request() req: AuthenticatedRequest
  ): Promise<{ success: boolean; count: number }> {
    const userId = req.user.userId;
    const userTeamId = req.user.teamId ?? null;
    return this.notificationsService.markAllAsRead(userId, userTeamId);
  }

  // ─── 시스템 알림 / 관리자 기능 (POST — :id 충돌 없음) ────────────────

  @Post('system')
  @ApiOperation({
    summary: '시스템 알림 생성',
    description: '모든 사용자에게 전송되는 시스템 알림을 생성합니다.',
  })
  @RequirePermissions(Permission.CREATE_SYSTEM_NOTIFICATION)
  @AuditLog({ action: 'create', entityType: 'notification' })
  createSystemNotification(
    @Body(CreateSystemNotificationPipe) dto: CreateSystemNotificationDto
  ): Promise<NotificationRecord> {
    return this.notificationsService.createSystemNotification(dto.title, dto.content, dto.priority);
  }

  @Post('trigger-overdue-check')
  @ApiOperation({
    summary: '교정 기한 초과 장비 점검 (수동)',
    description: '교정 기한이 초과된 장비를 점검하고 자동으로 부적합으로 전환합니다.',
  })
  // UPDATE_EQUIPMENT 사용 이유: 전용 시스템 권한이 없으며,
  // 이 작업은 장비 상태를 non_conforming으로 변경하므로 장비 수정 권한이 의미적으로 적절함
  @RequirePermissions(Permission.UPDATE_EQUIPMENT)
  @AuditLog({ action: 'update', entityType: 'equipment' })
  triggerOverdueCheck(): ReturnType<CalibrationOverdueScheduler['handleCalibrationOverdueCheck']> {
    return this.calibrationOverdueScheduler.handleCalibrationOverdueCheck();
  }

  @Post('trigger-checkout-overdue-check')
  @ApiOperation({
    summary: '반출 기한 초과 점검 (수동)',
    description: '반출 기한이 초과된 반출을 점검하고 overdue 상태로 전환합니다.',
  })
  // UPDATE_EQUIPMENT 사용 이유: 전용 시스템 권한이 없으며,
  // 이 작업은 반출 상태를 overdue로 변경하는 장비 관련 시스템 작업임
  @RequirePermissions(Permission.UPDATE_EQUIPMENT)
  @AuditLog({ action: 'update', entityType: 'checkout' })
  triggerCheckoutOverdueCheck(): ReturnType<CheckoutOverdueScheduler['checkOverdueCheckouts']> {
    return this.checkoutOverdueScheduler.checkOverdueCheckouts();
  }

  // ─── 관리자 알림 현황 조회 (사이트 스코핑) ──────────────────────────

  @Get('admin')
  @ApiOperation({
    summary: '관리자 알림 현황 조회',
    description: '역할별 사이트 스코핑이 적용된 알림 현황을 조회합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '관리자 알림 현황 조회 성공' })
  @RequirePermissions(Permission.CREATE_SYSTEM_NOTIFICATION)
  @SiteScoped({ policy: NOTIFICATION_DATA_SCOPE, siteField: 'recipientSite', failLoud: true })
  @UsePipes(NotificationQueryValidationPipe)
  findAllAdmin(
    @Query() query: NotificationQueryInput,
    @CurrentEnforcedScope() scope: EnforcedScope
  ): Promise<PaginatedNotificationResponse> {
    // failLoud: enforced scope.site → 비표준 recipientSite 필드로 매핑.
    query.recipientSite = scope.site;
    if (scope.teamId) query.teamId = scope.teamId;
    return this.notificationsService.findAllAdmin(query);
  }

  // ─── 파라미터 라우트 (반드시 마지막에 선언) ──────────────────────────

  @Get(':id')
  @ApiOperation({
    summary: '알림 상세 조회',
    description: '특정 알림의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'id', description: '알림 UUID', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '알림 상세 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '알림을 찾을 수 없음' })
  @RequirePermissions(Permission.VIEW_NOTIFICATIONS)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest
  ): Promise<NotificationRecord> {
    return this.notificationsService.findOne(id, req.user.userId, req.user.teamId ?? null);
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: '알림 읽음 표시',
    description: '특정 알림을 읽음으로 표시합니다.',
  })
  @ApiParam({ name: 'id', description: '알림 UUID', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '알림 읽음 표시 성공' })
  @RequirePermissions(Permission.UPDATE_NOTIFICATION)
  @AuditLog({ action: 'update', entityType: 'notification', entityIdPath: 'params.id' })
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest
  ): Promise<NotificationRecord> {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '알림 삭제',
    description: '특정 알림을 삭제합니다.',
  })
  @ApiParam({ name: 'id', description: '알림 UUID', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '알림 삭제 성공' })
  @RequirePermissions(Permission.DELETE_NOTIFICATION)
  @AuditLog({ action: 'delete', entityType: 'notification', entityIdPath: 'params.id' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest
  ): Promise<{ id: string; deleted: boolean }> {
    return this.notificationsService.remove(id, req.user.userId);
  }
}
