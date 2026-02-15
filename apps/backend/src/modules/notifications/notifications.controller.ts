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
  UseGuards,
  ParseUUIDPipe,
  UsePipes,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationPreferencesService } from './services/notification-preferences.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@equipment-management/shared-constants';
import { AuthenticatedRequest } from '../../types/auth';
import { CalibrationOverdueScheduler } from './schedulers/calibration-overdue-scheduler';
import { CheckoutOverdueScheduler } from './schedulers/checkout-overdue-scheduler';
import {
  NotificationQueryValidationPipe,
  type NotificationQueryInput,
} from './dto/notification-query.dto';

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

@ApiTags('알림 관리')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
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
  findAll(@Request() req: AuthenticatedRequest, @Query() query: NotificationQueryInput) {
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
  countUnread(@Request() req: AuthenticatedRequest) {
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
  getSettings(@Request() req: AuthenticatedRequest) {
    return this.preferencesService.getOrCreate(req.user.userId);
  }

  @Patch('settings')
  @ApiOperation({
    summary: '내 알림 설정 업데이트',
    description: '인증된 사용자의 알림 설정을 업데이트합니다.',
  })
  @RequirePermissions(Permission.UPDATE_NOTIFICATION)
  updateSettings(@Request() req: AuthenticatedRequest, @Body() body: Record<string, unknown>) {
    return this.preferencesService.update(req.user.userId, body);
  }

  @Patch('read-all')
  @ApiOperation({
    summary: '모든 알림 읽음 표시',
    description: '인증된 사용자의 모든 알림을 읽음으로 표시합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '모든 알림 읽음 표시 성공' })
  @RequirePermissions(Permission.VIEW_NOTIFICATIONS)
  markAllAsRead(@Request() req: AuthenticatedRequest) {
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
  createSystemNotification(
    @Body('title') title: string,
    @Body('content') content: string,
    @Body('priority') priority?: string
  ) {
    return this.notificationsService.createSystemNotification(title, content, priority);
  }

  @Post('trigger-overdue-check')
  @ApiOperation({
    summary: '교정 기한 초과 장비 점검 (수동)',
    description: '교정 기한이 초과된 장비를 점검하고 자동으로 부적합으로 전환합니다.',
  })
  @RequirePermissions(Permission.UPDATE_EQUIPMENT)
  async triggerOverdueCheck() {
    return this.calibrationOverdueScheduler.handleCalibrationOverdueCheck();
  }

  @Post('trigger-checkout-overdue-check')
  @ApiOperation({
    summary: '반출 기한 초과 점검 (수동)',
    description: '반출 기한이 초과된 반출을 점검하고 overdue 상태로 전환합니다.',
  })
  @RequirePermissions(Permission.UPDATE_EQUIPMENT)
  async triggerCheckoutOverdueCheck() {
    return this.checkoutOverdueScheduler.checkOverdueCheckouts();
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
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: '알림 읽음 표시',
    description: '특정 알림을 읽음으로 표시합니다.',
  })
  @ApiParam({ name: 'id', description: '알림 UUID', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '알림 읽음 표시 성공' })
  @RequirePermissions(Permission.VIEW_NOTIFICATIONS)
  markAsRead(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
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
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.notificationsService.remove(id, req.user.userId);
  }
}
