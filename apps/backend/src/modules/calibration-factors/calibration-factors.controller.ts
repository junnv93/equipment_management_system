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
import { CalibrationFactorsService } from './calibration-factors.service';
import { CreateCalibrationFactorDto } from './dto/create-calibration-factor.dto';
import { CalibrationFactorQueryDto } from './dto/calibration-factor-query.dto';
import {
  ApproveCalibrationFactorDto,
  RejectCalibrationFactorDto,
} from './dto/approve-calibration-factor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RequirePermissions } from '../../decorators/require-permissions.decorator';
import { Permission } from '../auth/rbac/permissions.enum';

@ApiTags('보정계수 관리')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('calibration-factors')
export class CalibrationFactorsController {
  constructor(private readonly calibrationFactorsService: CalibrationFactorsService) {}

  @Post()
  @ApiOperation({
    summary: '보정계수 변경 요청',
    description: '새로운 보정계수 변경을 요청합니다. 상태는 pending으로 설정됩니다.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '보정계수 변경 요청이 성공적으로 등록되었습니다.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.CREATE_CALIBRATION_FACTOR)
  create(@Body() createDto: CreateCalibrationFactorDto) {
    return this.calibrationFactorsService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: '보정계수 목록 조회',
    description: '보정계수 목록을 조회합니다. 필터: equipmentId, approvalStatus',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '보정계수 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATION_FACTORS)
  findAll(@Query() query: CalibrationFactorQueryDto) {
    return this.calibrationFactorsService.findAll(query);
  }

  @Get('pending')
  @ApiOperation({
    summary: '승인 대기 보정계수 목록 조회',
    description: '승인 대기 상태인 보정계수 목록을 조회합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '승인 대기 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATION_FACTOR_REQUESTS)
  findPendingApprovals() {
    return this.calibrationFactorsService.findPendingApprovals();
  }

  @Get('registry')
  @ApiOperation({
    summary: '보정계수 대장 조회',
    description: '전체 장비의 현재 적용 중인 보정계수를 조회합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '보정계수 대장 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATION_FACTORS)
  getRegistry() {
    return this.calibrationFactorsService.getRegistry();
  }

  @Get('equipment/:equipmentUuid')
  @ApiOperation({
    summary: '장비별 현재 보정계수 조회',
    description: '특정 장비에 적용 중인 보정계수를 조회합니다.',
  })
  @ApiParam({ name: 'equipmentUuid', description: '장비 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '장비별 보정계수 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATION_FACTORS)
  findByEquipment(@Param('equipmentUuid') equipmentUuid: string) {
    return this.calibrationFactorsService.findByEquipment(equipmentUuid);
  }

  @Get(':uuid')
  @ApiOperation({
    summary: '보정계수 상세 조회',
    description: '특정 보정계수의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'uuid', description: '보정계수 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '보정계수 상세 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '보정계수를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATION_FACTORS)
  findOne(@Param('uuid') uuid: string) {
    return this.calibrationFactorsService.findOne(uuid);
  }

  @Patch(':uuid/approve')
  @ApiOperation({
    summary: '보정계수 승인',
    description: '기술책임자가 보정계수 변경 요청을 승인합니다.',
  })
  @ApiParam({ name: 'uuid', description: '보정계수 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '보정계수 승인 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '보정계수를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터 또는 상태 오류' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.APPROVE_CALIBRATION_FACTOR)
  approve(@Param('uuid') uuid: string, @Body() approveDto: ApproveCalibrationFactorDto) {
    return this.calibrationFactorsService.approve(uuid, approveDto);
  }

  @Patch(':uuid/reject')
  @ApiOperation({
    summary: '보정계수 반려',
    description: '기술책임자가 보정계수 변경 요청을 반려합니다.',
  })
  @ApiParam({ name: 'uuid', description: '보정계수 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '보정계수 반려 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '보정계수를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터 또는 상태 오류' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.APPROVE_CALIBRATION_FACTOR)
  reject(@Param('uuid') uuid: string, @Body() rejectDto: RejectCalibrationFactorDto) {
    return this.calibrationFactorsService.reject(uuid, rejectDto);
  }

  @Delete(':uuid')
  @ApiOperation({
    summary: '보정계수 삭제 (소프트 삭제)',
    description: '보정계수를 소프트 삭제합니다. 이력은 영구 보관됩니다.',
  })
  @ApiParam({ name: 'uuid', description: '보정계수 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '보정계수 삭제 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '보정계수를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.APPROVE_CALIBRATION_FACTOR)
  remove(@Param('uuid') uuid: string) {
    return this.calibrationFactorsService.remove(uuid);
  }
}
