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
  SubmitForReviewDto,
  ReviewCalibrationPlanDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@equipment-management/shared-constants';

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
  create(@Body() createDto: CreateCalibrationPlanDto): Promise<{
    items: {
      equipment: {
        id: string;
        name: string;
        managementNumber: string;
        modelName: string | null;
        manufacturer: string | null;
        location: string | null;
        calibrationCycle: number | null;
        lastCalibrationDate: Date | null;
        nextCalibrationDate: Date | null;
        calibrationAgency: string | null;
      };
      id: string;
      createdAt: Date;
      updatedAt: Date;
      planId: string;
      equipmentId: string;
      sequenceNumber: number;
      snapshotValidityDate: Date | null;
      snapshotCalibrationCycle: number | null;
      snapshotCalibrationAgency: string | null;
      plannedCalibrationDate: Date | null;
      plannedCalibrationAgency: string | null;
      confirmedBy: string | null;
      confirmedAt: Date | null;
      actualCalibrationDate: Date | null;
      notes: string | null;
    }[];
    id: string;
    year: number;
    siteId: string;
    teamId: string | null;
    status: string;
    createdBy: string;
    submittedAt: Date | null;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    reviewComment: string | null;
    approvedBy: string | null;
    approvedAt: Date | null;
    rejectedBy: string | null;
    rejectedAt: Date | null;
    rejectionReason: string | null;
    rejectionStage: string | null;
    version: number;
    parentPlanId: string | null;
    isLatestVersion: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> {
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
  findAll(@Query() query: CalibrationPlanQueryDto): Promise<{
    items: {
      id: string;
      year: number;
      siteId: string;
      teamId: string | null;
      status: string;
      createdBy: string;
      submittedAt: Date | null;
      reviewedBy: string | null;
      reviewedAt: Date | null;
      reviewComment: string | null;
      approvedBy: string | null;
      approvedAt: Date | null;
      rejectedBy: string | null;
      rejectedAt: Date | null;
      rejectionReason: string | null;
      rejectionStage: string | null;
      version: number;
      parentPlanId: string | null;
      isLatestVersion: boolean;
      createdAt: Date;
      updatedAt: Date;
    }[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
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
  findExternalEquipment(@Query() query: ExternalEquipmentQueryDto): Promise<
    {
      id: string;
      name: string;
      managementNumber: string;
      modelName: string | null;
      manufacturer: string | null;
      location: string | null;
      site: string;
      lastCalibrationDate: Date | null;
      nextCalibrationDate: Date | null;
      calibrationCycle: number | null;
      calibrationAgency: string | null;
    }[]
  > {
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
  findOne(@Param('uuid', ParseUUIDPipe) uuid: string): Promise<{
    items: {
      equipment: {
        id: string;
        name: string;
        managementNumber: string;
        modelName: string | null;
        manufacturer: string | null;
        location: string | null;
        calibrationCycle: number | null;
        lastCalibrationDate: Date | null;
        nextCalibrationDate: Date | null;
        calibrationAgency: string | null;
      };
      id: string;
      createdAt: Date;
      updatedAt: Date;
      planId: string;
      equipmentId: string;
      sequenceNumber: number;
      snapshotValidityDate: Date | null;
      snapshotCalibrationCycle: number | null;
      snapshotCalibrationAgency: string | null;
      plannedCalibrationDate: Date | null;
      plannedCalibrationAgency: string | null;
      confirmedBy: string | null;
      confirmedAt: Date | null;
      actualCalibrationDate: Date | null;
      notes: string | null;
    }[];
    id: string;
    year: number;
    siteId: string;
    teamId: string | null;
    status: string;
    createdBy: string;
    submittedAt: Date | null;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    reviewComment: string | null;
    approvedBy: string | null;
    approvedAt: Date | null;
    rejectedBy: string | null;
    rejectedAt: Date | null;
    rejectionReason: string | null;
    rejectionStage: string | null;
    version: number;
    parentPlanId: string | null;
    isLatestVersion: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> {
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
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateDto: UpdateCalibrationPlanDto
  ): Promise<{
    items: {
      equipment: {
        id: string;
        name: string;
        managementNumber: string;
        modelName: string | null;
        manufacturer: string | null;
        location: string | null;
        calibrationCycle: number | null;
        lastCalibrationDate: Date | null;
        nextCalibrationDate: Date | null;
        calibrationAgency: string | null;
      };
      id: string;
      createdAt: Date;
      updatedAt: Date;
      planId: string;
      equipmentId: string;
      sequenceNumber: number;
      snapshotValidityDate: Date | null;
      snapshotCalibrationCycle: number | null;
      snapshotCalibrationAgency: string | null;
      plannedCalibrationDate: Date | null;
      plannedCalibrationAgency: string | null;
      confirmedBy: string | null;
      confirmedAt: Date | null;
      actualCalibrationDate: Date | null;
      notes: string | null;
    }[];
    id: string;
    year: number;
    siteId: string;
    teamId: string | null;
    status: string;
    createdBy: string;
    submittedAt: Date | null;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    reviewComment: string | null;
    approvedBy: string | null;
    approvedAt: Date | null;
    rejectedBy: string | null;
    rejectedAt: Date | null;
    rejectionReason: string | null;
    rejectionStage: string | null;
    version: number;
    parentPlanId: string | null;
    isLatestVersion: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> {
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
  remove(@Param('uuid', ParseUUIDPipe) uuid: string): Promise<{ uuid: string; deleted: boolean }> {
    return this.calibrationPlansService.remove(uuid);
  }

  @Post(':uuid/submit')
  @ApiOperation({
    summary: '승인 요청 (레거시)',
    description: '교정계획서의 승인을 요청합니다. submit-for-review 사용 권장.',
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
  ): Promise<{
    items: {
      equipment: {
        id: string;
        name: string;
        managementNumber: string;
        modelName: string | null;
        manufacturer: string | null;
        location: string | null;
        calibrationCycle: number | null;
        lastCalibrationDate: Date | null;
        nextCalibrationDate: Date | null;
        calibrationAgency: string | null;
      };
      id: string;
      createdAt: Date;
      updatedAt: Date;
      planId: string;
      equipmentId: string;
      sequenceNumber: number;
      snapshotValidityDate: Date | null;
      snapshotCalibrationCycle: number | null;
      snapshotCalibrationAgency: string | null;
      plannedCalibrationDate: Date | null;
      plannedCalibrationAgency: string | null;
      confirmedBy: string | null;
      confirmedAt: Date | null;
      actualCalibrationDate: Date | null;
      notes: string | null;
    }[];
    id: string;
    year: number;
    siteId: string;
    teamId: string | null;
    status: string;
    createdBy: string;
    submittedAt: Date | null;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    reviewComment: string | null;
    approvedBy: string | null;
    approvedAt: Date | null;
    rejectedBy: string | null;
    rejectedAt: Date | null;
    rejectionReason: string | null;
    rejectionStage: string | null;
    version: number;
    parentPlanId: string | null;
    isLatestVersion: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> {
    return this.calibrationPlansService.submit(uuid);
  }

  @Post(':uuid/submit-for-review')
  @ApiOperation({
    summary: '검토 요청',
    description:
      '교정계획서의 검토를 요청합니다 (draft/rejected -> pending_review). 기술책임자가 품질책임자에게 요청.',
  })
  @ApiParam({ name: 'uuid', description: '교정계획서 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '검토 요청 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정계획서를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '상태 오류' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.SUBMIT_CALIBRATION_PLAN)
  submitForReview(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() submitDto: SubmitForReviewDto
  ): Promise<{
    items: {
      equipment: {
        id: string;
        name: string;
        managementNumber: string;
        modelName: string | null;
        manufacturer: string | null;
        location: string | null;
        calibrationCycle: number | null;
        lastCalibrationDate: Date | null;
        nextCalibrationDate: Date | null;
        calibrationAgency: string | null;
      };
      id: string;
      createdAt: Date;
      updatedAt: Date;
      planId: string;
      equipmentId: string;
      sequenceNumber: number;
      snapshotValidityDate: Date | null;
      snapshotCalibrationCycle: number | null;
      snapshotCalibrationAgency: string | null;
      plannedCalibrationDate: Date | null;
      plannedCalibrationAgency: string | null;
      confirmedBy: string | null;
      confirmedAt: Date | null;
      actualCalibrationDate: Date | null;
      notes: string | null;
    }[];
    id: string;
    year: number;
    siteId: string;
    teamId: string | null;
    status: string;
    createdBy: string;
    submittedAt: Date | null;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    reviewComment: string | null;
    approvedBy: string | null;
    approvedAt: Date | null;
    rejectedBy: string | null;
    rejectedAt: Date | null;
    rejectionReason: string | null;
    rejectionStage: string | null;
    version: number;
    parentPlanId: string | null;
    isLatestVersion: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> {
    return this.calibrationPlansService.submitForReview(uuid, submitDto);
  }

  @Patch(':uuid/review')
  @ApiOperation({
    summary: '검토 완료',
    description:
      '교정계획서 검토를 완료합니다 (pending_review -> pending_approval). 품질책임자만 가능.',
  })
  @ApiParam({ name: 'uuid', description: '교정계획서 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '검토 완료 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정계획서를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '상태 오류' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.REVIEW_CALIBRATION_PLAN)
  review(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() reviewDto: ReviewCalibrationPlanDto
  ): Promise<{
    items: {
      equipment: {
        id: string;
        name: string;
        managementNumber: string;
        modelName: string | null;
        manufacturer: string | null;
        location: string | null;
        calibrationCycle: number | null;
        lastCalibrationDate: Date | null;
        nextCalibrationDate: Date | null;
        calibrationAgency: string | null;
      };
      id: string;
      createdAt: Date;
      updatedAt: Date;
      planId: string;
      equipmentId: string;
      sequenceNumber: number;
      snapshotValidityDate: Date | null;
      snapshotCalibrationCycle: number | null;
      snapshotCalibrationAgency: string | null;
      plannedCalibrationDate: Date | null;
      plannedCalibrationAgency: string | null;
      confirmedBy: string | null;
      confirmedAt: Date | null;
      actualCalibrationDate: Date | null;
      notes: string | null;
    }[];
    id: string;
    year: number;
    siteId: string;
    teamId: string | null;
    status: string;
    createdBy: string;
    submittedAt: Date | null;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    reviewComment: string | null;
    approvedBy: string | null;
    approvedAt: Date | null;
    rejectedBy: string | null;
    rejectedAt: Date | null;
    rejectionReason: string | null;
    rejectionStage: string | null;
    version: number;
    parentPlanId: string | null;
    isLatestVersion: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> {
    return this.calibrationPlansService.review(uuid, reviewDto);
  }

  @Patch(':uuid/approve')
  @ApiOperation({
    summary: '최종 승인',
    description: '교정계획서를 최종 승인합니다 (pending_approval -> approved). 시험소장만 가능.',
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
  ): Promise<{
    items: {
      equipment: {
        id: string;
        name: string;
        managementNumber: string;
        modelName: string | null;
        manufacturer: string | null;
        location: string | null;
        calibrationCycle: number | null;
        lastCalibrationDate: Date | null;
        nextCalibrationDate: Date | null;
        calibrationAgency: string | null;
      };
      id: string;
      createdAt: Date;
      updatedAt: Date;
      planId: string;
      equipmentId: string;
      sequenceNumber: number;
      snapshotValidityDate: Date | null;
      snapshotCalibrationCycle: number | null;
      snapshotCalibrationAgency: string | null;
      plannedCalibrationDate: Date | null;
      plannedCalibrationAgency: string | null;
      confirmedBy: string | null;
      confirmedAt: Date | null;
      actualCalibrationDate: Date | null;
      notes: string | null;
    }[];
    id: string;
    year: number;
    siteId: string;
    teamId: string | null;
    status: string;
    createdBy: string;
    submittedAt: Date | null;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    reviewComment: string | null;
    approvedBy: string | null;
    approvedAt: Date | null;
    rejectedBy: string | null;
    rejectedAt: Date | null;
    rejectionReason: string | null;
    rejectionStage: string | null;
    version: number;
    parentPlanId: string | null;
    isLatestVersion: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> {
    return this.calibrationPlansService.approve(uuid, approveDto);
  }

  @Patch(':uuid/reject')
  @ApiOperation({
    summary: '반려',
    description:
      '교정계획서를 반려합니다 (pending_review/pending_approval -> rejected). 품질책임자 또는 시험소장, 사유 필수.',
  })
  @ApiParam({ name: 'uuid', description: '교정계획서 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '반려 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정계획서를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '상태 오류 또는 사유 누락' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.REJECT_CALIBRATION_PLAN)
  reject(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() rejectDto: RejectCalibrationPlanDto
  ): Promise<{
    items: {
      equipment: {
        id: string;
        name: string;
        managementNumber: string;
        modelName: string | null;
        manufacturer: string | null;
        location: string | null;
        calibrationCycle: number | null;
        lastCalibrationDate: Date | null;
        nextCalibrationDate: Date | null;
        calibrationAgency: string | null;
      };
      id: string;
      createdAt: Date;
      updatedAt: Date;
      planId: string;
      equipmentId: string;
      sequenceNumber: number;
      snapshotValidityDate: Date | null;
      snapshotCalibrationCycle: number | null;
      snapshotCalibrationAgency: string | null;
      plannedCalibrationDate: Date | null;
      plannedCalibrationAgency: string | null;
      confirmedBy: string | null;
      confirmedAt: Date | null;
      actualCalibrationDate: Date | null;
      notes: string | null;
    }[];
    id: string;
    year: number;
    siteId: string;
    teamId: string | null;
    status: string;
    createdBy: string;
    submittedAt: Date | null;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    reviewComment: string | null;
    approvedBy: string | null;
    approvedAt: Date | null;
    rejectedBy: string | null;
    rejectedAt: Date | null;
    rejectionReason: string | null;
    rejectionStage: string | null;
    version: number;
    parentPlanId: string | null;
    isLatestVersion: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> {
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
  ): Promise<{
    id: string;
    planId: string;
    equipmentId: string;
    sequenceNumber: number;
    snapshotValidityDate: Date | null;
    snapshotCalibrationCycle: number | null;
    snapshotCalibrationAgency: string | null;
    plannedCalibrationDate: Date | null;
    plannedCalibrationAgency: string | null;
    confirmedBy: string | null;
    confirmedAt: Date | null;
    actualCalibrationDate: Date | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> {
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
  ): Promise<{
    id: string;
    planId: string;
    equipmentId: string;
    sequenceNumber: number;
    snapshotValidityDate: Date | null;
    snapshotCalibrationCycle: number | null;
    snapshotCalibrationAgency: string | null;
    plannedCalibrationDate: Date | null;
    plannedCalibrationAgency: string | null;
    confirmedBy: string | null;
    confirmedAt: Date | null;
    actualCalibrationDate: Date | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> {
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
  async downloadPdf(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Res() res: Response
  ): Promise<void> {
    const htmlBuffer = await this.pdfService.generatePdf(uuid);

    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': htmlBuffer.length,
    });

    res.send(htmlBuffer);
  }

  @Post(':uuid/new-version')
  @ApiOperation({
    summary: '새 버전 생성',
    description:
      '승인된 교정계획서의 새 버전을 생성합니다. 기존 항목이 복사되며, 새 버전은 draft 상태로 시작합니다.',
  })
  @ApiParam({ name: 'uuid', description: '교정계획서 UUID (승인된 계획서)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '새 버전 생성 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정계획서를 찾을 수 없음' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '승인된 계획서만 새 버전 생성 가능',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.CREATE_CALIBRATION_PLAN)
  createNewVersion(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() body: { createdBy: string }
  ): Promise<{
    items: {
      equipment: {
        id: string;
        name: string;
        managementNumber: string;
        modelName: string | null;
        manufacturer: string | null;
        location: string | null;
        calibrationCycle: number | null;
        lastCalibrationDate: Date | null;
        nextCalibrationDate: Date | null;
        calibrationAgency: string | null;
      };
      id: string;
      createdAt: Date;
      updatedAt: Date;
      planId: string;
      equipmentId: string;
      sequenceNumber: number;
      snapshotValidityDate: Date | null;
      snapshotCalibrationCycle: number | null;
      snapshotCalibrationAgency: string | null;
      plannedCalibrationDate: Date | null;
      plannedCalibrationAgency: string | null;
      confirmedBy: string | null;
      confirmedAt: Date | null;
      actualCalibrationDate: Date | null;
      notes: string | null;
    }[];
    id: string;
    year: number;
    siteId: string;
    teamId: string | null;
    status: string;
    createdBy: string;
    submittedAt: Date | null;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    reviewComment: string | null;
    approvedBy: string | null;
    approvedAt: Date | null;
    rejectedBy: string | null;
    rejectedAt: Date | null;
    rejectionReason: string | null;
    rejectionStage: string | null;
    version: number;
    parentPlanId: string | null;
    isLatestVersion: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> {
    return this.calibrationPlansService.createNewVersion(uuid, body.createdBy);
  }

  @Get(':uuid/versions')
  @ApiOperation({
    summary: '버전 히스토리 조회',
    description: '교정계획서의 모든 버전 히스토리를 조회합니다.',
  })
  @ApiParam({ name: 'uuid', description: '교정계획서 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '버전 히스토리 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정계획서를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATION_PLANS)
  getVersionHistory(@Param('uuid', ParseUUIDPipe) uuid: string): Promise<
    {
      id: string;
      year: number;
      siteId: string;
      status: string;
      version: number;
      isLatestVersion: boolean;
      createdBy: string;
      createdAt: Date;
      approvedBy: string | null;
      approvedAt: Date | null;
    }[]
  > {
    return this.calibrationPlansService.getVersionHistory(uuid);
  }
}
