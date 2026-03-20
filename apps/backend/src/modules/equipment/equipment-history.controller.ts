import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission, EQUIPMENT_DATA_SCOPE } from '@equipment-management/shared-constants';
import { AuthenticatedRequest } from '../../types/auth';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { extractUserId } from '../../common/utils/extract-user';
import { enforceSiteAccess } from '../../common/utils/enforce-site-access';
import { EquipmentHistoryService } from './services/equipment-history.service';
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

@ApiTags('Equipment History')
@Controller('equipment')
@ApiBearerAuth()
export class EquipmentHistoryController {
  constructor(private readonly equipmentHistoryService: EquipmentHistoryService) {}

  // ===================== 위치 변동 이력 =====================

  @Get(':uuid/location-history')
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  @ApiOperation({ summary: '장비 위치 변동 이력 조회' })
  @ApiParam({ name: 'uuid', description: '장비 UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '위치 변동 이력 목록',
    type: [LocationHistoryResponseDto],
  })
  async getLocationHistory(
    @Param('uuid', ParseUUIDPipe) equipmentUuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<LocationHistoryResponseDto[]> {
    const info = await this.equipmentHistoryService.getEquipmentSiteInfo(equipmentUuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    return this.equipmentHistoryService.getLocationHistory(equipmentUuid);
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
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '삭제 성공' })
  @RequirePermissions(Permission.DELETE_EQUIPMENT)
  @AuditLog({ action: 'delete', entityType: 'location_history', entityIdPath: 'params.historyId' })
  async deleteLocationHistory(
    @Param('historyId', ParseUUIDPipe) historyId: string,
    @Request() req: AuthenticatedRequest
  ): Promise<void> {
    const info =
      await this.equipmentHistoryService.getEquipmentSiteInfoByLocationHistoryId(historyId);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    return this.equipmentHistoryService.deleteLocationHistory(historyId);
  }

  // ===================== 유지보수 내역 =====================

  @Get(':uuid/maintenance-history')
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  @ApiOperation({ summary: '장비 유지보수 내역 조회' })
  @ApiParam({ name: 'uuid', description: '장비 UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '유지보수 내역 목록',
    type: [MaintenanceHistoryResponseDto],
  })
  async getMaintenanceHistory(
    @Param('uuid', ParseUUIDPipe) equipmentUuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<MaintenanceHistoryResponseDto[]> {
    const info = await this.equipmentHistoryService.getEquipmentSiteInfo(equipmentUuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    return this.equipmentHistoryService.getMaintenanceHistory(equipmentUuid);
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: '손상/수리 내역 목록',
    type: [IncidentHistoryResponseDto],
  })
  async getIncidentHistory(
    @Param('uuid', ParseUUIDPipe) equipmentUuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<IncidentHistoryResponseDto[]> {
    const info = await this.equipmentHistoryService.getEquipmentSiteInfo(equipmentUuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    return this.equipmentHistoryService.getIncidentHistory(equipmentUuid);
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
