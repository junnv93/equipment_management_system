import {
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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission, EQUIPMENT_DATA_SCOPE } from '@equipment-management/shared-constants';
import type { AuthenticatedRequest } from '../../types/auth';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { extractUserId } from '../../common/utils/extract-user';
import { enforceSiteAccess } from '../../common/utils/enforce-site-access';
import { SelfInspectionsService, type SelfInspectionWithItems } from './self-inspections.service';
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
  constructor(private readonly selfInspectionsService: SelfInspectionsService) {}

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
}
