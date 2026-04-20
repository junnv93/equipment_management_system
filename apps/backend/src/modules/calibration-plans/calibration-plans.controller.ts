import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  ParseUUIDPipe,
  Res,
  Request,
  UsePipes,
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
import { buildContentDisposition } from '../../common/http/content-disposition.util';
import { CalibrationPlansService } from './calibration-plans.service';
import { CalibrationPlansExportService } from './calibration-plans-export.service';
import {
  CreateCalibrationPlanDto,
  UpdateCalibrationPlanDto,
  UpdateCalibrationPlanItemDto,
  ApproveCalibrationPlanDto,
  RejectCalibrationPlanDto,
  SubmitCalibrationPlanDto,
  ConfirmPlanItemDto,
  SubmitForReviewDto,
  ReviewCalibrationPlanDto,
  CalibrationPlanQueryValidationPipe,
  ExternalEquipmentQueryValidationPipe,
} from './dto';
import type { CalibrationPlanQueryInput, ExternalEquipmentQueryInput } from './dto';
import { CreateCalibrationPlanValidationPipe } from './dto/create-calibration-plan.dto';
import {
  UpdateCalibrationPlanValidationPipe,
  UpdateCalibrationPlanItemValidationPipe,
} from './dto/update-calibration-plan.dto';
import {
  SubmitForReviewValidationPipe,
  ReviewCalibrationPlanValidationPipe,
  ApproveCalibrationPlanValidationPipe,
  RejectCalibrationPlanValidationPipe,
  ConfirmPlanItemValidationPipe,
} from './dto/approve-calibration-plan.dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission, CALIBRATION_PLAN_DATA_SCOPE } from '@equipment-management/shared-constants';
import { SiteScoped } from '../../common/decorators/site-scoped.decorator';
import { CurrentEnforcedScope } from '../../common/decorators/current-scope.decorator';
import type { EnforcedScope } from '../../common/scope/scope-enforcer';
import type { AuthenticatedRequest } from '../../types/auth';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { extractUserId, enforceSiteAccess } from '../../common/utils';
import type {
  CalibrationPlanDetail,
  CalibrationPlanListResult,
  CalibrationPlanDeleteResult,
  CalibrationPlanItem,
  ExternalCalibrationEquipment,
  CalibrationPlanVersionHistoryItem,
} from './calibration-plans.types';

@ApiTags('교정계획서')
@ApiBearerAuth()
@Controller('calibration-plans')
export class CalibrationPlansController {
  constructor(
    private readonly calibrationPlansService: CalibrationPlansService,
    private readonly exportService: CalibrationPlansExportService
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
  @RequirePermissions(Permission.CREATE_CALIBRATION_PLAN)
  @UsePipes(CreateCalibrationPlanValidationPipe)
  @AuditLog({ action: 'create', entityType: 'calibration_plan', entityIdPath: 'response.id' })
  create(
    @Body() createDto: CreateCalibrationPlanDto,
    @Request() req: AuthenticatedRequest
  ): Promise<CalibrationPlanDetail> {
    // 사이트 제한 역할(TE/TM)은 자기 사이트용 계획서만 생성 가능
    enforceSiteAccess(req, createDto.siteId, CALIBRATION_PLAN_DATA_SCOPE);
    const createdBy = extractUserId(req);
    return this.calibrationPlansService.create({ ...createDto, createdBy });
  }

  @Get()
  @ApiOperation({
    summary: '교정계획서 목록 조회',
    description: '교정계획서 목록을 조회합니다. 필터: year, siteId, status',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '교정계획서 목록 조회 성공' })
  @RequirePermissions(Permission.VIEW_CALIBRATION_PLANS)
  @SiteScoped({ policy: CALIBRATION_PLAN_DATA_SCOPE, siteField: 'siteId', failLoud: true })
  @UsePipes(CalibrationPlanQueryValidationPipe)
  findAll(
    @Query() query: CalibrationPlanQueryInput,
    @CurrentEnforcedScope() scope: EnforcedScope
  ): Promise<CalibrationPlanListResult> {
    // failLoud: enforced scope.site → 비표준 siteId 필드로 매핑.
    query.siteId = scope.site as CalibrationPlanQueryInput['siteId'];
    if (scope.teamId) query.teamId = scope.teamId;
    return this.calibrationPlansService.findAll(query);
  }

  @Get('equipment/external')
  @ApiOperation({
    summary: '외부교정 대상 장비 조회',
    description: '외부교정 대상 장비 목록을 조회합니다. 필터: year, siteId',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '외부교정 대상 장비 목록 조회 성공' })
  @RequirePermissions(Permission.VIEW_CALIBRATION_PLANS)
  @SiteScoped({ policy: CALIBRATION_PLAN_DATA_SCOPE, siteField: 'siteId', failLoud: true })
  @UsePipes(ExternalEquipmentQueryValidationPipe)
  findExternalEquipment(
    @Query() query: ExternalEquipmentQueryInput,
    @CurrentEnforcedScope() scope: EnforcedScope
  ): Promise<ExternalCalibrationEquipment[]> {
    // failLoud: enforced scope.site → 비표준 siteId 필드로 매핑.
    query.siteId = scope.site as ExternalEquipmentQueryInput['siteId'];
    if (scope.teamId) query.teamId = scope.teamId;
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
  @RequirePermissions(Permission.VIEW_CALIBRATION_PLANS)
  async findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<CalibrationPlanDetail> {
    // findOneBasic으로 경량 사이트 체크 후, findOne으로 전체 데이터 반환
    // findOne은 Cache-Aside(120s)이므로 캐시 히트 시 추가 비용 없음
    const basicPlan = await this.calibrationPlansService.findOneBasic(uuid);
    enforceSiteAccess(req, basicPlan.siteId, CALIBRATION_PLAN_DATA_SCOPE);
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
  @RequirePermissions(Permission.UPDATE_CALIBRATION_PLAN)
  @UsePipes(UpdateCalibrationPlanValidationPipe)
  @AuditLog({ action: 'update', entityType: 'calibration_plan', entityIdPath: 'params.uuid' })
  async update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateDto: UpdateCalibrationPlanDto,
    @Request() req: AuthenticatedRequest
  ): Promise<CalibrationPlanDetail> {
    const plan = await this.calibrationPlansService.findOneBasic(uuid);
    enforceSiteAccess(req, plan.siteId, CALIBRATION_PLAN_DATA_SCOPE);
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
  @RequirePermissions(Permission.DELETE_CALIBRATION_PLAN)
  @AuditLog({ action: 'delete', entityType: 'calibration_plan', entityIdPath: 'params.uuid' })
  async remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<CalibrationPlanDeleteResult> {
    const plan = await this.calibrationPlansService.findOneBasic(uuid);
    enforceSiteAccess(req, plan.siteId, CALIBRATION_PLAN_DATA_SCOPE);
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
  @RequirePermissions(Permission.SUBMIT_CALIBRATION_PLAN)
  @AuditLog({ action: 'update', entityType: 'calibration_plan', entityIdPath: 'params.uuid' })
  async submit(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest,
    @Body() _submitDto?: SubmitCalibrationPlanDto
  ): Promise<CalibrationPlanDetail> {
    const plan = await this.calibrationPlansService.findOneBasic(uuid);
    enforceSiteAccess(req, plan.siteId, CALIBRATION_PLAN_DATA_SCOPE);
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
  @RequirePermissions(Permission.SUBMIT_CALIBRATION_PLAN)
  @UsePipes(SubmitForReviewValidationPipe)
  @AuditLog({ action: 'update', entityType: 'calibration_plan', entityIdPath: 'params.uuid' })
  async submitForReview(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() submitDto: SubmitForReviewDto,
    @Request() req: AuthenticatedRequest
  ): Promise<CalibrationPlanDetail> {
    const plan = await this.calibrationPlansService.findOneBasic(uuid);
    enforceSiteAccess(req, plan.siteId, CALIBRATION_PLAN_DATA_SCOPE);
    const submittedBy = extractUserId(req);
    return this.calibrationPlansService.submitForReview(uuid, { ...submitDto, submittedBy });
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
  @RequirePermissions(Permission.REVIEW_CALIBRATION_PLAN)
  @UsePipes(ReviewCalibrationPlanValidationPipe)
  @AuditLog({ action: 'update', entityType: 'calibration_plan', entityIdPath: 'params.uuid' })
  async review(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() reviewDto: ReviewCalibrationPlanDto,
    @Request() req: AuthenticatedRequest
  ): Promise<CalibrationPlanDetail> {
    const plan = await this.calibrationPlansService.findOneBasic(uuid);
    enforceSiteAccess(req, plan.siteId, CALIBRATION_PLAN_DATA_SCOPE);
    const reviewedBy = extractUserId(req);
    return this.calibrationPlansService.review(uuid, { ...reviewDto, reviewedBy });
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
  @RequirePermissions(Permission.APPROVE_CALIBRATION_PLAN)
  @UsePipes(ApproveCalibrationPlanValidationPipe)
  @AuditLog({ action: 'approve', entityType: 'calibration_plan', entityIdPath: 'params.uuid' })
  async approve(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() approveDto: ApproveCalibrationPlanDto,
    @Request() req: AuthenticatedRequest
  ): Promise<CalibrationPlanDetail> {
    const plan = await this.calibrationPlansService.findOneBasic(uuid);
    enforceSiteAccess(req, plan.siteId, CALIBRATION_PLAN_DATA_SCOPE);
    const approvedBy = extractUserId(req);
    return this.calibrationPlansService.approve(uuid, { ...approveDto, approvedBy });
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
  @RequirePermissions(Permission.REJECT_CALIBRATION_PLAN)
  @UsePipes(RejectCalibrationPlanValidationPipe)
  @AuditLog({ action: 'reject', entityType: 'calibration_plan', entityIdPath: 'params.uuid' })
  async reject(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() rejectDto: RejectCalibrationPlanDto,
    @Request() req: AuthenticatedRequest
  ): Promise<CalibrationPlanDetail> {
    const plan = await this.calibrationPlansService.findOneBasic(uuid);
    enforceSiteAccess(req, plan.siteId, CALIBRATION_PLAN_DATA_SCOPE);
    const rejectedBy = extractUserId(req);
    return this.calibrationPlansService.reject(uuid, { ...rejectDto, rejectedBy });
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
  @RequirePermissions(Permission.CONFIRM_CALIBRATION_PLAN_ITEM)
  @UsePipes(ConfirmPlanItemValidationPipe)
  @AuditLog({ action: 'update', entityType: 'calibration_plan', entityIdPath: 'params.uuid' })
  async confirmItem(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Param('itemUuid', ParseUUIDPipe) itemUuid: string,
    @Body() confirmDto: ConfirmPlanItemDto,
    @Request() req: AuthenticatedRequest
  ): Promise<CalibrationPlanItem> {
    const plan = await this.calibrationPlansService.findOneBasic(uuid);
    enforceSiteAccess(req, plan.siteId, CALIBRATION_PLAN_DATA_SCOPE);
    const confirmedBy = extractUserId(req);
    return this.calibrationPlansService.confirmItem(uuid, itemUuid, { ...confirmDto, confirmedBy });
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
  @RequirePermissions(Permission.UPDATE_CALIBRATION_PLAN)
  @UsePipes(UpdateCalibrationPlanItemValidationPipe)
  @AuditLog({ action: 'update', entityType: 'calibration_plan', entityIdPath: 'params.uuid' })
  async updateItem(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Param('itemUuid', ParseUUIDPipe) itemUuid: string,
    @Body() updateDto: UpdateCalibrationPlanItemDto,
    @Request() req: AuthenticatedRequest
  ): Promise<CalibrationPlanItem> {
    const plan = await this.calibrationPlansService.findOneBasic(uuid);
    enforceSiteAccess(req, plan.siteId, CALIBRATION_PLAN_DATA_SCOPE);
    return this.calibrationPlansService.updateItem(uuid, itemUuid, updateDto);
  }

  @Get(':uuid/export')
  @ApiOperation({
    summary: 'Excel 내보내기',
    description: '교정계획서를 UL-QP-19-01 양식 템플릿 기반 Excel(.xlsx)로 내보냅니다.',
  })
  @ApiParam({ name: 'uuid', description: '교정계획서 UUID' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({ status: HttpStatus.OK, description: 'Excel 파일 다운로드' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정계획서를 찾을 수 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATION_PLANS)
  @AuditLog({ action: 'export', entityType: 'calibration_plan', entityIdPath: 'params.uuid' })
  async exportExcel(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Res() res: Response,
    @Request() req: AuthenticatedRequest
  ): Promise<void> {
    const plan = await this.calibrationPlansService.findOneBasic(uuid);
    enforceSiteAccess(req, plan.siteId, CALIBRATION_PLAN_DATA_SCOPE);

    const { buffer, mimeType, filename } = await this.exportService.exportExcel(uuid);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': buildContentDisposition(filename),
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });

    res.end(buffer);
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
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '승인된 계획서만 새 버전 생성 가능' })
  @RequirePermissions(Permission.CREATE_CALIBRATION_PLAN)
  @AuditLog({ action: 'create', entityType: 'calibration_plan', entityIdPath: 'response.id' })
  async createNewVersion(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<CalibrationPlanDetail> {
    const plan = await this.calibrationPlansService.findOneBasic(uuid);
    enforceSiteAccess(req, plan.siteId, CALIBRATION_PLAN_DATA_SCOPE);
    const createdBy = extractUserId(req);
    return this.calibrationPlansService.createNewVersion(uuid, createdBy);
  }

  @Get(':uuid/versions')
  @ApiOperation({
    summary: '버전 히스토리 조회',
    description: '교정계획서의 모든 버전 히스토리를 조회합니다.',
  })
  @ApiParam({ name: 'uuid', description: '교정계획서 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '버전 히스토리 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정계획서를 찾을 수 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATION_PLANS)
  async getVersionHistory(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<CalibrationPlanVersionHistoryItem[]> {
    const plan = await this.calibrationPlansService.findOneBasic(uuid);
    enforceSiteAccess(req, plan.siteId, CALIBRATION_PLAN_DATA_SCOPE);
    return this.calibrationPlansService.getVersionHistory(uuid);
  }
}
