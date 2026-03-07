import { Controller, Get, Query, Res, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { ReportExportService, ReportFormat } from './report-export.service';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SkipResponseTransform } from '../../common/interceptors/response-transform.interceptor';
import {
  Permission,
  resolveDataScope,
  AUDIT_LOG_SCOPE,
} from '@equipment-management/shared-constants';
import { type UserRole } from '@equipment-management/schemas';
import type { AuthenticatedRequest } from '../../types/auth';

const VALID_FORMATS = new Set<ReportFormat>(['excel', 'csv', 'pdf']);

@ApiTags('보고서')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportExportService: ReportExportService
  ) {}

  @Get('equipment-usage')
  @ApiOperation({ summary: '장비 사용 보고서', description: '장비별 사용 통계를 제공합니다.' })
  @ApiQuery({ name: 'startDate', required: false, description: '시작 날짜 (ISO 형식)' })
  @ApiQuery({ name: 'endDate', required: false, description: '종료 날짜 (ISO 형식)' })
  @ApiQuery({
    name: 'equipmentId',
    required: false,
    description: '특정 장비 ID (미지정 시 전체 장비)',
  })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    description: '특정 부서 ID (미지정 시 전체 부서)',
  })
  @ApiResponse({ status: 200, description: '장비 사용 통계 조회 성공' })
  @RequirePermissions(Permission.VIEW_STATISTICS)
  getEquipmentUsage(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('equipmentId') equipmentId?: string,
    @Query('departmentId') departmentId?: string
  ) {
    return this.reportsService.getEquipmentUsage(startDate, endDate, equipmentId, departmentId);
  }

  @Get('calibration-status')
  @ApiOperation({
    summary: '교정 상태 보고서',
    description: '장비 교정 상태에 대한 통계를 제공합니다.',
  })
  @ApiQuery({ name: 'status', required: false, description: '교정 상태 (due, overdue, completed)' })
  @ApiQuery({
    name: 'timeframe',
    required: false,
    description: '기간 (week, month, quarter, year)',
  })
  @ApiResponse({ status: 200, description: '교정 상태 통계 조회 성공' })
  @RequirePermissions(Permission.VIEW_STATISTICS)
  getCalibrationStatus(@Query('status') status?: string, @Query('timeframe') timeframe?: string) {
    return this.reportsService.getCalibrationStatus(status, timeframe);
  }

  @Get('rental-statistics')
  @ApiOperation({ summary: '대여 통계 보고서', description: '장비 대여에 대한 통계를 제공합니다.' })
  @ApiQuery({ name: 'startDate', required: false, description: '시작 날짜 (ISO 형식)' })
  @ApiQuery({ name: 'endDate', required: false, description: '종료 날짜 (ISO 형식)' })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    description: '특정 부서 ID (미지정 시 전체 부서)',
  })
  @ApiResponse({ status: 200, description: '대여 통계 조회 성공' })
  @RequirePermissions(Permission.VIEW_STATISTICS)
  getRentalStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('departmentId') departmentId?: string
  ) {
    return this.reportsService.getRentalStatistics(startDate, endDate, departmentId);
  }

  @Get('utilization-rate')
  @ApiOperation({ summary: '장비 활용률 보고서', description: '장비별 활용률 통계를 제공합니다.' })
  @ApiQuery({
    name: 'period',
    required: false,
    description: '기간 (week, month, quarter, year)',
    enum: ['week', 'month', 'quarter', 'year'],
  })
  @ApiQuery({
    name: 'equipmentId',
    required: false,
    description: '특정 장비 ID (미지정 시 전체 장비)',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: '특정 장비 카테고리 ID (미지정 시 전체 카테고리)',
  })
  @ApiResponse({ status: 200, description: '장비 활용률 조회 성공' })
  @RequirePermissions(Permission.VIEW_STATISTICS)
  getUtilizationRate(
    @Query('period') period: 'week' | 'month' | 'quarter' | 'year' = 'month',
    @Query('equipmentId') equipmentId?: string,
    @Query('categoryId') categoryId?: string
  ) {
    return this.reportsService.getUtilizationRate(period, equipmentId, categoryId);
  }

  @Get('equipment-downtime')
  @ApiOperation({
    summary: '장비 가동 중단 보고서',
    description: '장비 유지보수 및 수리로 인한 가동 중단 통계를 제공합니다.',
  })
  @ApiQuery({ name: 'startDate', required: false, description: '시작 날짜 (ISO 형식)' })
  @ApiQuery({ name: 'endDate', required: false, description: '종료 날짜 (ISO 형식)' })
  @ApiQuery({
    name: 'equipmentId',
    required: false,
    description: '특정 장비 ID (미지정 시 전체 장비)',
  })
  @ApiResponse({ status: 200, description: '장비 가동 중단 통계 조회 성공' })
  @RequirePermissions(Permission.VIEW_STATISTICS)
  getEquipmentDowntime(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('equipmentId') equipmentId?: string
  ) {
    return this.reportsService.getEquipmentDowntime(startDate, endDate, equipmentId);
  }

  // ── 파일 내보내기 엔드포인트 ────────────────────────────────────────────
  // 공통 패턴: DB 조회 → 파일 생성 → 바이너리 스트리밍 (Content-Disposition 헤더)
  // @SkipResponseTransform: ResponseTransformInterceptor({success,data}) 래핑 방지
  // ──────────────────────────────────────────────────────────────────────────

  @Get('export/equipment-usage')
  @ApiOperation({ summary: '장비 사용 보고서 내보내기 (구 형식 — 하위 호환)' })
  @ApiQuery({ name: 'format', required: true, enum: ['excel', 'csv', 'pdf'] })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: '파일 스트림' })
  @RequirePermissions(Permission.EXPORT_REPORTS)
  @SkipResponseTransform()
  async exportEquipmentUsage(
    @Res() res: Response,
    @Query('format') format: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<void> {
    const data = await this.reportsService.getEquipmentInventoryData({ site: undefined });
    await this._streamFile(res, data, this._resolveFormat(format), startDate, endDate);
  }

  @Get('export/equipment-inventory')
  @ApiOperation({ summary: '장비 현황 보고서 내보내기' })
  @ApiQuery({ name: 'format', required: true, enum: ['excel', 'csv', 'pdf'] })
  @ApiQuery({ name: 'site', required: false, description: '시험소 코드 (SUW/UIW/PYT)' })
  @ApiQuery({ name: 'status', required: false, description: '장비 상태' })
  @ApiQuery({ name: 'teamId', required: false, description: '팀 ID' })
  @ApiResponse({ status: 200, description: '파일 스트림' })
  @RequirePermissions(Permission.EXPORT_REPORTS)
  @SkipResponseTransform()
  async exportEquipmentInventory(
    @Res() res: Response,
    @Query('format') format: string,
    @Query('site') site?: string,
    @Query('status') status?: string,
    @Query('teamId') teamId?: string
  ): Promise<void> {
    const data = await this.reportsService.getEquipmentInventoryData({ site, status, teamId });
    await this._streamFile(res, data, this._resolveFormat(format));
  }

  @Get('export/calibration-status')
  @ApiOperation({ summary: '교정 현황 보고서 내보내기' })
  @ApiQuery({ name: 'format', required: true, enum: ['excel', 'csv', 'pdf'] })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    description: '교정 상태 (scheduled/completed/failed)',
  })
  @ApiResponse({ status: 200, description: '파일 스트림' })
  @RequirePermissions(Permission.EXPORT_REPORTS)
  @SkipResponseTransform()
  async exportCalibrationStatus(
    @Res() res: Response,
    @Query('format') format: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string
  ): Promise<void> {
    const data = await this.reportsService.getCalibrationStatusData({ startDate, endDate, status });
    await this._streamFile(res, data, this._resolveFormat(format));
  }

  @Get('export/utilization')
  @ApiOperation({ summary: '장비 활용률 보고서 내보내기' })
  @ApiQuery({ name: 'format', required: true, enum: ['excel', 'csv', 'pdf'] })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'last_week|last_month|last_quarter|last_year',
  })
  @ApiQuery({ name: 'site', required: false })
  @ApiResponse({ status: 200, description: '파일 스트림' })
  @RequirePermissions(Permission.EXPORT_REPORTS)
  @SkipResponseTransform()
  async exportUtilization(
    @Res() res: Response,
    @Query('format') format: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('period') period?: string,
    @Query('site') site?: string
  ): Promise<void> {
    const data = await this.reportsService.getUtilizationData({ startDate, endDate, period, site });
    await this._streamFile(res, data, this._resolveFormat(format));
  }

  @Get('export/team-equipment')
  @ApiOperation({ summary: '팀별 장비 현황 보고서 내보내기' })
  @ApiQuery({ name: 'format', required: true, enum: ['excel', 'csv', 'pdf'] })
  @ApiQuery({ name: 'site', required: false })
  @ApiQuery({ name: 'teamId', required: false })
  @ApiResponse({ status: 200, description: '파일 스트림' })
  @RequirePermissions(Permission.EXPORT_REPORTS)
  @SkipResponseTransform()
  async exportTeamEquipment(
    @Res() res: Response,
    @Query('format') format: string,
    @Query('site') site?: string,
    @Query('teamId') teamId?: string
  ): Promise<void> {
    const data = await this.reportsService.getTeamEquipmentData({ site, teamId });
    await this._streamFile(res, data, this._resolveFormat(format));
  }

  @Get('export/maintenance')
  @ApiOperation({ summary: '수리 및 점검 이력 보고서 내보내기' })
  @ApiQuery({ name: 'format', required: true, enum: ['excel', 'csv', 'pdf'] })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'equipmentId', required: false })
  @ApiResponse({ status: 200, description: '파일 스트림' })
  @RequirePermissions(Permission.EXPORT_REPORTS)
  @SkipResponseTransform()
  async exportMaintenance(
    @Res() res: Response,
    @Query('format') format: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('equipmentId') equipmentId?: string
  ): Promise<void> {
    const data = await this.reportsService.getMaintenanceData({ startDate, endDate, equipmentId });
    await this._streamFile(res, data, this._resolveFormat(format));
  }

  @Get('export/audit-logs')
  @ApiOperation({
    summary: '감사 로그 내보내기',
    description:
      'RBAC 스코프 적용 감사 로그를 Excel/CSV/PDF로 내보냅니다. 최대 10,000건, 날짜 필터로 분할 권장.',
  })
  @ApiQuery({ name: 'format', required: true, enum: ['excel', 'csv', 'pdf'] })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'startDate', required: false, description: 'ISO 8601 형식 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'ISO 8601 형식 (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: '파일 스트림' })
  @RequirePermissions(Permission.VIEW_AUDIT_LOGS)
  @SkipResponseTransform()
  async exportAuditLogs(
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
    @Query('format') format: string,
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<void> {
    // SSOT: resolveDataScope()로 역할별 스코프 해석 — audit.controller.ts와 동일 패턴
    const scope = resolveDataScope(
      {
        role: req.user.roles[0] as UserRole,
        site: req.user.site,
        teamId: req.user.teamId,
      },
      AUDIT_LOG_SCOPE
    );

    const data = await this.reportsService.getAuditLogExportData({
      userId,
      entityType,
      action,
      startDate,
      endDate,
      userSite: scope.site,
      userTeamId: scope.teamId,
    });

    const resolvedFormat = this._resolveFormat(format);
    const { buffer, mimeType, filename } = await this.reportExportService.generate(
      data,
      resolvedFormat
    );
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    res.end(buffer);
  }

  // ── Private 헬퍼 ────────────────────────────────────────────────────────

  private _resolveFormat(raw: string): ReportFormat {
    return VALID_FORMATS.has(raw as ReportFormat) ? (raw as ReportFormat) : 'excel';
  }

  private async _streamFile(
    res: Response,
    data: Awaited<ReturnType<ReportsService['getEquipmentInventoryData']>>,
    format: ReportFormat,
    _startDate?: string,
    _endDate?: string
  ): Promise<void> {
    const { buffer, mimeType, filename } = await this.reportExportService.generate(data, format);
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    res.end(buffer);
  }
}
