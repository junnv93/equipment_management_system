import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RequirePermissions } from '../../decorators/require-permissions.decorator';
import { Permission } from '../auth/rbac/permissions.enum';

@ApiTags('보고서')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

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

  @Get('export/equipment-usage')
  @ApiOperation({
    summary: '장비 사용 보고서 내보내기',
    description: '장비별 사용 통계를 Excel 또는 CSV 형식으로 내보냅니다.',
  })
  @ApiQuery({
    name: 'format',
    required: true,
    description: '내보내기 형식 (excel, csv)',
    enum: ['excel', 'csv'],
  })
  @ApiQuery({ name: 'startDate', required: false, description: '시작 날짜 (ISO 형식)' })
  @ApiQuery({ name: 'endDate', required: false, description: '종료 날짜 (ISO 형식)' })
  @ApiResponse({ status: 200, description: '보고서 내보내기 성공' })
  @RequirePermissions(Permission.EXPORT_REPORTS)
  exportEquipmentUsage(
    @Query('format') format: 'excel' | 'csv',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.reportsService.exportEquipmentUsage(format, startDate, endDate);
  }
}
