import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  UsePipes,
  Request,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IntermediateInspectionsService } from './intermediate-inspections.service';
import { ResultSectionsService } from './result-sections.service';
import {
  CreateInspectionPipe,
  UpdateInspectionPipe,
  SubmitInspectionPipe,
  ApproveInspectionPipe,
  RejectInspectionPipe,
  CreateResultSectionPipe,
  UpdateResultSectionPipe,
} from './dto';
import type {
  CreateInspectionInput,
  UpdateInspectionInput,
  SubmitInspectionInput,
  ApproveInspectionInput,
  RejectInspectionInput,
  CreateResultSectionInput,
  UpdateResultSectionInput,
} from './dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission, EQUIPMENT_DATA_SCOPE } from '@equipment-management/shared-constants';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import type { AuthenticatedRequest } from '../../types/auth';
import { extractUserId } from '../../common/utils/extract-user';
import { enforceSiteAccess } from '../../common/utils/enforce-site-access';
import type {
  IntermediateInspection,
  DocumentRecord,
  InspectionResultSection,
} from '@equipment-management/db/schema';
import { DocumentService } from '../../common/file-upload/document.service';
import type { MulterFile } from '../../types/common.types';
import type { InspectionDocumentItem } from '@equipment-management/db/schema';

/**
 * 장비별 중간점검 생성/조회 (nested route)
 *
 * POST /equipment/:uuid/intermediate-inspections
 * GET  /equipment/:uuid/intermediate-inspections
 */
@Controller('equipment')
export class EquipmentIntermediateInspectionsController {
  constructor(private readonly inspectionsService: IntermediateInspectionsService) {}

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
    const info = await this.inspectionsService.getEquipmentSiteInfo(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    const createdBy = extractUserId(req);
    return this.inspectionsService.createByEquipment(uuid, dto, createdBy);
  }

  @Get(':uuid/intermediate-inspections')
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  async findByEquipment(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<IntermediateInspection[]> {
    const info = await this.inspectionsService.getEquipmentSiteInfo(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    return this.inspectionsService.findByEquipment(uuid);
  }
}

/**
 * 교정별 중간점검 생성/조회 (nested route)
 *
 * POST /calibration/:uuid/intermediate-inspections
 * GET  /calibration/:uuid/intermediate-inspections
 */
@Controller('calibration')
export class CalibrationIntermediateInspectionsController {
  constructor(private readonly inspectionsService: IntermediateInspectionsService) {}

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
    const info = await this.inspectionsService.getEquipmentSiteInfoByCalibrationId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    const createdBy = extractUserId(req);
    return this.inspectionsService.createByCalibration(uuid, dto, createdBy);
  }

  @Get(':uuid/intermediate-inspections')
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  async findByCalibration(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<IntermediateInspection[]> {
    const info = await this.inspectionsService.getEquipmentSiteInfoByCalibrationId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
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
  constructor(
    private readonly inspectionsService: IntermediateInspectionsService,
    private readonly documentService: DocumentService,
    private readonly resultSectionsService: ResultSectionsService
  ) {}

  @Get(':uuid')
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  async findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest
  ): ReturnType<IntermediateInspectionsService['findOne']> {
    const info = await this.inspectionsService.getEquipmentSiteInfoByInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
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
    @Request() req: AuthenticatedRequest
  ): Promise<IntermediateInspection> {
    const info = await this.inspectionsService.getEquipmentSiteInfoByInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
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
    const info = await this.inspectionsService.getEquipmentSiteInfoByInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
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
    const info = await this.inspectionsService.getEquipmentSiteInfoByInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
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
    const info = await this.inspectionsService.getEquipmentSiteInfoByInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
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
    const info = await this.inspectionsService.getEquipmentSiteInfoByInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    const userId = extractUserId(req);
    return this.inspectionsService.reject(uuid, dto.version, userId, dto.rejectionReason);
  }

  // ============================================================================
  // 항목별 사진/문서 첨부
  // ============================================================================

  @Post(':uuid/items/:itemId/photos')
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  @UseInterceptors(FileInterceptor('file'))
  @AuditLog({ action: 'upload', entityType: 'document' })
  async uploadItemPhoto(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @UploadedFile() file: MulterFile,
    @Request() req: AuthenticatedRequest,
    @Body('documentType') documentType?: string,
    @Body('sortOrder') sortOrderStr?: string,
    @Body('description') description?: string
  ): Promise<{ document: DocumentRecord; link: InspectionDocumentItem }> {
    const info = await this.inspectionsService.getEquipmentSiteInfoByInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    const userId = extractUserId(req);
    const sortOrder = sortOrderStr ? parseInt(sortOrderStr, 10) : 0;
    return this.inspectionsService.uploadItemPhoto(
      uuid,
      itemId,
      file,
      userId,
      this.documentService,
      {
        documentType:
          (documentType as 'inspection_photo' | 'inspection_graph') ?? 'inspection_photo',
        sortOrder,
        description,
      }
    );
  }

  @Get(':uuid/documents')
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  async getDocuments(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest,
    @Query('type') type?: string
  ): Promise<DocumentRecord[]> {
    const info = await this.inspectionsService.getEquipmentSiteInfoByInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    return this.documentService.findByIntermediateInspectionId(
      uuid,
      type as 'inspection_photo' | 'inspection_graph' | 'measurement_data' | undefined
    );
  }

  // ============================================================================
  // 결과 섹션 (동적 콘텐츠)
  // ============================================================================

  @Get(':uuid/result-sections')
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  async getResultSections(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<InspectionResultSection[]> {
    const info = await this.inspectionsService.getEquipmentSiteInfoByInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    return this.resultSectionsService.findByInspection(uuid, 'intermediate');
  }

  @Post(':uuid/result-sections')
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  @AuditLog({ action: 'create', entityType: 'inspection_result_section' })
  @UsePipes(CreateResultSectionPipe)
  async createResultSection(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: CreateResultSectionInput,
    @Request() req: AuthenticatedRequest
  ): Promise<InspectionResultSection> {
    const info = await this.inspectionsService.getEquipmentSiteInfoByInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    const userId = extractUserId(req);
    return this.resultSectionsService.create(uuid, 'intermediate', dto, userId);
  }

  @Patch(':uuid/result-sections/:sectionId')
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  @AuditLog({ action: 'update', entityType: 'inspection_result_section' })
  @UsePipes(UpdateResultSectionPipe)
  async updateResultSection(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Body() dto: UpdateResultSectionInput,
    @Request() req: AuthenticatedRequest
  ): Promise<InspectionResultSection> {
    const info = await this.inspectionsService.getEquipmentSiteInfoByInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    return this.resultSectionsService.update(sectionId, uuid, 'intermediate', dto);
  }

  @Delete(':uuid/result-sections/:sectionId')
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  @AuditLog({ action: 'delete', entityType: 'inspection_result_section' })
  async deleteResultSection(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Request() req: AuthenticatedRequest
  ): Promise<{ success: boolean }> {
    const info = await this.inspectionsService.getEquipmentSiteInfoByInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    await this.resultSectionsService.delete(sectionId, uuid, 'intermediate');
    return { success: true };
  }

  @Post(':uuid/result-sections/upload-csv')
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  @UseInterceptors(FileInterceptor('file'))
  @AuditLog({ action: 'create', entityType: 'inspection_result_section' })
  async uploadCsvResultSection(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @UploadedFile() file: MulterFile,
    @Request() req: AuthenticatedRequest,
    @Body('title') title?: string
  ): Promise<InspectionResultSection> {
    if (!file) {
      throw new BadRequestException({ code: 'FILE_REQUIRED', message: 'CSV file is required.' });
    }
    const info = await this.inspectionsService.getEquipmentSiteInfoByInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    const userId = extractUserId(req);
    const csvContent = file.buffer.toString('utf-8');
    return this.resultSectionsService.createFromCsv(
      uuid,
      'intermediate',
      csvContent,
      title,
      userId
    );
  }
}
