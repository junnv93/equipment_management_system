import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  ParseUUIDPipe,
  Body,
  Query,
  HttpStatus,
  Request,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { RepairHistoryService, RepairHistoryRecord } from './services/repair-history.service';
import {
  CreateRepairHistoryDto,
  UpdateRepairHistoryDto,
  RepairHistoryQueryDto,
  CreateRepairHistoryValidationPipe,
  UpdateRepairHistoryValidationPipe,
} from './dto/repair-history.dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission, EQUIPMENT_DATA_SCOPE } from '@equipment-management/shared-constants';
import { AuthenticatedRequest } from '../../types/auth';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { extractUserId } from '../../common/utils/extract-user';
import { enforceSiteAccess } from '../../common/utils/enforce-site-access';

@ApiTags('수리 이력')
@ApiBearerAuth()
@Controller()
export class RepairHistoryController {
  constructor(private readonly repairHistoryService: RepairHistoryService) {}

  @Get('equipment/:uuid/repair-history')
  @ApiOperation({
    summary: '장비별 수리 이력 조회',
    description: '특정 장비의 수리 이력 목록을 조회합니다.',
  })
  @ApiParam({ name: 'uuid', description: '장비 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '수리 이력 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  async findByEquipment(
    @Param('uuid', ParseUUIDPipe) equipmentUuid: string,
    @Query() query: RepairHistoryQueryDto,
    @Request() req: AuthenticatedRequest
  ): Promise<{
    items: RepairHistoryRecord[];
    meta: {
      totalItems: number;
      currentPage: number;
      itemsPerPage: number;
      totalPages: number;
    };
  }> {
    const info = await this.repairHistoryService.getEquipmentSiteInfo(equipmentUuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    return this.repairHistoryService.findByEquipment(equipmentUuid, query);
  }

  @Post('equipment/:uuid/repair-history')
  @ApiOperation({
    summary: '수리 이력 등록',
    description: '특정 장비의 수리 이력을 등록합니다.',
  })
  @ApiParam({ name: 'uuid', description: '장비 UUID' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '수리 이력 등록 성공' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.UPDATE_EQUIPMENT)
  @AuditLog({ action: 'create', entityType: 'repair_history', entityIdPath: 'params.uuid' })
  @UsePipes(CreateRepairHistoryValidationPipe)
  async create(
    @Param('uuid', ParseUUIDPipe) equipmentUuid: string,
    @Body() createDto: CreateRepairHistoryDto,
    @Request() req: AuthenticatedRequest
  ): Promise<RepairHistoryRecord> {
    const info = await this.repairHistoryService.getEquipmentSiteInfo(equipmentUuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    const createdBy = extractUserId(req);
    return this.repairHistoryService.create(equipmentUuid, createDto, createdBy);
  }

  @Get('equipment/:uuid/repair-history/summary')
  @ApiOperation({
    summary: '수리 이력 요약',
    description: '특정 장비의 수리 이력 요약(건수)을 조회합니다.',
  })
  @ApiParam({ name: 'uuid', description: '장비 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '수리 이력 요약 조회 성공' })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  async getSummary(
    @Param('uuid', ParseUUIDPipe) equipmentUuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<{ count: number }> {
    const info = await this.repairHistoryService.getEquipmentSiteInfo(equipmentUuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    return this.repairHistoryService.getSummary(equipmentUuid);
  }

  @Get('equipment/:uuid/repair-history/recent')
  @ApiOperation({
    summary: '최근 수리 이력 조회',
    description: '특정 장비의 최근 수리 이력을 조회합니다.',
  })
  @ApiParam({ name: 'uuid', description: '장비 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '최근 수리 이력 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  async getRecent(
    @Param('uuid', ParseUUIDPipe) equipmentUuid: string,
    @Query('limit') limit: number = 5,
    @Request() req: AuthenticatedRequest
  ): Promise<RepairHistoryRecord[]> {
    const info = await this.repairHistoryService.getEquipmentSiteInfo(equipmentUuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    return this.repairHistoryService.getRecentRepairs(equipmentUuid, limit);
  }

  @Get('repair-history/:uuid')
  @ApiOperation({
    summary: '수리 이력 상세 조회',
    description: '특정 수리 이력의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'uuid', description: '수리 이력 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '수리 이력 상세 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '수리 이력을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  async findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<RepairHistoryRecord> {
    const info = await this.repairHistoryService.getEquipmentSiteInfoByRepairHistoryId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    return this.repairHistoryService.findOne(uuid);
  }

  @Patch('repair-history/:uuid')
  @ApiOperation({
    summary: '수리 이력 수정',
    description: '특정 수리 이력을 수정합니다.',
  })
  @ApiParam({ name: 'uuid', description: '수리 이력 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '수리 이력 수정 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '수리 이력을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.UPDATE_EQUIPMENT)
  @AuditLog({ action: 'update', entityType: 'repair_history', entityIdPath: 'params.uuid' })
  @UsePipes(UpdateRepairHistoryValidationPipe)
  async update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateDto: UpdateRepairHistoryDto,
    @Request() req: AuthenticatedRequest
  ): Promise<RepairHistoryRecord> {
    const info = await this.repairHistoryService.getEquipmentSiteInfoByRepairHistoryId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    return this.repairHistoryService.update(uuid, updateDto);
  }

  @Delete('repair-history/:uuid')
  @ApiOperation({
    summary: '수리 이력 삭제',
    description: '특정 수리 이력을 삭제합니다 (소프트 삭제).',
  })
  @ApiParam({ name: 'uuid', description: '수리 이력 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '수리 이력 삭제 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '수리 이력을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.UPDATE_EQUIPMENT)
  @AuditLog({ action: 'delete', entityType: 'repair_history', entityIdPath: 'params.uuid' })
  async remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<{ deleted: boolean; id: string }> {
    const info = await this.repairHistoryService.getEquipmentSiteInfoByRepairHistoryId(uuid);
    enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId);
    const deletedBy = extractUserId(req);
    return this.repairHistoryService.remove(uuid, deletedBy);
  }
}
