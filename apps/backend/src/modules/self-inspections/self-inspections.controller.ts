import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  Request,
  HttpStatus,
  UsePipes,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import {
  Permission,
  EQUIPMENT_DATA_SCOPE,
  FILE_UPLOAD_LIMITS,
} from '@equipment-management/shared-constants';
import type { AuthenticatedRequest } from '../../types/auth';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { extractUserId } from '../../common/utils/extract-user';
import { enforceSiteAccess } from '../../common/utils/enforce-site-access';
import { SelfInspectionsService, type SelfInspectionWithItems } from './self-inspections.service';
import { ResultSectionsService } from '../intermediate-inspections/result-sections.service';
import { DocumentService } from '../../common/file-upload/document.service';
import type { MulterFile } from '../../types/common.types';
import type {
  DocumentRecord,
  InspectionDocumentItem,
  InspectionResultSection,
} from '@equipment-management/db/schema';
import {
  CreateSelfInspectionPipe,
  type CreateSelfInspectionInput,
} from './dto/create-self-inspection.dto';
import {
  UpdateSelfInspectionPipe,
  type UpdateSelfInspectionInput,
} from './dto/update-self-inspection.dto';
import {
  ConfirmSelfInspectionPipe,
  type ConfirmSelfInspectionInput,
} from './dto/confirm-self-inspection.dto';
import {
  CreateResultSectionPipe,
  UpdateResultSectionPipe,
  ReorderResultSectionsPipe,
} from '../intermediate-inspections/dto';
import type {
  CreateResultSectionInput,
  UpdateResultSectionInput,
  ReorderResultSectionsInput,
} from '../intermediate-inspections/dto';

/**
 * 장비별 자체점검 엔드포인트 (equipment 하위 리소스)
 */
@ApiTags('Self Inspections')
@Controller('equipment')
@ApiBearerAuth()
export class EquipmentSelfInspectionsController {
  constructor(private readonly selfInspectionsService: SelfInspectionsService) {}

  @Post(':uuid/self-inspections')
  @RequirePermissions(Permission.CREATE_SELF_INSPECTION)
  @AuditLog({ action: 'create', entityType: 'self_inspection' })
  @UsePipes(CreateSelfInspectionPipe)
  @ApiOperation({ summary: '자체점검 기록 생성' })
  @ApiParam({ name: 'uuid', description: '장비 UUID' })
  @ApiResponse({ status: HttpStatus.CREATED })
  async create(
    @Param('uuid', ParseUUIDPipe) equipmentUuid: string,
    @Body() dto: CreateSelfInspectionInput,
    @Request() req: AuthenticatedRequest
  ): Promise<SelfInspectionWithItems> {
    const info = await this.selfInspectionsService.getEquipmentSiteInfo(equipmentUuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    const userId = extractUserId(req);
    return this.selfInspectionsService.create(equipmentUuid, dto, userId);
  }

  @Get(':uuid/self-inspections')
  @RequirePermissions(Permission.VIEW_SELF_INSPECTIONS)
  @ApiOperation({ summary: '장비별 자체점검 목록 조회' })
  @ApiParam({ name: 'uuid', description: '장비 UUID' })
  async findByEquipment(
    @Param('uuid', ParseUUIDPipe) equipmentUuid: string,
    @Request() req: AuthenticatedRequest,
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string
  ): Promise<{ data: SelfInspectionWithItems[]; total: number }> {
    const info = await this.selfInspectionsService.getEquipmentSiteInfo(equipmentUuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    const page = Math.max(1, pageStr ? parseInt(pageStr, 10) : 1);
    const pageSize = Math.min(100, Math.max(1, pageSizeStr ? parseInt(pageSizeStr, 10) : 20));
    return this.selfInspectionsService.findByEquipment(equipmentUuid, page, pageSize);
  }
}

/**
 * 자체점검 개별 리소스 엔드포인트
 */
@ApiTags('Self Inspections')
@Controller('self-inspections')
@ApiBearerAuth()
export class SelfInspectionsController {
  constructor(
    private readonly selfInspectionsService: SelfInspectionsService,
    private readonly documentService: DocumentService,
    private readonly resultSectionsService: ResultSectionsService
  ) {}

  @Get(':uuid')
  @RequirePermissions(Permission.VIEW_SELF_INSPECTIONS)
  @ApiOperation({ summary: '자��점검 상세 조회' })
  @ApiParam({ name: 'uuid', description: '���체점검 UUID' })
  async findById(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<SelfInspectionWithItems> {
    const info = await this.selfInspectionsService.getEquipmentSiteInfoBySelfInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    return this.selfInspectionsService.findById(uuid);
  }

  @Patch(':uuid')
  @RequirePermissions(Permission.CREATE_SELF_INSPECTION)
  @AuditLog({ action: 'update', entityType: 'self_inspection' })
  @UsePipes(UpdateSelfInspectionPipe)
  @ApiOperation({ summary: '자체점검 수정 (확인 전만 가능)' })
  @ApiParam({ name: 'uuid', description: '자체점검 UUID' })
  async update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateSelfInspectionInput,
    @Request() req: AuthenticatedRequest
  ): Promise<SelfInspectionWithItems> {
    const info = await this.selfInspectionsService.getEquipmentSiteInfoBySelfInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    const userId = extractUserId(req);
    return this.selfInspectionsService.update(uuid, dto, userId);
  }

  @Patch(':uuid/confirm')
  @RequirePermissions(Permission.CONFIRM_SELF_INSPECTION)
  @AuditLog({ action: 'update', entityType: 'self_inspection' })
  @UsePipes(ConfirmSelfInspectionPipe)
  @ApiOperation({ summary: '자체점검 확인 (기술책임자)' })
  @ApiParam({ name: 'uuid', description: '자체점검 UUID' })
  async confirm(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: ConfirmSelfInspectionInput,
    @Request() req: AuthenticatedRequest
  ): Promise<SelfInspectionWithItems> {
    const info = await this.selfInspectionsService.getEquipmentSiteInfoBySelfInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    const userId = extractUserId(req);
    return this.selfInspectionsService.confirm(uuid, userId, dto.version);
  }

  @Delete(':uuid')
  @RequirePermissions(Permission.CREATE_SELF_INSPECTION)
  @AuditLog({ action: 'delete', entityType: 'self_inspection' })
  @ApiOperation({ summary: '자체점검 삭제 (확인 전만 가능)' })
  @ApiParam({ name: 'uuid', description: '자체점검 UUID' })
  async delete(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<{ success: boolean }> {
    const info = await this.selfInspectionsService.getEquipmentSiteInfoBySelfInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    await this.selfInspectionsService.delete(uuid);
    return { success: true };
  }

  // ============================================================================
  // 항목별 사진/문서 첨부
  // ============================================================================

  @Post(':uuid/items/:itemId/photos')
  @RequirePermissions(Permission.CREATE_SELF_INSPECTION)
  @UseInterceptors(FileInterceptor('file'))
  @AuditLog({ action: 'upload', entityType: 'document' })
  @ApiOperation({ summary: '자체점검 항목별 사진 업로드' })
  async uploadItemPhoto(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @UploadedFile() file: MulterFile,
    @Request() req: AuthenticatedRequest,
    @Body('documentType') documentType?: string,
    @Body('sortOrder') sortOrderStr?: string,
    @Body('description') description?: string
  ): Promise<{ document: DocumentRecord; link: InspectionDocumentItem }> {
    const info = await this.selfInspectionsService.getEquipmentSiteInfoBySelfInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    const userId = extractUserId(req);
    const sortOrder = sortOrderStr ? parseInt(sortOrderStr, 10) : 0;
    return this.selfInspectionsService.uploadItemPhoto(
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
  @RequirePermissions(Permission.VIEW_SELF_INSPECTIONS)
  @ApiOperation({ summary: '자체점검 첨부 문서 목록' })
  async getDocuments(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest,
    @Query('type') type?: string
  ): Promise<DocumentRecord[]> {
    const info = await this.selfInspectionsService.getEquipmentSiteInfoBySelfInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    return this.documentService.findBySelfInspectionId(
      uuid,
      type as 'inspection_photo' | 'inspection_graph' | 'measurement_data' | undefined
    );
  }

  // ============================================================================
  // 결과 섹션 (동적 콘텐츠)
  // ============================================================================

  @Get(':uuid/result-sections')
  @RequirePermissions(Permission.VIEW_SELF_INSPECTIONS)
  @ApiOperation({ summary: '자체점검 결과 섹션 목록' })
  async getResultSections(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<InspectionResultSection[]> {
    const info = await this.selfInspectionsService.getEquipmentSiteInfoBySelfInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    return this.resultSectionsService.findByInspection(uuid, 'self');
  }

  @Post(':uuid/result-sections')
  @RequirePermissions(Permission.CREATE_SELF_INSPECTION)
  @AuditLog({ action: 'create', entityType: 'inspection_result_section' })
  @UsePipes(CreateResultSectionPipe)
  @ApiOperation({ summary: '자체점검 결과 섹션 추가' })
  async createResultSection(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: CreateResultSectionInput,
    @Request() req: AuthenticatedRequest
  ): Promise<InspectionResultSection> {
    const info = await this.selfInspectionsService.getEquipmentSiteInfoBySelfInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    const userId = extractUserId(req);
    return this.resultSectionsService.create(uuid, 'self', dto, userId);
  }

  /**
   * ⚠️ 라우트 순서 주의: `/reorder` 는 반드시 `/:sectionId` **앞에** 선언해야 한다.
   * 역순이면 "reorder" 가 ParseUUIDPipe 에 UUID 로 파싱되어 400 Bad Request.
   */
  @Patch(':uuid/result-sections/reorder')
  @RequirePermissions(Permission.CREATE_SELF_INSPECTION)
  @AuditLog({ action: 'update', entityType: 'inspection_result_section' })
  @UsePipes(ReorderResultSectionsPipe)
  @ApiOperation({ summary: '자체점검 결과 섹션 순서 재할당 (원자 트랜잭션)' })
  async reorderResultSections(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: ReorderResultSectionsInput,
    @Request() req: AuthenticatedRequest
  ): Promise<InspectionResultSection[]> {
    const info = await this.selfInspectionsService.getEquipmentSiteInfoBySelfInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    return this.resultSectionsService.reorder(uuid, 'self', dto);
  }

  @Patch(':uuid/result-sections/:sectionId')
  @RequirePermissions(Permission.CREATE_SELF_INSPECTION)
  @AuditLog({ action: 'update', entityType: 'inspection_result_section' })
  @UsePipes(UpdateResultSectionPipe)
  @ApiOperation({ summary: '자체점검 결과 섹션 수정' })
  async updateResultSection(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Body() dto: UpdateResultSectionInput,
    @Request() req: AuthenticatedRequest
  ): Promise<InspectionResultSection> {
    const info = await this.selfInspectionsService.getEquipmentSiteInfoBySelfInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    return this.resultSectionsService.update(sectionId, uuid, 'self', dto);
  }

  @Delete(':uuid/result-sections/:sectionId')
  @RequirePermissions(Permission.CREATE_SELF_INSPECTION)
  @AuditLog({ action: 'delete', entityType: 'inspection_result_section' })
  @ApiOperation({ summary: '자체점검 결과 섹션 삭제' })
  async deleteResultSection(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Request() req: AuthenticatedRequest
  ): Promise<{ success: boolean }> {
    const info = await this.selfInspectionsService.getEquipmentSiteInfoBySelfInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    await this.resultSectionsService.delete(sectionId, uuid, 'self');
    return { success: true };
  }

  @Post(':uuid/result-sections/upload-csv')
  @RequirePermissions(Permission.CREATE_SELF_INSPECTION)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: FILE_UPLOAD_LIMITS.CSV_MAX_FILE_SIZE } })
  )
  @AuditLog({ action: 'create', entityType: 'inspection_result_section' })
  @ApiOperation({ summary: '자체점검 CSV 업로드 → 데이터 테이블' })
  async uploadCsvResultSection(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @UploadedFile() file: MulterFile,
    @Request() req: AuthenticatedRequest,
    @Body('title') title?: string
  ): Promise<InspectionResultSection> {
    if (!file) {
      throw new BadRequestException({ code: 'FILE_REQUIRED', message: 'CSV file is required.' });
    }
    const info = await this.selfInspectionsService.getEquipmentSiteInfoBySelfInspectionId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    const userId = extractUserId(req);
    const csvContent = file.buffer.toString('utf-8');
    return this.resultSectionsService.createFromCsv(uuid, 'self', csvContent, title, userId);
  }
}
