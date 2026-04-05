import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UsePipes,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { IntermediateInspectionsService } from './intermediate-inspections.service';
import {
  CreateInspectionPipe,
  UpdateInspectionPipe,
  SubmitInspectionPipe,
  ApproveInspectionPipe,
  RejectInspectionPipe,
} from './dto';
import type {
  CreateInspectionInput,
  UpdateInspectionInput,
  SubmitInspectionInput,
  ApproveInspectionInput,
  RejectInspectionInput,
} from './dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@equipment-management/shared-constants';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import type { AuthenticatedRequest } from '../../types/auth';
import { extractUserId } from '../../common/utils/extract-user';
import type { IntermediateInspection } from '@equipment-management/db/schema';
import { Inject, NotFoundException } from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { eq } from 'drizzle-orm';
import { calibrations } from '@equipment-management/db/schema';

/**
 * 교정별 중간점검 생성/조회 (nested route)
 *
 * POST /calibration/:uuid/intermediate-inspections
 * GET  /calibration/:uuid/intermediate-inspections
 */
@Controller('calibration')
export class CalibrationIntermediateInspectionsController {
  constructor(
    private readonly inspectionsService: IntermediateInspectionsService,
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

  @Post(':uuid/intermediate-inspections')
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  @AuditLog({
    action: 'create',
    entityType: 'intermediate_inspection',
    entityIdPath: 'response.id',
  })
  @UsePipes(CreateInspectionPipe)
  async create(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: CreateInspectionInput,
    @Request() req: AuthenticatedRequest
  ): Promise<IntermediateInspection> {
    const createdBy = extractUserId(req);

    // calibration에서 equipmentId 조회
    const [cal] = await this.db
      .select({ equipmentId: calibrations.equipmentId })
      .from(calibrations)
      .where(eq(calibrations.id, uuid))
      .limit(1);

    if (!cal) {
      throw new NotFoundException({
        code: 'CALIBRATION_NOT_FOUND',
        message: `Calibration with UUID ${uuid} not found.`,
      });
    }

    return this.inspectionsService.create(
      { ...dto, calibrationId: uuid },
      cal.equipmentId,
      createdBy
    );
  }

  @Get(':uuid/intermediate-inspections')
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  findByCalibration(@Param('uuid', ParseUUIDPipe) uuid: string): Promise<IntermediateInspection[]> {
    return this.inspectionsService.findByCalibration(uuid);
  }
}

/**
 * 중간점검 단독 엔드포인트
 *
 * GET    /intermediate-inspections/:uuid
 * PATCH  /intermediate-inspections/:uuid
 * PATCH  /intermediate-inspections/:uuid/submit
 * PATCH  /intermediate-inspections/:uuid/review
 * PATCH  /intermediate-inspections/:uuid/approve
 * PATCH  /intermediate-inspections/:uuid/reject
 */
@Controller('intermediate-inspections')
export class IntermediateInspectionsController {
  constructor(private readonly inspectionsService: IntermediateInspectionsService) {}

  @Get(':uuid')
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string
  ): ReturnType<IntermediateInspectionsService['findOne']> {
    return this.inspectionsService.findOne(uuid);
  }

  @Patch(':uuid')
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  @AuditLog({
    action: 'update',
    entityType: 'intermediate_inspection',
    entityIdPath: 'params.uuid',
  })
  @UsePipes(UpdateInspectionPipe)
  async update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateInspectionInput,
    @Request() _req: AuthenticatedRequest
  ): Promise<IntermediateInspection> {
    return this.inspectionsService.update(uuid, dto);
  }

  @Patch(':uuid/submit')
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  @AuditLog({
    action: 'update',
    entityType: 'intermediate_inspection',
    entityIdPath: 'params.uuid',
  })
  @UsePipes(SubmitInspectionPipe)
  async submit(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: SubmitInspectionInput,
    @Request() req: AuthenticatedRequest
  ): Promise<IntermediateInspection> {
    const userId = extractUserId(req);
    return this.inspectionsService.submit(uuid, dto.version, userId);
  }

  @Patch(':uuid/review')
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  @AuditLog({
    action: 'update',
    entityType: 'intermediate_inspection',
    entityIdPath: 'params.uuid',
  })
  @UsePipes(ApproveInspectionPipe)
  async review(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: ApproveInspectionInput,
    @Request() req: AuthenticatedRequest
  ): Promise<IntermediateInspection> {
    const userId = extractUserId(req);
    return this.inspectionsService.review(uuid, dto.version, userId);
  }

  @Patch(':uuid/approve')
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  @AuditLog({
    action: 'approve',
    entityType: 'intermediate_inspection',
    entityIdPath: 'params.uuid',
  })
  @UsePipes(ApproveInspectionPipe)
  async approve(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: ApproveInspectionInput,
    @Request() req: AuthenticatedRequest
  ): Promise<IntermediateInspection> {
    const userId = extractUserId(req);
    return this.inspectionsService.approve(uuid, dto.version, userId);
  }

  @Patch(':uuid/reject')
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  @AuditLog({
    action: 'reject',
    entityType: 'intermediate_inspection',
    entityIdPath: 'params.uuid',
  })
  @UsePipes(RejectInspectionPipe)
  async reject(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: RejectInspectionInput,
    @Request() req: AuthenticatedRequest
  ): Promise<IntermediateInspection> {
    const userId = extractUserId(req);
    return this.inspectionsService.reject(uuid, dto.version, userId, dto.rejectionReason);
  }
}
