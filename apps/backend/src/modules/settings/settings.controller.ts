import { Controller, Get, Patch, Body, Query, Request, UsePipes, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  SiteEnum,
  type SystemSettings,
  type CalibrationAlertSettingsResponse,
} from '@equipment-management/schemas';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@equipment-management/shared-constants';
import { AuthenticatedRequest } from '../../types/auth';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { SettingsService } from './settings.service';
import {
  UpdateCalibrationSettingsValidationPipe,
  UpdateCalibrationSettingsDto,
} from './dto/calibration-settings.dto';
import {
  UpdateSystemSettingsValidationPipe,
  UpdateSystemSettingsDto,
} from './dto/system-settings.dto';

@ApiTags('설정 관리')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ─── Calibration Alert Settings ──────────────────────────────────────

  @Get('calibration')
  @ApiOperation({
    summary: '교정 알림 설정 조회',
    description: '교정 알림 발송 시점 설정을 조회합니다. 사이트별 오버라이드를 지원합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 알림 설정 조회 성공' })
  @ApiQuery({ name: 'site', required: false, enum: SiteEnum.options, description: '사이트 필터' })
  @RequirePermissions(Permission.VIEW_SYSTEM_SETTINGS)
  async getCalibrationSettings(
    @Query('site') site?: string
  ): Promise<CalibrationAlertSettingsResponse> {
    return this.settingsService.getCalibrationAlertDays(site);
  }

  @Patch('calibration')
  @ApiOperation({
    summary: '교정 알림 설정 변경',
    description: '교정 알림 발송 시점을 변경합니다. 사이트별 오버라이드를 지원합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 알림 설정 변경 성공' })
  @RequirePermissions(Permission.MANAGE_SYSTEM_SETTINGS)
  @ApiQuery({ name: 'site', required: false, enum: SiteEnum.options, description: '사이트 필터' })
  @AuditLog({ action: 'update', entityType: 'settings', entityIdPath: 'query.site' })
  @UsePipes(UpdateCalibrationSettingsValidationPipe)
  async updateCalibrationSettings(
    @Body() dto: UpdateCalibrationSettingsDto,
    @Request() req: AuthenticatedRequest,
    @Query('site') site?: string
  ): Promise<CalibrationAlertSettingsResponse> {
    return this.settingsService.updateCalibrationAlertDays(dto.alertDays, req.user.userId, site);
  }

  // ─── System Settings (system_admin only) ─────────────────────────────

  @Get('system')
  @ApiOperation({
    summary: '시스템 설정 조회',
    description: '시스템 관리 설정을 조회합니다. system_admin만 접근 가능합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '시스템 설정 조회 성공' })
  @RequirePermissions(Permission.VIEW_SYSTEM_SETTINGS)
  async getSystemSettings(): Promise<SystemSettings> {
    return this.settingsService.getSystemSettings();
  }

  @Patch('system')
  @ApiOperation({
    summary: '시스템 설정 변경',
    description: '시스템 관리 설정을 변경합니다. system_admin만 접근 가능합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '시스템 설정 변경 성공' })
  @RequirePermissions(Permission.MANAGE_SYSTEM_SETTINGS)
  @AuditLog({ action: 'update', entityType: 'settings', entityIdPath: 'body' })
  @UsePipes(UpdateSystemSettingsValidationPipe)
  async updateSystemSettings(
    @Body() dto: UpdateSystemSettingsDto,
    @Request() req: AuthenticatedRequest
  ): Promise<SystemSettings> {
    return this.settingsService.updateSystemSettings(dto, req.user.userId);
  }
}
