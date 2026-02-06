import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { type NotificationPriority } from '@equipment-management/schemas';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@equipment-management/shared-constants';
import { NotificationSettingsDto } from './dto/notification-settings.dto';
import { CalibrationOverdueScheduler } from './schedulers/calibration-overdue-scheduler';

@ApiTags('알림 관리')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly calibrationOverdueScheduler: CalibrationOverdueScheduler
  ) {}

  @Post()
  @ApiOperation({ summary: '알림 생성', description: '새로운 알림을 생성합니다.' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '알림이 성공적으로 생성되었습니다.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.CREATE_NOTIFICATION)
  create(@Body() createNotificationDto: CreateNotificationDto): void {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: '알림 목록 조회', description: '사용자의 알림 목록을 조회합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '알림 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  findAll(@Query() query: NotificationQueryDto): Promise<{
    items: import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/notifications/notifications.service').Notification[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    return this.notificationsService.findAll(query);
  }

  @Get('count-unread/:recipientId')
  @ApiOperation({
    summary: '읽지 않은 알림 개수 조회',
    description: '사용자의 읽지 않은 알림 개수를 조회합니다.',
  })
  @ApiParam({ name: 'recipientId', description: '수신자 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '읽지 않은 알림 개수 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  countUnread(@Param('recipientId') recipientId: string): Promise<{ count: number }> {
    return this.notificationsService.countUnread(recipientId);
  }

  @Get(':id')
  @ApiOperation({ summary: '알림 상세 조회', description: '특정 알림의 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'id', description: '알림 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '알림 상세 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '알림을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  findOne(
    @Param('id') id: string
  ): Promise<
    import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/notifications/notifications.service').Notification
  > {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '알림 정보 수정', description: '특정 알림의 정보를 수정합니다.' })
  @ApiParam({ name: 'id', description: '알림 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '알림 정보 수정 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '알림을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.UPDATE_NOTIFICATION)
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto
  ): Promise<
    import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/notifications/notifications.service').Notification
  > {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '알림 삭제', description: '특정 알림을 삭제합니다.' })
  @ApiParam({ name: 'id', description: '알림 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '알림 삭제 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '알림을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.DELETE_NOTIFICATION)
  remove(@Param('id') id: string): Promise<{ id: string; deleted: boolean }> {
    return this.notificationsService.remove(id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '알림 읽음 표시', description: '특정 알림을 읽음으로 표시합니다.' })
  @ApiParam({ name: 'id', description: '알림 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '알림 읽음 표시 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '알림을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  markAsRead(
    @Param('id') id: string
  ): Promise<
    import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/notifications/notifications.service').Notification
  > {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('mark-all-read/:recipientId')
  @ApiOperation({
    summary: '모든 알림 읽음 표시',
    description: '사용자의 모든 알림을 읽음으로 표시합니다.',
  })
  @ApiParam({ name: 'recipientId', description: '수신자 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '모든 알림 읽음 표시 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  markAllAsRead(
    @Param('recipientId') recipientId: string
  ): Promise<{ success: boolean; count: number }> {
    return this.notificationsService.markAllAsRead(recipientId);
  }

  @Post('system')
  @ApiOperation({
    summary: '시스템 알림 생성',
    description: '모든 사용자에게 전송되는 시스템 알림을 생성합니다.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '시스템 알림이 성공적으로 생성되었습니다.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.CREATE_SYSTEM_NOTIFICATION)
  createSystemNotification(
    @Body('title') title: string,
    @Body('content') content: string,
    @Body('priority') priority?: NotificationPriority
  ): Promise<
    import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/notifications/notifications.service').Notification
  > {
    return this.notificationsService.createSystemNotification(title, content, priority);
  }

  @Get('settings/:userId')
  @ApiOperation({ summary: '알림 설정 조회', description: '사용자의 알림 설정을 조회합니다.' })
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '알림 설정 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  getUserNotificationSettings(
    @Param('userId') userId: string
  ): import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/notifications/dto/notification-settings.dto').NotificationSettingsDto {
    return this.notificationsService.getUserNotificationSettings(userId);
  }

  @Patch('settings/:userId')
  @ApiOperation({
    summary: '알림 설정 업데이트',
    description: '사용자의 알림 설정을 업데이트합니다.',
  })
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '알림 설정 업데이트 성공' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.MANAGE_NOTIFICATION_SETTINGS)
  updateUserNotificationSettings(
    @Param('userId') userId: string,
    @Body() settingsDto: NotificationSettingsDto
  ): import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/notifications/dto/notification-settings.dto').NotificationSettingsDto {
    return this.notificationsService.updateUserNotificationSettings(userId, settingsDto);
  }

  @Post('scheduled/daily')
  @ApiOperation({ summary: '일간 알림 발송', description: '설정에 따라 일간 알림을 발송합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '일간 알림 발송 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.CREATE_NOTIFICATION)
  scheduleDailyNotifications(): { success: boolean; message: string } {
    return this.notificationsService.scheduleDailyNotifications();
  }

  @Post('scheduled/weekly')
  @ApiOperation({ summary: '주간 알림 발송', description: '설정에 따라 주간 알림을 발송합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '주간 알림 발송 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.CREATE_NOTIFICATION)
  scheduleWeeklyNotifications(): { success: boolean; message: string } {
    return this.notificationsService.scheduleWeeklyNotifications();
  }

  @Post('trigger-overdue-check')
  @ApiOperation({
    summary: '교정 기한 초과 장비 점검 (수동)',
    description: '교정 기한이 초과된 장비를 점검하고 자동으로 부적합으로 전환합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '점검 완료',
    schema: {
      type: 'object',
      properties: {
        processed: { type: 'number', description: '처리한 장비 수' },
        created: { type: 'number', description: '생성한 부적합 수' },
        skipped: { type: 'number', description: '건너뛴 장비 수' },
        details: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              equipmentId: { type: 'string' },
              managementNumber: { type: 'string' },
              action: { type: 'string', enum: ['created', 'skipped'] },
              reason: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.UPDATE_EQUIPMENT)
  async triggerOverdueCheck(): Promise<{
    processed: number;
    created: number;
    skipped: number;
    details: Array<{
      equipmentId: string;
      managementNumber: string;
      action: 'created' | 'skipped';
      reason?: string;
    }>;
  }> {
    return this.calibrationOverdueScheduler.handleCalibrationOverdueCheck();
  }
}
