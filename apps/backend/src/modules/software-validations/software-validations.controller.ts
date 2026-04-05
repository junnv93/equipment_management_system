import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UsePipes,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SoftwareValidationsService } from './software-validations.service';
import {
  CreateValidationPipe,
  UpdateValidationPipe,
  ValidationQueryPipe,
  SubmitValidationPipe,
  ApproveValidationPipe,
  RejectValidationPipe,
} from './dto';
import type {
  CreateValidationInput,
  UpdateValidationInput,
  ValidationQueryInput,
  SubmitValidationInput,
  ApproveValidationInput,
  RejectValidationInput,
} from './dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@equipment-management/shared-constants';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import type { AuthenticatedRequest } from '../../types/auth';
import { extractUserId } from '../../common/utils/extract-user';
import type { SoftwareValidation } from '@equipment-management/db/schema/software-validations';

/**
 * 소프트웨어별 유효성 확인 생성/조회 (nested route)
 *
 * POST /test-software/:softwareId/validations
 * GET  /test-software/:softwareId/validations
 */
@Controller('test-software')
export class TestSoftwareValidationsController {
  constructor(private readonly validationsService: SoftwareValidationsService) {}

  @Post(':softwareId/validations')
  @RequirePermissions(Permission.CREATE_SOFTWARE_VALIDATION)
  @AuditLog({
    action: 'create',
    entityType: 'software_validation',
    entityIdPath: 'response.id',
  })
  @UsePipes(CreateValidationPipe)
  async create(
    @Param('softwareId', ParseUUIDPipe) softwareId: string,
    @Body() dto: CreateValidationInput,
    @Request() req: AuthenticatedRequest
  ): Promise<SoftwareValidation> {
    const createdBy = extractUserId(req);
    return this.validationsService.create(softwareId, dto, createdBy);
  }

  @Get(':softwareId/validations')
  @RequirePermissions(Permission.VIEW_SOFTWARE_VALIDATIONS)
  findByTestSoftware(
    @Param('softwareId', ParseUUIDPipe) softwareId: string,
    @Query(ValidationQueryPipe) query: ValidationQueryInput
  ): ReturnType<SoftwareValidationsService['findByTestSoftware']> {
    return this.validationsService.findByTestSoftware(softwareId, query);
  }
}

/**
 * 유효성 확인 단독 엔드포인트
 *
 * GET    /software-validations/pending
 * GET    /software-validations/:uuid
 * PATCH  /software-validations/:uuid
 * PATCH  /software-validations/:uuid/submit
 * PATCH  /software-validations/:uuid/approve
 * PATCH  /software-validations/:uuid/quality-approve
 * PATCH  /software-validations/:uuid/reject
 */
@Controller('software-validations')
export class SoftwareValidationsController {
  constructor(private readonly validationsService: SoftwareValidationsService) {}

  @Get('pending')
  @RequirePermissions(Permission.APPROVE_SOFTWARE_VALIDATION)
  findPending(): Promise<SoftwareValidation[]> {
    return this.validationsService.findPending();
  }

  @Get(':uuid')
  @RequirePermissions(Permission.VIEW_SOFTWARE_VALIDATIONS)
  findOne(@Param('uuid', ParseUUIDPipe) uuid: string): Promise<SoftwareValidation> {
    return this.validationsService.findOne(uuid);
  }

  @Patch(':uuid')
  @RequirePermissions(Permission.CREATE_SOFTWARE_VALIDATION)
  @AuditLog({
    action: 'update',
    entityType: 'software_validation',
    entityIdPath: 'params.uuid',
  })
  @UsePipes(UpdateValidationPipe)
  async update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateValidationInput
  ): Promise<SoftwareValidation> {
    return this.validationsService.update(uuid, dto);
  }

  @Patch(':uuid/submit')
  @RequirePermissions(Permission.SUBMIT_SOFTWARE_VALIDATION)
  @AuditLog({
    action: 'update',
    entityType: 'software_validation',
    entityIdPath: 'params.uuid',
  })
  @UsePipes(SubmitValidationPipe)
  async submit(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: SubmitValidationInput,
    @Request() req: AuthenticatedRequest
  ): Promise<SoftwareValidation> {
    const submitterId = extractUserId(req);
    return this.validationsService.submit(uuid, dto.version, submitterId);
  }

  @Patch(':uuid/approve')
  @RequirePermissions(Permission.APPROVE_SOFTWARE_VALIDATION)
  @AuditLog({
    action: 'approve',
    entityType: 'software_validation',
    entityIdPath: 'params.uuid',
  })
  @UsePipes(ApproveValidationPipe)
  async approve(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: ApproveValidationInput,
    @Request() req: AuthenticatedRequest
  ): Promise<SoftwareValidation> {
    const approverId = extractUserId(req);
    return this.validationsService.approve(uuid, dto.version, approverId);
  }

  @Patch(':uuid/quality-approve')
  @RequirePermissions(Permission.APPROVE_SOFTWARE_VALIDATION)
  @AuditLog({
    action: 'approve',
    entityType: 'software_validation',
    entityIdPath: 'params.uuid',
  })
  @UsePipes(ApproveValidationPipe)
  async qualityApprove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: ApproveValidationInput,
    @Request() req: AuthenticatedRequest
  ): Promise<SoftwareValidation> {
    const approverId = extractUserId(req);
    return this.validationsService.qualityApprove(uuid, dto.version, approverId);
  }

  @Patch(':uuid/reject')
  @RequirePermissions(Permission.APPROVE_SOFTWARE_VALIDATION)
  @AuditLog({
    action: 'reject',
    entityType: 'software_validation',
    entityIdPath: 'params.uuid',
  })
  @UsePipes(RejectValidationPipe)
  async reject(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: RejectValidationInput,
    @Request() req: AuthenticatedRequest
  ): Promise<SoftwareValidation> {
    const rejectedBy = extractUserId(req);
    return this.validationsService.reject(uuid, dto.version, rejectedBy, dto.rejectionReason);
  }

  @Patch(':uuid/revise')
  @RequirePermissions(Permission.CREATE_SOFTWARE_VALIDATION)
  @AuditLog({
    action: 'update',
    entityType: 'software_validation',
    entityIdPath: 'params.uuid',
  })
  @UsePipes(SubmitValidationPipe)
  async revise(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: SubmitValidationInput
  ): Promise<SoftwareValidation> {
    return this.validationsService.revise(uuid, dto.version);
  }
}
