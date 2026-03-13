import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  HttpStatus,
  ParseUUIDPipe,
  Request,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { EquipmentImportsService } from './equipment-imports.service';
import {
  CreateEquipmentImportInput,
  CreateEquipmentImportValidationPipe,
  ApproveEquipmentImportDto,
  ApproveEquipmentImportValidationPipe,
  RejectEquipmentImportDto,
  RejectEquipmentImportValidationPipe,
  ReceiveEquipmentImportDto,
  ReceiveEquipmentImportValidationPipe,
  EquipmentImportQueryDto,
  EquipmentImportQueryValidationPipe,
} from './dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission, EQUIPMENT_IMPORT_DATA_SCOPE } from '@equipment-management/shared-constants';
import { SiteScoped } from '../../common/decorators/site-scoped.decorator';
import { AuthenticatedRequest } from '../../types/auth';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { enforceSiteAccess } from '../../common/utils/enforce-site-access';

@ApiTags('장비 반입 관리 (렌탈 + 내부 공용)')
@ApiBearerAuth()
@Controller('equipment-imports')
export class EquipmentImportsController {
  constructor(private readonly equipmentImportsService: EquipmentImportsService) {}

  @Post()
  @RequirePermissions(Permission.CREATE_EQUIPMENT_IMPORT)
  @AuditLog({ action: 'create', entityType: 'equipment_import', entityIdPath: 'response.id' })
  @UsePipes(CreateEquipmentImportValidationPipe)
  @ApiOperation({
    summary: '장비 반입 신청',
    description:
      '외부 렌탈 또는 내부 공용장비 반입 신청. sourceType에 따라 필수 필드가 달라집니다.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '반입 신청 성공',
  })
  async create(
    @Body() dto: CreateEquipmentImportInput,
    @Request() req: AuthenticatedRequest
  ): Promise<unknown> {
    if (!req.user.site) {
      throw new BadRequestException(
        '사용자 사이트 정보가 설정되지 않았습니다. 관리자에게 문의하세요.'
      );
    }
    return this.equipmentImportsService.create(
      dto,
      req.user.userId,
      req.user.site,
      req.user.teamId || ''
    );
  }

  @Get()
  @RequirePermissions(Permission.VIEW_EQUIPMENT_IMPORTS)
  @SiteScoped({ policy: EQUIPMENT_IMPORT_DATA_SCOPE })
  @UsePipes(EquipmentImportQueryValidationPipe)
  @ApiOperation({
    summary: '장비 반입 목록 조회',
    description: 'sourceType 필터로 렌탈/내부공용 구분 조회 가능',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '목록 조회 성공' })
  async findAll(@Query() query: EquipmentImportQueryDto): Promise<unknown> {
    return this.equipmentImportsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_EQUIPMENT_IMPORTS)
  @ApiOperation({ summary: '장비 반입 상세 조회' })
  @ApiParam({ name: 'id', description: '장비 반입 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '상세 조회 성공' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<unknown> {
    return this.equipmentImportsService.findOne(id);
  }

  @Patch(':id/approve')
  @RequirePermissions(Permission.APPROVE_EQUIPMENT_IMPORT)
  @AuditLog({ action: 'approve', entityType: 'equipment_import', entityIdPath: 'params.id' })
  @UsePipes(ApproveEquipmentImportValidationPipe)
  @ApiOperation({ summary: '장비 반입 승인' })
  @ApiParam({ name: 'id', description: '장비 반입 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '승인 성공' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveEquipmentImportDto,
    @Request() req: AuthenticatedRequest
  ): Promise<unknown> {
    const { site, teamId } = await this.equipmentImportsService.getImportSiteAndTeam(id);
    enforceSiteAccess(
      req,
      site,
      EQUIPMENT_IMPORT_DATA_SCOPE,
      'EQUIPMENT_IMPORT_CROSS_SITE_MUTATION_DENIED',
      teamId
    );
    return this.equipmentImportsService.approve(id, req.user.userId, dto);
  }

  @Patch(':id/reject')
  @RequirePermissions(Permission.APPROVE_EQUIPMENT_IMPORT)
  @AuditLog({ action: 'reject', entityType: 'equipment_import', entityIdPath: 'params.id' })
  @UsePipes(RejectEquipmentImportValidationPipe)
  @ApiOperation({ summary: '장비 반입 거절' })
  @ApiParam({ name: 'id', description: '장비 반입 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '거절 성공' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectEquipmentImportDto,
    @Request() req: AuthenticatedRequest
  ): Promise<unknown> {
    const { site, teamId } = await this.equipmentImportsService.getImportSiteAndTeam(id);
    enforceSiteAccess(
      req,
      site,
      EQUIPMENT_IMPORT_DATA_SCOPE,
      'EQUIPMENT_IMPORT_CROSS_SITE_MUTATION_DENIED',
      teamId
    );
    return this.equipmentImportsService.reject(id, req.user.userId, dto);
  }

  @Post(':id/receive')
  @RequirePermissions(Permission.COMPLETE_EQUIPMENT_IMPORT)
  @AuditLog({ action: 'update', entityType: 'equipment_import', entityIdPath: 'params.id' })
  @ApiOperation({
    summary: '장비 수령 확인 + 자동 등록',
    description:
      '수령 확인 후 장비 자동 등록. sourceType에 따라 sharedSource와 owner가 자동 설정됩니다.',
  })
  @ApiParam({ name: 'id', description: '장비 반입 UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '수령 확인 성공, 장비 자동 등록됨',
  })
  async receive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ReceiveEquipmentImportValidationPipe) dto: ReceiveEquipmentImportDto,
    @Request() req: AuthenticatedRequest
  ): Promise<unknown> {
    const { site, teamId } = await this.equipmentImportsService.getImportSiteAndTeam(id);
    enforceSiteAccess(
      req,
      site,
      EQUIPMENT_IMPORT_DATA_SCOPE,
      'EQUIPMENT_IMPORT_CROSS_SITE_MUTATION_DENIED',
      teamId
    );
    return this.equipmentImportsService.receive(id, req.user.userId, dto);
  }

  @Post(':id/initiate-return')
  @RequirePermissions(Permission.CREATE_CHECKOUT)
  @AuditLog({ action: 'update', entityType: 'equipment_import', entityIdPath: 'params.id' })
  @ApiOperation({
    summary: '장비 반납 시작 (checkout 자동 생성)',
    description:
      'sourceType에 따라 destination이 자동 설정됩니다 (vendorName 또는 ownerDepartment).',
  })
  @ApiParam({ name: 'id', description: '장비 반입 UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '반납 프로세스 시작, checkout 생성됨',
  })
  async initiateReturn(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest
  ): Promise<unknown> {
    const { site, teamId } = await this.equipmentImportsService.getImportSiteAndTeam(id);
    enforceSiteAccess(
      req,
      site,
      EQUIPMENT_IMPORT_DATA_SCOPE,
      'EQUIPMENT_IMPORT_CROSS_SITE_MUTATION_DENIED',
      teamId
    );
    return this.equipmentImportsService.initiateReturn(id, req.user.userId, req.user.teamId);
  }

  @Patch(':id/cancel')
  @RequirePermissions(Permission.CANCEL_EQUIPMENT_IMPORT)
  @AuditLog({ action: 'update', entityType: 'equipment_import', entityIdPath: 'params.id' })
  @ApiOperation({ summary: '장비 반입 취소' })
  @ApiParam({ name: 'id', description: '장비 반입 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '취소 성공' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest
  ): Promise<unknown> {
    const { site, teamId } = await this.equipmentImportsService.getImportSiteAndTeam(id);
    enforceSiteAccess(
      req,
      site,
      EQUIPMENT_IMPORT_DATA_SCOPE,
      'EQUIPMENT_IMPORT_CROSS_SITE_MUTATION_DENIED',
      teamId
    );
    return this.equipmentImportsService.cancel(id, req.user.userId);
  }
}
