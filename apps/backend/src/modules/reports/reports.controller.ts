import { Controller, Get, Param, Query, Res, Request, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { ReportExportService } from './report-export.service';
import { FormTemplateExportService } from './form-template-export.service';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SkipResponseTransform } from '../../common/interceptors/response-transform.interceptor';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { SiteScoped } from '../../common/decorators/site-scoped.decorator';
import {
  CurrentScope,
  CurrentEnforcedScope,
} from '../../common/decorators/current-scope.decorator';
import type { EnforcedScope } from '../../common/scope/scope-enforcer';
import {
  Permission,
  resolveDataScope,
  AUDIT_LOG_SCOPE,
  REPORT_DATA_SCOPE,
} from '@equipment-management/shared-constants';
import {
  SiteEnum,
  type UserRole,
  REPORT_FORMAT_VALUES,
  REPORT_PERIOD_VALUES,
} from '@equipment-management/schemas';
import type { AuthenticatedRequest } from '../../types/auth';
import type {
  EquipmentUsageReport,
  CalibrationStatusReport,
  CheckoutStatisticsReport,
  UtilizationRateReport,
  EquipmentDowntimeReport,
} from './reports.types';
import type { ReportFormat } from './report-export.service';
import type { ResolvedDataScope } from '@equipment-management/shared-constants';
import {
  EquipmentUsageQueryPipe,
  CalibrationStatusQueryPipe,
  CheckoutStatisticsQueryPipe,
  UtilizationRateQueryPipe,
  EquipmentDowntimeQueryPipe,
  ExportEquipmentUsageQueryPipe,
  ExportEquipmentInventoryQueryPipe,
  ExportCalibrationStatusQueryPipe,
  ExportUtilizationQueryPipe,
  ExportTeamEquipmentQueryPipe,
  ExportMaintenanceQueryPipe,
  ExportAuditLogsQueryPipe,
  type EquipmentUsageQueryInput,
  type CalibrationStatusQueryInput,
  type CheckoutStatisticsQueryInput,
  type UtilizationRateQueryInput,
  type EquipmentDowntimeQueryInput,
  type ExportEquipmentUsageQueryInput,
  type ExportEquipmentInventoryQueryInput,
  type ExportCalibrationStatusQueryInput,
  type ExportUtilizationQueryInput,
  type ExportTeamEquipmentQueryInput,
  type ExportMaintenanceQueryInput,
  type ExportAuditLogsQueryInput,
} from './dto/report-query.dto';

@ApiTags('보고서')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportExportService: ReportExportService,
    private readonly formTemplateExportService: FormTemplateExportService
  ) {}

  // ── 통계 집계 엔드포인트 (JSON) ─────────────────────────────────────────────
  // 모든 stat / export 라우트는 @SiteScoped({ policy: REPORT_DATA_SCOPE, failLoud: true })
  // + @CurrentScope() 로 인터셉터에 위임 — controller helper 불필요.
  // audit-logs 라우트만 별도 AUDIT_LOG_SCOPE + 'none' 시 빈 보고서 fallback 정책으로
  // 인라인 처리.

  @Get('equipment-usage')
  @ApiOperation({ summary: '장비 사용 보고서', description: '장비별 사용 통계를 제공합니다.' })
  @ApiQuery({ name: 'startDate', required: false, description: '시작 날짜 (ISO 형식)' })
  @ApiQuery({ name: 'endDate', required: false, description: '종료 날짜 (ISO 형식)' })
  @ApiQuery({ name: 'equipmentId', required: false, description: '특정 장비 ID' })
  @ApiResponse({ status: 200, description: '장비 사용 통계 조회 성공' })
  @RequirePermissions(Permission.VIEW_STATISTICS)
  @SiteScoped({ policy: REPORT_DATA_SCOPE, failLoud: true })
  @UsePipes(EquipmentUsageQueryPipe)
  getEquipmentUsage(
    @CurrentScope() scope: ResolvedDataScope,
    @Query() query: EquipmentUsageQueryInput
  ): Promise<EquipmentUsageReport> {
    return this.reportsService.getEquipmentUsage(query, scope);
  }

  @Get('calibration-status')
  @ApiOperation({
    summary: '교정 상태 보고서',
    description: '장비 교정 상태에 대한 통계를 제공합니다.',
  })
  @ApiQuery({ name: 'status', required: false, description: '교정 상태 (due, overdue, completed)' })
  @ApiQuery({ name: 'timeframe', required: false, description: '기간', enum: REPORT_PERIOD_VALUES })
  @ApiResponse({ status: 200, description: '교정 상태 통계 조회 성공' })
  @RequirePermissions(Permission.VIEW_STATISTICS)
  @SiteScoped({ policy: REPORT_DATA_SCOPE, failLoud: true })
  @UsePipes(CalibrationStatusQueryPipe)
  getCalibrationStatus(
    @CurrentScope() scope: ResolvedDataScope,
    @Query() query: CalibrationStatusQueryInput
  ): Promise<CalibrationStatusReport> {
    return this.reportsService.getCalibrationStatus(query, scope);
  }

  @Get('rental-statistics')
  @ApiOperation({ summary: '대여 통계 보고서', description: '장비 대여에 대한 통계를 제공합니다.' })
  @ApiQuery({ name: 'startDate', required: false, description: '시작 날짜 (ISO 형식)' })
  @ApiQuery({ name: 'endDate', required: false, description: '종료 날짜 (ISO 형식)' })
  @ApiResponse({ status: 200, description: '대여 통계 조회 성공' })
  @RequirePermissions(Permission.VIEW_STATISTICS)
  @SiteScoped({ policy: REPORT_DATA_SCOPE, failLoud: true })
  @UsePipes(CheckoutStatisticsQueryPipe)
  getRentalStatistics(
    @CurrentScope() scope: ResolvedDataScope,
    @Query() query: CheckoutStatisticsQueryInput
  ): Promise<CheckoutStatisticsReport> {
    return this.reportsService.getCheckoutStatistics(query, scope);
  }

  @Get('utilization-rate')
  @ApiOperation({ summary: '장비 활용률 보고서', description: '장비별 활용률 통계를 제공합니다.' })
  @ApiQuery({ name: 'period', required: false, description: '기간', enum: REPORT_PERIOD_VALUES })
  @ApiQuery({ name: 'equipmentId', required: false, description: '특정 장비 ID' })
  @ApiResponse({ status: 200, description: '장비 활용률 조회 성공' })
  @RequirePermissions(Permission.VIEW_STATISTICS)
  @SiteScoped({ policy: REPORT_DATA_SCOPE, failLoud: true })
  @UsePipes(UtilizationRateQueryPipe)
  getUtilizationRate(
    @CurrentScope() scope: ResolvedDataScope,
    @Query() query: UtilizationRateQueryInput
  ): Promise<UtilizationRateReport> {
    return this.reportsService.getUtilizationRate(query, scope);
  }

  @Get('equipment-downtime')
  @ApiOperation({
    summary: '장비 가동 중단 보고서',
    description: '장비 유지보수 및 수리로 인한 가동 중단 통계를 제공합니다.',
  })
  @ApiQuery({ name: 'startDate', required: false, description: '시작 날짜 (ISO 형식)' })
  @ApiQuery({ name: 'endDate', required: false, description: '종료 날짜 (ISO 형식)' })
  @ApiQuery({ name: 'equipmentId', required: false, description: '특정 장비 ID' })
  @ApiResponse({ status: 200, description: '장비 가동 중단 통계 조회 성공' })
  @RequirePermissions(Permission.VIEW_STATISTICS)
  @SiteScoped({ policy: REPORT_DATA_SCOPE, failLoud: true })
  @UsePipes(EquipmentDowntimeQueryPipe)
  getEquipmentDowntime(
    @CurrentScope() scope: ResolvedDataScope,
    @Query() query: EquipmentDowntimeQueryInput
  ): Promise<EquipmentDowntimeReport> {
    return this.reportsService.getEquipmentDowntime(query, scope);
  }

  // ── 파일 내보내기 엔드포인트 ────────────────────────────────────────────────
  // 공통 패턴: DB 조회 → 파일 생성 → 바이너리 스트리밍 (Content-Disposition 헤더)
  // @SkipResponseTransform: ResponseTransformInterceptor({success,data}) 래핑 방지
  // @AuditLog: 내보내기 감사 추적
  // ──────────────────────────────────────────────────────────────────────────

  @Get('export/equipment-usage')
  @ApiOperation({ summary: '장비 사용 보고서 내보내기 (구 형식 — 하위 호환)' })
  @ApiQuery({ name: 'format', required: true, enum: REPORT_FORMAT_VALUES })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: '파일 스트림' })
  @RequirePermissions(Permission.EXPORT_REPORTS)
  @SiteScoped({ policy: REPORT_DATA_SCOPE, failLoud: true })
  @AuditLog({ action: 'export', entityType: 'report' })
  @SkipResponseTransform()
  @UsePipes(ExportEquipmentUsageQueryPipe)
  async exportEquipmentUsage(
    @CurrentScope() scope: ResolvedDataScope,
    @Res() res: Response,
    @Query() query: ExportEquipmentUsageQueryInput
  ): Promise<void> {
    const data = await this.reportsService.getEquipmentInventoryData({ site: scope.site }, scope);
    await this._streamFile(res, data, query.format);
  }

  @Get('export/equipment-inventory')
  @ApiOperation({ summary: '장비 현황 보고서 내보내기' })
  @ApiQuery({ name: 'format', required: true, enum: REPORT_FORMAT_VALUES })
  @ApiQuery({ name: 'site', required: false, enum: SiteEnum.options, description: '사이트 필터' })
  @ApiQuery({ name: 'status', required: false, description: '장비 상태' })
  @ApiQuery({ name: 'teamId', required: false, description: '팀 ID' })
  @ApiResponse({ status: 200, description: '파일 스트림' })
  @RequirePermissions(Permission.EXPORT_REPORTS)
  @SiteScoped({ policy: REPORT_DATA_SCOPE, failLoud: true })
  @AuditLog({ action: 'export', entityType: 'report' })
  @SkipResponseTransform()
  @UsePipes(ExportEquipmentInventoryQueryPipe)
  async exportEquipmentInventory(
    @CurrentScope() scope: ResolvedDataScope,
    @Res() res: Response,
    @Query() query: ExportEquipmentInventoryQueryInput
  ): Promise<void> {
    const data = await this.reportsService.getEquipmentInventoryData(
      { site: query.site, status: query.status, teamId: query.teamId },
      scope
    );
    await this._streamFile(res, data, query.format);
  }

  @Get('export/calibration-status')
  @ApiOperation({ summary: '교정 현황 보고서 내보내기' })
  @ApiQuery({ name: 'format', required: true, enum: REPORT_FORMAT_VALUES })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'status', required: false, description: '교정 상태' })
  @ApiResponse({ status: 200, description: '파일 스트림' })
  @RequirePermissions(Permission.EXPORT_REPORTS)
  @SiteScoped({ policy: REPORT_DATA_SCOPE, failLoud: true })
  @AuditLog({ action: 'export', entityType: 'report' })
  @SkipResponseTransform()
  @UsePipes(ExportCalibrationStatusQueryPipe)
  async exportCalibrationStatus(
    @CurrentScope() scope: ResolvedDataScope,
    @Res() res: Response,
    @Query() query: ExportCalibrationStatusQueryInput
  ): Promise<void> {
    const data = await this.reportsService.getCalibrationStatusData(
      { startDate: query.startDate, endDate: query.endDate, status: query.status },
      scope
    );
    await this._streamFile(res, data, query.format);
  }

  @Get('export/utilization')
  @ApiOperation({ summary: '장비 활용률 보고서 내보내기' })
  @ApiQuery({ name: 'format', required: true, enum: REPORT_FORMAT_VALUES })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'last_week|last_month|last_quarter|last_year',
  })
  @ApiQuery({ name: 'site', required: false, enum: SiteEnum.options, description: '사이트 필터' })
  @ApiResponse({ status: 200, description: '파일 스트림' })
  @RequirePermissions(Permission.EXPORT_REPORTS)
  @SiteScoped({ policy: REPORT_DATA_SCOPE, failLoud: true })
  @AuditLog({ action: 'export', entityType: 'report' })
  @SkipResponseTransform()
  @UsePipes(ExportUtilizationQueryPipe)
  async exportUtilization(
    @CurrentScope() scope: ResolvedDataScope,
    @Res() res: Response,
    @Query() query: ExportUtilizationQueryInput
  ): Promise<void> {
    const data = await this.reportsService.getUtilizationData(
      {
        startDate: query.startDate,
        endDate: query.endDate,
        period: query.period,
        site: query.site,
      },
      scope
    );
    await this._streamFile(res, data, query.format);
  }

  @Get('export/team-equipment')
  @ApiOperation({ summary: '팀별 장비 현황 보고서 내보내기' })
  @ApiQuery({ name: 'format', required: true, enum: REPORT_FORMAT_VALUES })
  @ApiQuery({ name: 'site', required: false, enum: SiteEnum.options, description: '사이트 필터' })
  @ApiQuery({ name: 'teamId', required: false })
  @ApiResponse({ status: 200, description: '파일 스트림' })
  @RequirePermissions(Permission.EXPORT_REPORTS)
  @SiteScoped({ policy: REPORT_DATA_SCOPE, failLoud: true })
  @AuditLog({ action: 'export', entityType: 'report' })
  @SkipResponseTransform()
  @UsePipes(ExportTeamEquipmentQueryPipe)
  async exportTeamEquipment(
    @CurrentScope() scope: ResolvedDataScope,
    @Res() res: Response,
    @Query() query: ExportTeamEquipmentQueryInput
  ): Promise<void> {
    const data = await this.reportsService.getTeamEquipmentData(
      { site: query.site, teamId: query.teamId },
      scope
    );
    await this._streamFile(res, data, query.format);
  }

  @Get('export/maintenance')
  @ApiOperation({ summary: '수리 및 점검 이력 보고서 내보내기' })
  @ApiQuery({ name: 'format', required: true, enum: REPORT_FORMAT_VALUES })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'equipmentId', required: false })
  @ApiResponse({ status: 200, description: '파일 스트림' })
  @RequirePermissions(Permission.EXPORT_REPORTS)
  @SiteScoped({ policy: REPORT_DATA_SCOPE, failLoud: true })
  @AuditLog({ action: 'export', entityType: 'report' })
  @SkipResponseTransform()
  @UsePipes(ExportMaintenanceQueryPipe)
  async exportMaintenance(
    @CurrentScope() scope: ResolvedDataScope,
    @Res() res: Response,
    @Query() query: ExportMaintenanceQueryInput
  ): Promise<void> {
    const data = await this.reportsService.getMaintenanceData(
      { startDate: query.startDate, endDate: query.endDate, equipmentId: query.equipmentId },
      scope
    );
    await this._streamFile(res, data, query.format);
  }

  @Get('export/audit-logs')
  @ApiOperation({
    summary: '감사 로그 내보내기',
    description:
      'RBAC 스코프 적용 감사 로그를 Excel/CSV/PDF로 내보냅니다. 최대 10,000건, 날짜 필터로 분할 권장.',
  })
  @ApiQuery({ name: 'format', required: true, enum: REPORT_FORMAT_VALUES })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'startDate', required: false, description: 'ISO 8601 형식 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'ISO 8601 형식 (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: '파일 스트림' })
  @RequirePermissions(Permission.VIEW_AUDIT_LOGS)
  @AuditLog({ action: 'export', entityType: 'report' })
  @SkipResponseTransform()
  @UsePipes(ExportAuditLogsQueryPipe)
  async exportAuditLogs(
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
    @Query() query: ExportAuditLogsQueryInput
  ): Promise<void> {
    // 감사 로그는 REPORT_DATA_SCOPE가 아닌 전용 AUDIT_LOG_SCOPE 사용
    const scope = resolveDataScope(
      {
        role: req.user.roles[0] as UserRole,
        site: req.user.site,
        teamId: req.user.teamId,
      },
      AUDIT_LOG_SCOPE
    );

    // none 스코프: 접근 불가 — 빈 보고서 반환 (fail-close)
    if (scope.type === 'none') {
      const emptyData = {
        title: '감사 로그 보고서',
        columns: [],
        rows: [],
        generatedAt: new Date(),
      };
      await this._streamFile(res, emptyData, query.format);
      return;
    }

    const data = await this.reportsService.getAuditLogExportData({
      userId: query.userId,
      entityType: query.entityType,
      action: query.action,
      startDate: query.startDate,
      endDate: query.endDate,
      userSite: scope.site,
      userTeamId: scope.teamId,
    });

    await this._streamFile(res, data, query.format);
  }

  // ── 공식 양식 템플릿 내보내기 (UL-QP-18-01 ~ 11) ────────────────────────

  @Get('export/form/:formNumber')
  @ApiOperation({ summary: '공식 양식 템플릿 내보내기' })
  @ApiResponse({ status: 200, description: '양식 파일' })
  @RequirePermissions(Permission.EXPORT_REPORTS)
  @SiteScoped({ policy: REPORT_DATA_SCOPE, failLoud: true })
  @AuditLog({ action: 'export', entityType: 'report' })
  @SkipResponseTransform()
  async exportFormTemplate(
    @Param('formNumber') formNumber: string,
    @Res() res: Response,
    @Query() queryParams: Record<string, string>,
    @CurrentEnforcedScope() enforcedScope: EnforcedScope
  ): Promise<void> {
    // 인터셉터가 cross-site/cross-team mismatch 를 이미 거부한 enforced 값을 주입.
    // service 는 더 이상 ResolvedDataScope 나 enforce 책임을 가지지 않음.
    const { buffer, mimeType, filename } = await this.formTemplateExportService.exportForm(
      formNumber,
      queryParams,
      enforcedScope
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

  private async _streamFile(
    res: Response,
    data: Awaited<ReturnType<ReportsService['getEquipmentInventoryData']>>,
    format: ReportFormat
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
