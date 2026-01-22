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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiProduces,
} from '@nestjs/swagger';
import { CalibrationPlansService } from './calibration-plans.service';
import { CalibrationPlansPdfService } from './calibration-plans-pdf.service';
import {
  CreateCalibrationPlanDto,
  UpdateCalibrationPlanDto,
  UpdateCalibrationPlanItemDto,
  CalibrationPlanQueryDto,
  ExternalEquipmentQueryDto,
  ApproveCalibrationPlanDto,
  RejectCalibrationPlanDto,
  SubmitCalibrationPlanDto,
  ConfirmPlanItemDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RequirePermissions } from '../../decorators/require-permissions.decorator';
import { Permission } from '../auth/rbac/permissions.enum';

@ApiTags('교정계획서')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('calibration-plans')
export class CalibrationPlansController {
  constructor(
    private readonly calibrationPlansService: CalibrationPlansService,
    private readonly pdfService: CalibrationPlansPdfService
  ) {}

  @Post()
  @ApiOperation({
    summary: '교정계획서 생성',
    description:
      '새로운 교정계획서를 생성합니다. 해당 연도 교정 예정인 외부교정 대상 장비가 자동으로 로드됩니다.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '교정계획서가 성공적으로 생성되었습니다.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '이미 계획서가 존재함' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.CREATE_CALIBRATION_PLAN)
  create(@Body() createDto: CreateCalibrationPlanDto) {
    return this.calibrationPlansService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: '교정계획서 목록 조회',
    description: '교정계획서 목록을 조회합니다. 필터: year, siteId, status',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '교정계획서 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATION_PLANS)
  findAll(@Query() query: CalibrationPlanQueryDto) {
    return this.calibrationPlansService.findAll(query);
  }

  @Get('equipment/external')
  @ApiOperation({
    summary: '외부교정 대상 장비 조회',
    description: '외부교정 대상 장비 목록을 조회합니다. 필터: year, siteId',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '외부교정 대상 장비 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  findExternalEquipment(@Query() query: ExternalEquipmentQueryDto) {
    return this.calibrationPlansService.findExternalEquipment(query);
  }

  @Get(':uuid')
  @ApiOperation({
    summary: '교정계획서 상세 조회',
    description: '특정 교정계획서의 상세 정보를 조회합니다 (항목 포함).',
  })
  @ApiParam({ name: 'uuid', description: '교정계획서 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '교정계획서 상세 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정계획서를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATION_PLANS)
  findOne(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.calibrationPlansService.findOne(uuid);
  }

  @Patch(':uuid')
  @ApiOperation({
    summary: '교정계획서 수정',
    description: '교정계획서를 수정합니다. draft 상태에서만 가능합니다.',
  })
  @ApiParam({ name: 'uuid', description: '교정계획서 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '교정계획서 수정 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정계획서를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터 또는 상태 오류' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.UPDATE_CALIBRATION_PLAN)
  update(@Param('uuid', ParseUUIDPipe) uuid: string, @Body() updateDto: UpdateCalibrationPlanDto) {
    return this.calibrationPlansService.update(uuid, updateDto);
  }

  @Delete(':uuid')
  @ApiOperation({
    summary: '교정계획서 삭제',
    description: '교정계획서를 삭제합니다. draft 상태에서만 가능합니다.',
  })
  @ApiParam({ name: 'uuid', description: '교정계획서 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '교정계획서 삭제 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정계획서를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '상태 오류' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.DELETE_CALIBRATION_PLAN)
  remove(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.calibrationPlansService.remove(uuid);
  }

  @Post(':uuid/submit')
  @ApiOperation({
    summary: '승인 요청',
    description: '교정계획서의 승인을 요청합니다 (draft -> pending_approval).',
  })
  @ApiParam({ name: 'uuid', description: '교정계획서 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '승인 요청 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정계획서를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '상태 오류' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.SUBMIT_CALIBRATION_PLAN)
  submit(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() _submitDto?: SubmitCalibrationPlanDto
  ) {
    return this.calibrationPlansService.submit(uuid);
  }

  @Patch(':uuid/approve')
  @ApiOperation({
    summary: '승인',
    description: '교정계획서를 승인합니다 (pending_approval -> approved). lab_manager만 가능.',
  })
  @ApiParam({ name: 'uuid', description: '교정계획서 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '승인 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정계획서를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '상태 오류' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.APPROVE_CALIBRATION_PLAN)
  approve(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() approveDto: ApproveCalibrationPlanDto
  ) {
    return this.calibrationPlansService.approve(uuid, approveDto);
  }

  @Patch(':uuid/reject')
  @ApiOperation({
    summary: '반려',
    description:
      '교정계획서를 반려합니다 (pending_approval -> rejected). lab_manager만 가능, 사유 필수.',
  })
  @ApiParam({ name: 'uuid', description: '교정계획서 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '반려 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정계획서를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '상태 오류 또는 사유 누락' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.REJECT_CALIBRATION_PLAN)
  reject(@Param('uuid', ParseUUIDPipe) uuid: string, @Body() rejectDto: RejectCalibrationPlanDto) {
    return this.calibrationPlansService.reject(uuid, rejectDto);
  }

  @Patch(':uuid/items/:itemUuid/confirm')
  @ApiOperation({
    summary: '항목 확인',
    description: '교정계획서 항목을 확인합니다 (기술책임자). 승인된 계획서만 가능.',
  })
  @ApiParam({ name: 'uuid', description: '교정계획서 UUID' })
  @ApiParam({ name: 'itemUuid', description: '항목 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '항목 확인 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '계획서 또는 항목을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '상태 오류' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.CONFIRM_CALIBRATION_PLAN_ITEM)
  confirmItem(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Param('itemUuid', ParseUUIDPipe) itemUuid: string,
    @Body() confirmDto: ConfirmPlanItemDto
  ) {
    return this.calibrationPlansService.confirmItem(uuid, itemUuid, confirmDto);
  }

  @Patch(':uuid/items/:itemUuid')
  @ApiOperation({
    summary: '항목 수정',
    description: '교정계획서 항목을 수정합니다 (계획된 교정기관, 비고). draft 상태에서만 가능.',
  })
  @ApiParam({ name: 'uuid', description: '교정계획서 UUID' })
  @ApiParam({ name: 'itemUuid', description: '항목 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '항목 수정 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '계획서 또는 항목을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '상태 오류' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.UPDATE_CALIBRATION_PLAN)
  updateItem(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Param('itemUuid', ParseUUIDPipe) itemUuid: string,
    @Body() updateDto: UpdateCalibrationPlanItemDto
  ) {
    return this.calibrationPlansService.updateItem(uuid, itemUuid, updateDto);
  }

  @Get(':uuid/pdf')
  @ApiOperation({
    summary: 'PDF 다운로드 (HTML)',
    description:
      '교정계획서를 인쇄 가능한 HTML로 출력합니다. 브라우저에서 인쇄(Ctrl+P)하여 PDF로 저장하세요.',
  })
  @ApiParam({ name: 'uuid', description: '교정계획서 UUID' })
  @ApiProduces('text/html')
  @ApiResponse({ status: HttpStatus.OK, description: 'HTML 출력 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정계획서를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATION_PLANS)
  async downloadPdf(@Param('uuid', ParseUUIDPipe) uuid: string, @Res() res: Response) {
    const htmlBuffer = await this.pdfService.generatePdf(uuid);

    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': htmlBuffer.length,
    });

    res.send(htmlBuffer);
  }
}
