import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  ParseUUIDPipe,
  HttpStatus,
  UsePipes,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { NonConformancesService } from './non-conformances.service';
import { DocumentService } from '../../common/file-upload/document.service';
import type { DocumentRecord } from '@equipment-management/db/schema/documents';
import { DOCUMENT_TYPE_VALUES, type DocumentType } from '@equipment-management/schemas';
import type { MulterFile } from '../../types/common.types';
import {
  CreateNonConformanceDto,
  CreateNonConformanceValidationPipe,
} from './dto/create-non-conformance.dto';
import {
  UpdateNonConformanceDto,
  UpdateNonConformanceValidationPipe,
} from './dto/update-non-conformance.dto';
import {
  CloseNonConformanceDto,
  CloseNonConformanceValidationPipe,
} from './dto/close-non-conformance.dto';
import { RejectCorrectionDto, RejectCorrectionValidationPipe } from './dto/reject-correction.dto';
import {
  NonConformanceQueryDto,
  NonConformanceQueryValidationPipe,
} from './dto/non-conformance-query.dto';
import { type NonConformance } from '@equipment-management/db/schema/non-conformances';
import { NonConformanceStatusValues as NCStatusVal } from '@equipment-management/schemas';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SiteScoped } from '../../common/decorators/site-scoped.decorator';
import { CurrentEnforcedScope } from '../../common/decorators/current-scope.decorator';
import type { EnforcedScope } from '../../common/scope/scope-enforcer';
import { Permission, NON_CONFORMANCE_DATA_SCOPE } from '@equipment-management/shared-constants';
import type { AuthenticatedRequest } from '../../types/auth';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { enforceSiteAccess } from '../../common/utils/enforce-site-access';
import { extractUserId } from '../../common/utils/extract-user';

@ApiTags('부적합 관리')
@ApiBearerAuth()
@Controller('non-conformances')
export class NonConformancesController {
  constructor(
    private readonly nonConformancesService: NonConformancesService,
    private readonly documentService: DocumentService
  ) {}

  @AuditLog({
    action: 'create',
    entityType: 'non_conformance',
  })
  @Post()
  @ApiOperation({
    summary: '부적합 등록',
    description: '새로운 부적합을 등록합니다. 장비 상태가 자동으로 non_conforming으로 변경됩니다.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '부적합이 성공적으로 등록되었습니다.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '장비를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.CREATE_NON_CONFORMANCE)
  @UsePipes(CreateNonConformanceValidationPipe)
  async create(
    @Body() createDto: CreateNonConformanceDto,
    @Request() req: AuthenticatedRequest
  ): Promise<NonConformance> {
    // ✅ 크로스사이트/크로스팀 보호: 다른 사이트/팀 장비에 NC 등록 차단
    const { site: equipSite, teamId: equipTeamId } =
      await this.nonConformancesService.getEquipmentSiteAndTeam(createDto.equipmentId);
    enforceSiteAccess(req, equipSite, NON_CONFORMANCE_DATA_SCOPE, equipTeamId);
    // Rule 2: discoveredBy는 서버에서 JWT로 추출 (클라이언트 body 신뢰 금지)
    const discoveredBy = extractUserId(req);
    return this.nonConformancesService.create(createDto, discoveredBy);
  }

  @Get()
  @ApiOperation({
    summary: '부적합 목록 조회',
    description: '부적합 목록을 조회합니다. 필터: equipmentId, status',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '부적합 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_NON_CONFORMANCES)
  @SiteScoped({ policy: NON_CONFORMANCE_DATA_SCOPE, failLoud: true })
  @UsePipes(NonConformanceQueryValidationPipe)
  findAll(
    @Query() query: NonConformanceQueryDto,
    @CurrentEnforcedScope() scope: EnforcedScope
  ): Promise<{
    items: NonConformance[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    // failLoud: 인터셉터가 cross-site/cross-team 요청을 이미 403으로 거부.
    query.site = scope.site as NonConformanceQueryDto['site'];
    if (scope.teamId) query.teamId = scope.teamId;
    return this.nonConformancesService.findAll(query);
  }

  @Get('equipment/:equipmentUuid')
  @ApiOperation({
    summary: '장비별 열린 부적합 조회',
    description: '특정 장비의 열린(open) 부적합 목록을 조회합니다.',
  })
  @ApiParam({ name: 'equipmentUuid', description: '장비 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '장비별 부적합 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_NON_CONFORMANCES)
  async findOpenByEquipment(
    @Param('equipmentUuid', ParseUUIDPipe) equipmentUuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<NonConformance[]> {
    const { site: equipSite, teamId: equipTeamId } =
      await this.nonConformancesService.getEquipmentSiteAndTeam(equipmentUuid);
    enforceSiteAccess(req, equipSite, NON_CONFORMANCE_DATA_SCOPE, equipTeamId);
    return this.nonConformancesService.findOpenByEquipment(equipmentUuid);
  }

  @Get(':uuid')
  @ApiOperation({
    summary: '부적합 상세 조회',
    description: '특정 부적합의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'uuid', description: '부적합 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '부적합 상세 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '부적합을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_NON_CONFORMANCES)
  async findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<NonConformance> {
    const basic = await this.nonConformancesService.findOneBasic(uuid);
    enforceSiteAccess(req, basic.equipmentSite, NON_CONFORMANCE_DATA_SCOPE, basic.equipmentTeamId);
    return this.nonConformancesService.findOne(uuid);
  }

  @AuditLog({
    action: 'update',
    entityType: 'non_conformance',
    entityIdPath: 'params.uuid',
  })
  @Patch(':uuid')
  @ApiOperation({
    summary: '부적합 업데이트',
    description: '원인분석/조치 기록을 업데이트합니다.',
  })
  @ApiParam({ name: 'uuid', description: '부적합 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '부적합 업데이트 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '부적합을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터 또는 상태 오류' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.UPDATE_NON_CONFORMANCE)
  @UsePipes(UpdateNonConformanceValidationPipe)
  async update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateDto: UpdateNonConformanceDto,
    @Request() req: AuthenticatedRequest
  ): Promise<NonConformance> {
    const basic = await this.nonConformancesService.findOneBasic(uuid);
    enforceSiteAccess(req, basic.equipmentSite, NON_CONFORMANCE_DATA_SCOPE, basic.equipmentTeamId);

    // Rule 2: correctedBy는 서버에서 JWT로 추출 (클라이언트 body 신뢰 금지)
    if (updateDto.status === NCStatusVal.CORRECTED) {
      updateDto.correctedBy = extractUserId(req);
    }

    return this.nonConformancesService.update(uuid, updateDto);
  }

  @AuditLog({
    action: 'close',
    entityType: 'non_conformance',
    entityIdPath: 'params.uuid',
  })
  @Patch(':uuid/close')
  @ApiOperation({
    summary: '부적합 종료',
    description:
      '기술책임자가 부적합을 종료합니다. 장비 상태가 available로 복원됩니다. (조치 완료 상태에서만 가능)',
  })
  @ApiParam({ name: 'uuid', description: '부적합 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '부적합 종료 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '부적합을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터 또는 상태 오류' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.CLOSE_NON_CONFORMANCE)
  @UsePipes(CloseNonConformanceValidationPipe)
  async close(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest,
    @Body() closeDto: CloseNonConformanceDto
  ): Promise<NonConformance> {
    const basic = await this.nonConformancesService.findOneBasic(uuid);
    enforceSiteAccess(req, basic.equipmentSite, NON_CONFORMANCE_DATA_SCOPE, basic.equipmentTeamId);
    const closedBy = extractUserId(req);
    return this.nonConformancesService.close(uuid, closeDto, closedBy);
  }

  @AuditLog({
    action: 'reject_correction',
    entityType: 'non_conformance',
    entityIdPath: 'params.uuid',
  })
  @Patch(':uuid/reject-correction')
  @ApiOperation({
    summary: '부적합 조치 반려',
    description: '기술책임자가 조치 완료된 부적합을 반려합니다. 상태가 open으로 되돌아갑니다.',
  })
  @ApiParam({ name: 'uuid', description: '부적합 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '부적합 반려 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '부적합을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터 또는 상태 오류' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '버전 충돌 (다른 사용자가 수정)' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.CLOSE_NON_CONFORMANCE)
  @UsePipes(RejectCorrectionValidationPipe)
  async rejectCorrection(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: RejectCorrectionDto
  ): Promise<NonConformance> {
    const basic = await this.nonConformancesService.findOneBasic(uuid);
    enforceSiteAccess(req, basic.equipmentSite, NON_CONFORMANCE_DATA_SCOPE, basic.equipmentTeamId);
    const rejectedBy = extractUserId(req);
    return this.nonConformancesService.rejectCorrection(uuid, dto, rejectedBy);
  }

  @Delete(':uuid')
  @ApiOperation({
    summary: '부적합 삭제 (소프트 삭제)',
    description: '부적합을 소프트 삭제합니다. 이력은 영구 보관됩니다.',
  })
  @ApiParam({ name: 'uuid', description: '부적합 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '부적합 삭제 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '부적합을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.CLOSE_NON_CONFORMANCE)
  @AuditLog({ action: 'delete', entityType: 'non_conformance', entityIdPath: 'params.uuid' })
  async remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Query('version') versionParam: string,
    @Request() req: AuthenticatedRequest
  ): Promise<{ id: string; deleted: boolean }> {
    const basic = await this.nonConformancesService.findOneBasic(uuid);
    enforceSiteAccess(req, basic.equipmentSite, NON_CONFORMANCE_DATA_SCOPE, basic.equipmentTeamId);
    const version = parseInt(versionParam, 10);
    if (isNaN(version) || version < 1) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'version query parameter is required and must be a positive integer',
      });
    }
    return this.nonConformancesService.remove(uuid, version);
  }

  // ============================================================================
  // 첨부 관리 (현장 사진 등) — NC 전용 permission 경계
  // ============================================================================

  /**
   * NC에 연결된 첨부(사진/증빙) 목록 조회.
   * Site scoping: NC 자체 VIEW 권한이면 첨부도 동일 범위 조회 허용.
   */
  @Get(':uuid/attachments')
  @ApiOperation({ summary: 'NC 첨부 목록 조회', description: '특정 부적합의 첨부 문서 목록' })
  @ApiParam({ name: 'uuid', description: '부적합 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '첨부 목록 조회 성공' })
  @RequirePermissions(Permission.VIEW_NON_CONFORMANCES)
  async listAttachments(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest,
    @Query('type') type?: string
  ): Promise<DocumentRecord[]> {
    const basic = await this.nonConformancesService.findOneBasic(uuid);
    enforceSiteAccess(req, basic.equipmentSite, NON_CONFORMANCE_DATA_SCOPE, basic.equipmentTeamId);

    if (type && !(DOCUMENT_TYPE_VALUES as readonly string[]).includes(type)) {
      throw new BadRequestException({
        code: 'INVALID_DOCUMENT_TYPE',
        message: `Invalid document type: ${type}`,
      });
    }
    return this.documentService.findByNonConformanceId(uuid, type as DocumentType | undefined);
  }

  /**
   * NC 첨부 업로드. Multipart `file` + `documentType` 필수.
   * 전용 permission(UPLOAD_NON_CONFORMANCE_ATTACHMENT)으로 범용 document 업로드와 분리된 권한 경계.
   */
  @Post(':uuid/attachments')
  @ApiOperation({ summary: 'NC 첨부 업로드', description: '현장 사진 등 증빙 파일 업로드' })
  @ApiParam({ name: 'uuid', description: '부적합 ID (UUID)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'documentType'],
      properties: {
        file: { type: 'string', format: 'binary' },
        documentType: { type: 'string', enum: [...DOCUMENT_TYPE_VALUES] },
        description: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @RequirePermissions(Permission.UPLOAD_NON_CONFORMANCE_ATTACHMENT)
  @AuditLog({ action: 'upload', entityType: 'document', entityIdPath: 'params.uuid' })
  async uploadAttachment(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @UploadedFile() file: MulterFile,
    @Body('documentType') documentType: string,
    @Request() req: AuthenticatedRequest,
    @Body('description') description?: string
  ): Promise<{ document: DocumentRecord; message: string }> {
    if (!file) {
      throw new BadRequestException({
        code: 'DOCUMENT_FILE_REQUIRED',
        message: 'File is required.',
      });
    }
    if (!documentType || !(DOCUMENT_TYPE_VALUES as readonly string[]).includes(documentType)) {
      throw new BadRequestException({
        code: 'DOCUMENT_TYPE_INVALID',
        message: `Invalid documentType. Allowed: ${DOCUMENT_TYPE_VALUES.join(', ')}`,
      });
    }

    const basic = await this.nonConformancesService.findOneBasic(uuid);
    enforceSiteAccess(req, basic.equipmentSite, NON_CONFORMANCE_DATA_SCOPE, basic.equipmentTeamId);

    const userId = extractUserId(req);
    const document = await this.documentService.createDocument(file, {
      documentType: documentType as DocumentType,
      nonConformanceId: uuid,
      description: description || undefined,
      uploadedBy: userId || undefined,
    });
    return { document, message: '첨부가 업로드되었습니다.' };
  }

  /**
   * NC 첨부 삭제(논리 삭제). 권한 체크는 전용 permission에 위임.
   * 도메인 격리: 삭제할 document가 실제로 이 NC 소유인지 DB에서 재확인.
   */
  @Delete(':uuid/attachments/:documentId')
  @ApiOperation({ summary: 'NC 첨부 삭제', description: '첨부를 소프트 삭제합니다.' })
  @ApiParam({ name: 'uuid', description: '부적합 ID (UUID)' })
  @ApiParam({ name: 'documentId', description: '문서 ID (UUID)' })
  @RequirePermissions(Permission.DELETE_NON_CONFORMANCE_ATTACHMENT)
  @AuditLog({ action: 'delete', entityType: 'document', entityIdPath: 'params.documentId' })
  async deleteAttachment(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Request() req: AuthenticatedRequest
  ): Promise<{ message: string }> {
    const basic = await this.nonConformancesService.findOneBasic(uuid);
    enforceSiteAccess(req, basic.equipmentSite, NON_CONFORMANCE_DATA_SCOPE, basic.equipmentTeamId);

    // 도메인 격리: documentId가 이 NC 소유인지 확인 (다른 NC/엔티티 첨부 삭제 방지)
    const doc = await this.documentService.findByIdAnyStatus(documentId);
    if (doc.nonConformanceId !== uuid) {
      throw new BadRequestException({
        code: 'DOCUMENT_OWNER_MISMATCH',
        message: 'Document does not belong to this non-conformance.',
      });
    }

    await this.documentService.deleteDocument(documentId);
    return { message: '첨부가 삭제되었습니다.' };
  }
}
