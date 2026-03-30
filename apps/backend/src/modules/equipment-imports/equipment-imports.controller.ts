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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MULTER_UTF8_OPTIONS } from '../../common/file-upload/file-upload.module';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FormDataParserInterceptor } from '../equipment/interceptors/form-data-parser.interceptor';
import type { MulterFile } from '../../types/common.types';
import { EquipmentImportsService } from './equipment-imports.service';
import type { EquipmentImportListResult } from './types/equipment-import.types';
import type { equipmentImports as equipmentImportsTable } from '@equipment-management/db/schema';

type EquipmentImport = typeof equipmentImportsTable.$inferSelect;
import {
  CreateEquipmentImportInput,
  CreateEquipmentImportValidationPipe,
  ApproveEquipmentImportDto,
  ApproveEquipmentImportValidationPipe,
  RejectEquipmentImportDto,
  RejectEquipmentImportValidationPipe,
  ReceiveEquipmentImportDto,
  ReceiveEquipmentImportValidationPipe,
  CancelEquipmentImportDto,
  CancelEquipmentImportValidationPipe,
  InitiateReturnEquipmentImportDto,
  InitiateReturnEquipmentImportValidationPipe,
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
  ): Promise<EquipmentImport> {
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
  async findAll(@Query() query: EquipmentImportQueryDto): Promise<EquipmentImportListResult> {
    return this.equipmentImportsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_EQUIPMENT_IMPORTS)
  @ApiOperation({ summary: '장비 반입 상세 조회' })
  @ApiParam({ name: 'id', description: '장비 반입 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '상세 조회 성공' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest
  ): Promise<EquipmentImport> {
    const { site, teamId } = await this.equipmentImportsService.getImportSiteAndTeam(id);
    enforceSiteAccess(req, site, EQUIPMENT_IMPORT_DATA_SCOPE, teamId);
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
  ): Promise<EquipmentImport> {
    const { site, teamId } = await this.equipmentImportsService.getImportSiteAndTeam(id);
    enforceSiteAccess(req, site, EQUIPMENT_IMPORT_DATA_SCOPE, teamId);
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
  ): Promise<EquipmentImport> {
    const { site, teamId } = await this.equipmentImportsService.getImportSiteAndTeam(id);
    enforceSiteAccess(req, site, EQUIPMENT_IMPORT_DATA_SCOPE, teamId);
    return this.equipmentImportsService.reject(id, req.user.userId, dto);
  }

  @Post(':id/receive')
  @RequirePermissions(Permission.COMPLETE_EQUIPMENT_IMPORT)
  @AuditLog({ action: 'update', entityType: 'equipment_import', entityIdPath: 'params.id' })
  @ApiOperation({
    summary: '장비 수령 확인 + 자동 등록',
    description:
      '수령 확인 후 장비 자동 등록. sourceType에 따라 sharedSource와 owner가 자동 설정됩니다. 교정성적서 파일 첨부를 지원합니다.',
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiParam({ name: 'id', description: '장비 반입 UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '수령 확인 성공, 장비 자동 등록됨',
  })
  @UseInterceptors(FilesInterceptor('files', 5, MULTER_UTF8_OPTIONS), FormDataParserInterceptor)
  async receive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ReceiveEquipmentImportValidationPipe) dto: ReceiveEquipmentImportDto,
    @UploadedFiles() files: MulterFile[] | undefined,
    @Request() req: AuthenticatedRequest
  ): Promise<EquipmentImport> {
    const { site, teamId } = await this.equipmentImportsService.getImportSiteAndTeam(id);
    enforceSiteAccess(req, site, EQUIPMENT_IMPORT_DATA_SCOPE, teamId);
    return this.equipmentImportsService.receive(id, req.user.userId, dto, files);
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
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '동시 수정 충돌 (Version Conflict)' })
  async initiateReturn(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(InitiateReturnEquipmentImportValidationPipe) dto: InitiateReturnEquipmentImportDto,
    @Request() req: AuthenticatedRequest
  ): Promise<EquipmentImport> {
    const { site, teamId } = await this.equipmentImportsService.getImportSiteAndTeam(id);
    enforceSiteAccess(req, site, EQUIPMENT_IMPORT_DATA_SCOPE, teamId);
    return this.equipmentImportsService.initiateReturn(
      id,
      req.user.userId,
      req.user.teamId,
      dto.version
    );
  }

  @Patch(':id/cancel')
  @RequirePermissions(Permission.CANCEL_EQUIPMENT_IMPORT)
  @AuditLog({ action: 'update', entityType: 'equipment_import', entityIdPath: 'params.id' })
  @UsePipes(CancelEquipmentImportValidationPipe)
  @ApiOperation({ summary: '장비 반입 취소' })
  @ApiParam({ name: 'id', description: '장비 반입 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '취소 성공' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '동시 수정 충돌 (Version Conflict)' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelEquipmentImportDto,
    @Request() req: AuthenticatedRequest
  ): Promise<EquipmentImport> {
    const { site, teamId } = await this.equipmentImportsService.getImportSiteAndTeam(id);
    enforceSiteAccess(req, site, EQUIPMENT_IMPORT_DATA_SCOPE, teamId);
    return this.equipmentImportsService.cancel(id, req.user.userId, dto.version);
  }
}
