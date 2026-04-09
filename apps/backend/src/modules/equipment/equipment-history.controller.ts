import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Res,
  ParseUUIDPipe,
  Request,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission, EQUIPMENT_DATA_SCOPE } from '@equipment-management/shared-constants';
import { AuthenticatedRequest } from '../../types/auth';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { extractUserId } from '../../common/utils/extract-user';
import { enforceSiteAccess } from '../../common/utils/enforce-site-access';
import { EquipmentHistoryService } from './services/equipment-history.service';
import { HistoryCardService } from './services/history-card.service';
import { SkipResponseTransform } from '../../common/interceptors/response-transform.interceptor';
import {
  CreateLocationHistoryDto,
  CreateMaintenanceHistoryDto,
  CreateIncidentHistoryDto,
  LocationHistoryResponseDto,
  MaintenanceHistoryResponseDto,
  IncidentHistoryResponseDto,
  CreateLocationHistoryValidationPipe,
  CreateMaintenanceHistoryValidationPipe,
  CreateIncidentHistoryValidationPipe,
} from './dto/equipment-history.dto';
import type { PaginatedResponse } from '../../common/types/api-response';

@ApiTags('Equipment History')
@Controller('equipment')
@ApiBearerAuth()
export class EquipmentHistoryController {
  constructor(
    private readonly equipmentHistoryService: EquipmentHistoryService,
    private readonly historyCardService: HistoryCardService
  ) {}

  // ===================== 이력카드 내보내기 (UL-QP-18-02) =====================

  @Get(':uuid/history-card')
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  @AuditLog({ action: 'export', entityType: 'equipment' })
  @SkipResponseTransform()
  @ApiOperation({ summary: '시험설비 이력카드 docx 내보내기' })
  @ApiParam({ name: 'uuid', description: '장비 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '이력카드 docx 파일' })
  async downloadHistoryCard(
    @Param('uuid', ParseUUIDPipe) equipmentUuid: string,
    @Request() req: AuthenticatedRequest,
    @Res() res: Response
  ): Promise<void> {
    const info = await this.equipmentHistoryService.getEquipmentSiteInfo(equipmentUuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);

    const { buffer, managementNumber, equipmentName } =
      await this.historyCardService.generateHistoryCard(equipmentUuid);
    const filename = `${managementNumber}_${equipmentName}_시험설비이력카드.docx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  // ===================== 반출 이력 =====================

  @Get(':uuid/checkouts')
  @RequirePermissions(Permission.VIEW_CHECKOUTS)
  @ApiOperation({ summary: '장비별 반출 이력 조회' })
  @ApiParam({ name: 'uuid', description: '장비 UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: '페이지 크기 (기본: 20, 최대: 100)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '장비별 반출 이력 (페이지네이션)' })
  async getCheckoutHistory(
    @Param('uuid', ParseUUIDPipe) equipmentUuid: string,
    @Request() req: AuthenticatedRequest,
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const info = await this.equipmentHistoryService.getEquipmentSiteInfo(equipmentUuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);

    const page = pageStr ? parseInt(pageStr, 10) : undefined;
    const pageSize = pageSizeStr ? parseInt(pageSizeStr, 10) : undefined;

    return this.equipmentHistoryService.getCheckoutHistory(equipmentUuid, { page, pageSize });
  }

  // ===================== 위치 변동 이력 =====================

  @Get(':uuid/location-history')
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  @ApiOperation({ summary: '장비 위치 변동 이력 조회' })
  @ApiParam({ name: 'uuid', description: '장비 UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: '페이지 크기 (기본: 20, 최대: 100)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '위치 변동 이력 (페이지네이션)' })
  async getLocationHistory(
    @Param('uuid', ParseUUIDPipe) equipmentUuid: string,
    @Request() req: AuthenticatedRequest,
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string
  ): Promise<PaginatedResponse<LocationHistoryResponseDto>> {
    const info = await this.equipmentHistoryService.getEquipmentSiteInfo(equipmentUuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);

    const page = pageStr ? parseInt(pageStr, 10) : undefined;
    const pageSize = pageSizeStr ? parseInt(pageSizeStr, 10) : undefined;

    return this.equipmentHistoryService.getLocationHistory(equipmentUuid, { page, pageSize });
  }

  @Post(':uuid/location-history')
  @ApiOperation({ summary: '위치 변동 이력 추가' })
  @ApiParam({ name: 'uuid', description: '장비 UUID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '생성된 위치 변동 이력',
    type: LocationHistoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '필수 필드 누락 또는 유효성 검사 실패',
  })
  @RequirePermissions(Permission.UPDATE_EQUIPMENT)
  @AuditLog({ action: 'create', entityType: 'location_history', entityIdPath: 'params.uuid' })
  async createLocationHistory(
    @Param('uuid', ParseUUIDPipe) equipmentUuid: string,
    @Body(CreateLocationHistoryValidationPipe) dto: CreateLocationHistoryDto,
    @Request() req: AuthenticatedRequest
  ): Promise<LocationHistoryResponseDto> {
    const info = await this.equipmentHistoryService.getEquipmentSiteInfo(equipmentUuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    const userId = extractUserId(req);
    return this.equipmentHistoryService.createLocationHistory(equipmentUuid, dto, userId);
  }

  @Delete('location-history/:historyId')
  @ApiOperation({ summary: '위치 변동 이력 삭제' })
  @ApiParam({ name: 'historyId', description: '이력 UUID' })
  @ApiQuery({
    name: 'version',
    required: false,
    type: Number,
    description: '장비 CAS 버전 (동시 수정 방지)',
  })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '삭제 성공' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '버전 충돌 (VERSION_CONFLICT)' })
  @RequirePermissions(Permission.DELETE_EQUIPMENT)
  @AuditLog({ action: 'delete', entityType: 'location_history', entityIdPath: 'params.historyId' })
  async deleteLocationHistory(
    @Param('historyId', ParseUUIDPipe) historyId: string,
    @Query('version') versionStr: string | undefined,
    @Request() req: AuthenticatedRequest
  ): Promise<void> {
    const info =
      await this.equipmentHistoryService.getEquipmentSiteInfoByLocationHistoryId(historyId);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    const version = versionStr ? parseInt(versionStr, 10) : undefined;
    const safeVersion = version !== undefined && !isNaN(version) ? version : undefined;
    return this.equipmentHistoryService.deleteLocationHistory(historyId, safeVersion);
  }

  // ===================== 유지보수 내역 =====================

  @Get(':uuid/maintenance-history')
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  @ApiOperation({ summary: '장비 유지보수 내역 조회' })
  @ApiParam({ name: 'uuid', description: '장비 UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: '페이지 크기 (기본: 20, 최대: 100)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '유지보수 내역 (페이지네이션)' })
  async getMaintenanceHistory(
    @Param('uuid', ParseUUIDPipe) equipmentUuid: string,
    @Request() req: AuthenticatedRequest,
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string
  ): Promise<PaginatedResponse<MaintenanceHistoryResponseDto>> {
    const info = await this.equipmentHistoryService.getEquipmentSiteInfo(equipmentUuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);

    const page = pageStr ? parseInt(pageStr, 10) : undefined;
    const pageSize = pageSizeStr ? parseInt(pageSizeStr, 10) : undefined;

    return this.equipmentHistoryService.getMaintenanceHistory(equipmentUuid, { page, pageSize });
  }

  @Post(':uuid/maintenance-history')
  @ApiOperation({ summary: '유지보수 내역 추가' })
  @ApiParam({ name: 'uuid', description: '장비 UUID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '생성된 유지보수 내역',
    type: MaintenanceHistoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '필수 필드 누락 또는 유효성 검사 실패',
  })
  @RequirePermissions(Permission.UPDATE_EQUIPMENT)
  @AuditLog({ action: 'create', entityType: 'maintenance_history', entityIdPath: 'params.uuid' })
  async createMaintenanceHistory(
    @Param('uuid', ParseUUIDPipe) equipmentUuid: string,
    @Body(CreateMaintenanceHistoryValidationPipe) dto: CreateMaintenanceHistoryDto,
    @Request() req: AuthenticatedRequest
  ): Promise<MaintenanceHistoryResponseDto> {
    const info = await this.equipmentHistoryService.getEquipmentSiteInfo(equipmentUuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    const userId = extractUserId(req);
    return this.equipmentHistoryService.createMaintenanceHistory(equipmentUuid, dto, userId);
  }

  @Delete('maintenance-history/:historyId')
  @ApiOperation({ summary: '유지보수 내역 삭제' })
  @ApiParam({ name: 'historyId', description: '이력 UUID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '삭제 성공' })
  @RequirePermissions(Permission.DELETE_EQUIPMENT)
  @AuditLog({
    action: 'delete',
    entityType: 'maintenance_history',
    entityIdPath: 'params.historyId',
  })
  async deleteMaintenanceHistory(
    @Param('historyId', ParseUUIDPipe) historyId: string,
    @Request() req: AuthenticatedRequest
  ): Promise<void> {
    const info =
      await this.equipmentHistoryService.getEquipmentSiteInfoByMaintenanceHistoryId(historyId);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    return this.equipmentHistoryService.deleteMaintenanceHistory(historyId);
  }

  // ===================== 손상/오작동/변경/수리 내역 =====================

  @Get(':uuid/incident-history')
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  @ApiOperation({ summary: '장비 손상/오작동/변경/수리 내역 조회' })
  @ApiParam({ name: 'uuid', description: '장비 UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: '페이지 크기 (기본: 20, 최대: 100)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '손상/수리 내역 (페이지네이션)' })
  async getIncidentHistory(
    @Param('uuid', ParseUUIDPipe) equipmentUuid: string,
    @Request() req: AuthenticatedRequest,
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string
  ): Promise<PaginatedResponse<IncidentHistoryResponseDto>> {
    const info = await this.equipmentHistoryService.getEquipmentSiteInfo(equipmentUuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);

    const page = pageStr ? parseInt(pageStr, 10) : undefined;
    const pageSize = pageSizeStr ? parseInt(pageSizeStr, 10) : undefined;

    return this.equipmentHistoryService.getIncidentHistory(equipmentUuid, { page, pageSize });
  }

  @Post(':uuid/incident-history')
  @ApiOperation({ summary: '손상/오작동/변경/수리 내역 추가' })
  @ApiParam({ name: 'uuid', description: '장비 UUID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '생성된 손상/수리 내역',
    type: IncidentHistoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '필수 필드 누락 또는 유효성 검사 실패',
  })
  @RequirePermissions(Permission.UPDATE_EQUIPMENT)
  @AuditLog({ action: 'create', entityType: 'incident_history', entityIdPath: 'params.uuid' })
  async createIncidentHistory(
    @Param('uuid', ParseUUIDPipe) equipmentUuid: string,
    @Body(CreateIncidentHistoryValidationPipe) dto: CreateIncidentHistoryDto,
    @Request() req: AuthenticatedRequest
  ): Promise<IncidentHistoryResponseDto> {
    const info = await this.equipmentHistoryService.getEquipmentSiteInfo(equipmentUuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    const userId = extractUserId(req);
    return this.equipmentHistoryService.createIncidentHistory(equipmentUuid, dto, userId);
  }

  @Delete('incident-history/:historyId')
  @ApiOperation({ summary: '손상/오작동/변경/수리 내역 삭제' })
  @ApiParam({ name: 'historyId', description: '이력 UUID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '삭제 성공' })
  @RequirePermissions(Permission.DELETE_EQUIPMENT)
  @AuditLog({ action: 'delete', entityType: 'incident_history', entityIdPath: 'params.historyId' })
  async deleteIncidentHistory(
    @Param('historyId', ParseUUIDPipe) historyId: string,
    @Request() req: AuthenticatedRequest
  ): Promise<void> {
    const info =
      await this.equipmentHistoryService.getEquipmentSiteInfoByIncidentHistoryId(historyId);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    return this.equipmentHistoryService.deleteIncidentHistory(historyId);
  }
}
