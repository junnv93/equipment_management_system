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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CalibrationService } from './calibration.service';
import { CreateCalibrationDto } from './dto/create-calibration.dto';
import { UpdateCalibrationDto } from './dto/update-calibration.dto';
import { CalibrationQueryDto } from './dto/calibration-query.dto';
import { ApproveCalibrationDto, RejectCalibrationDto } from './dto/approve-calibration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/rbac/permissions.enum';
import { CalibrationStatusEnum, CalibrationStatus } from '@equipment-management/schemas';

@ApiTags('교정 관리')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('calibration')
export class CalibrationController {
  constructor(private readonly calibrationService: CalibrationService) {}

  @Post()
  @ApiOperation({ summary: '교정 일정 등록', description: '새로운 교정 일정을 등록합니다.' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '교정 일정이 성공적으로 등록되었습니다.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.CREATE_CALIBRATION)
  create(@Body() createCalibrationDto: CreateCalibrationDto) {
    return this.calibrationService.create(createCalibrationDto);
  }

  @Get()
  @ApiOperation({
    summary: '교정 일정 목록 조회',
    description: '등록된 모든 교정 일정의 목록을 조회합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 일정 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  findAll(@Query() query: CalibrationQueryDto) {
    return this.calibrationService.findAll(query);
  }

  @Get('pending')
  @ApiOperation({
    summary: '승인 대기 교정 목록 조회',
    description: '승인 대기 상태인 교정 일정을 조회합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '승인 대기 교정 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATION_REQUESTS)
  findPendingApprovals() {
    return this.calibrationService.findPendingApprovals();
  }

  @Get('intermediate-checks')
  @ApiOperation({
    summary: '중간점검 예정 조회',
    description: '지정된 일수 내에 중간점검이 예정된 교정 목록을 조회합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '중간점검 예정 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  findUpcomingIntermediateChecks(@Query('days') days: number = 7) {
    return this.calibrationService.findUpcomingIntermediateChecks(days);
  }

  @Get('intermediate-checks/all')
  @ApiOperation({
    summary: '전체 중간점검 목록 조회',
    description: '모든 중간점검 일정을 조회합니다 (지연/예정 포함).',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '중간점검 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  findAllIntermediateChecks(
    @Query('status') status?: 'pending' | 'overdue',
    @Query('equipmentId') equipmentId?: string,
    @Query('managerId') managerId?: string
  ) {
    return this.calibrationService.findAllIntermediateChecks({
      status,
      equipmentId,
      managerId,
    });
  }

  @Post(':uuid/intermediate-check/complete')
  @ApiOperation({
    summary: '중간점검 완료 처리',
    description: '특정 교정의 중간점검을 완료 처리하고 관련 알림을 해제합니다.',
  })
  @ApiParam({ name: 'uuid', description: '교정 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '중간점검 완료 처리 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정 일정을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '중간점검이 예정되지 않은 교정' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  completeIntermediateCheck(
    @Param('uuid') uuid: string,
    @Body() body: { completedBy: string; notes?: string }
  ) {
    return this.calibrationService.completeIntermediateCheck(uuid, body.completedBy, body.notes);
  }

  @Get('equipment/:equipmentId')
  @ApiOperation({
    summary: '장비별 교정 기록 조회',
    description: '특정 장비의 모든 교정 기록을 조회합니다.',
  })
  @ApiParam({ name: 'equipmentId', description: '장비 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '장비별 교정 기록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  findByEquipment(@Param('equipmentId') equipmentId: string) {
    return this.calibrationService.findByEquipment(equipmentId);
  }

  @Get('due')
  @ApiOperation({
    summary: '교정 예정 일정 조회',
    description: '특정 일수 내에 교정이 예정된 장비의 교정 일정을 조회합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 예정 일정 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  findDueCalibrations(@Query('days') days: number = 30) {
    return this.calibrationService.findDueCalibrations(days);
  }

  @Get('manager/:managerId')
  @ApiOperation({
    summary: '담당자별 교정 일정 조회',
    description: '특정 담당자가 담당하는 교정 일정을 조회합니다.',
  })
  @ApiParam({ name: 'managerId', description: '담당자 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '담당자별 교정 일정 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  findByManager(@Param('managerId') managerId: string) {
    return this.calibrationService.findByManager(managerId);
  }

  @Get('scheduled')
  @ApiOperation({
    summary: '예정된 교정 일정 조회',
    description: '특정 기간에 예정된 교정 일정을 조회합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '예정된 교정 일정 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  findScheduled(
    @Query('fromDate') fromDate: string = new Date().toISOString(),
    @Query('toDate') toDate: string
  ) {
    const fromDateObj = new Date(fromDate);
    const toDateObj = toDate ? new Date(toDate) : new Date(fromDateObj);
    toDateObj.setMonth(toDateObj.getMonth() + 3); // 기본 3개월 범위

    return this.calibrationService.findScheduled(fromDateObj, toDateObj);
  }

  @Get(':uuid')
  @ApiOperation({
    summary: '교정 상세 조회',
    description: '특정 교정 일정의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'uuid', description: '교정 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 상세 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정 일정을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  findOne(@Param('uuid') uuid: string) {
    return this.calibrationService.findOne(uuid);
  }

  @Patch(':uuid')
  @ApiOperation({ summary: '교정 정보 수정', description: '특정 교정 일정의 정보를 수정합니다.' })
  @ApiParam({ name: 'uuid', description: '교정 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 정보 수정 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정 일정을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  update(@Param('uuid') uuid: string, @Body() updateCalibrationDto: UpdateCalibrationDto) {
    return this.calibrationService.update(uuid, updateCalibrationDto);
  }

  @Delete(':uuid')
  @ApiOperation({ summary: '교정 일정 삭제', description: '특정 교정 일정을 삭제합니다.' })
  @ApiParam({ name: 'uuid', description: '교정 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 일정 삭제 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정 일정을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.DELETE_CALIBRATION)
  remove(@Param('uuid') uuid: string) {
    return this.calibrationService.remove(uuid);
  }

  @Patch(':uuid/status')
  @ApiOperation({ summary: '교정 상태 변경', description: '특정 교정 일정의 상태를 변경합니다.' })
  @ApiParam({ name: 'uuid', description: '교정 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 상태 변경 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정 일정을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  updateStatus(@Param('uuid') uuid: string, @Body('status') status: CalibrationStatus) {
    return this.calibrationService.updateStatus(uuid, status);
  }

  @Patch(':uuid/complete')
  @ApiOperation({
    summary: '교정 완료 처리',
    description: '특정 교정 일정을 완료 처리하고 결과를 기록합니다.',
  })
  @ApiParam({ name: 'uuid', description: '교정 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 완료 처리 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정 일정을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터 또는 상태 오류' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  completeCalibration(
    @Param('uuid') uuid: string,
    @Body() updateCalibrationDto: UpdateCalibrationDto
  ) {
    return this.calibrationService.completeCalibration(uuid, updateCalibrationDto);
  }

  @Patch(':uuid/approve')
  @ApiOperation({
    summary: '교정 승인',
    description: '기술책임자가 시험실무자가 등록한 교정을 승인합니다.',
  })
  @ApiParam({ name: 'uuid', description: '교정 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 승인 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정 일정을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터 또는 상태 오류' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.APPROVE_CALIBRATION)
  approveCalibration(@Param('uuid') uuid: string, @Body() approveDto: ApproveCalibrationDto) {
    return this.calibrationService.approveCalibration(uuid, approveDto);
  }

  @Patch(':uuid/reject')
  @ApiOperation({
    summary: '교정 반려',
    description: '기술책임자가 시험실무자가 등록한 교정을 반려합니다.',
  })
  @ApiParam({ name: 'uuid', description: '교정 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 반려 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정 일정을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터 또는 상태 오류' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.APPROVE_CALIBRATION)
  rejectCalibration(@Param('uuid') uuid: string, @Body() rejectDto: RejectCalibrationDto) {
    return this.calibrationService.rejectCalibration(uuid, rejectDto);
  }
}
