import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Res,
  Inject,
  Request,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { eq } from 'drizzle-orm';
import { DocumentService } from '../../common/file-upload/document.service';
import { FileUploadService } from '../../common/file-upload/file-upload.service';
import { STORAGE_PROVIDER, IStorageProvider } from '../../common/storage/storage.interface';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SkipResponseTransform } from '../../common/interceptors/response-transform.interceptor';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { Permission } from '@equipment-management/shared-constants';
import { DOCUMENT_TYPE_VALUES, type DocumentType } from '@equipment-management/schemas';
import type { MulterFile } from '../../types/common.types';
import type { AuthenticatedRequest } from '../../types/auth';
import { extractUserId } from '../../common/utils/extract-user';
import type { DocumentRecord } from '@equipment-management/db/schema/documents';

@ApiTags('문서 관리')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly fileUploadService: FileUploadService,
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: IStorageProvider
  ) {}

  // ============================================================================
  // 목록 조회
  // ============================================================================

  @Get()
  @ApiOperation({ summary: '문서 목록 조회 (장비/교정/요청별)' })
  @ApiQuery({ name: 'equipmentId', required: false })
  @ApiQuery({ name: 'calibrationId', required: false })
  @ApiQuery({ name: 'requestId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: DOCUMENT_TYPE_VALUES })
  @ApiQuery({
    name: 'includeCalibrations',
    required: false,
    type: Boolean,
    description: '장비 교정 문서 포함',
  })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  async list(
    @Query('equipmentId') equipmentId?: string,
    @Query('calibrationId') calibrationId?: string,
    @Query('requestId') requestId?: string,
    @Query('type') type?: string,
    @Query('includeCalibrations') includeCalibrations?: string
  ) {
    // UUID 형식 기본 검증
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (equipmentId && !uuidPattern.test(equipmentId)) {
      throw new BadRequestException({
        code: 'INVALID_UUID',
        message: 'Invalid equipmentId format.',
      });
    }
    if (calibrationId && !uuidPattern.test(calibrationId)) {
      throw new BadRequestException({
        code: 'INVALID_UUID',
        message: 'Invalid calibrationId format.',
      });
    }
    if (requestId && !uuidPattern.test(requestId)) {
      throw new BadRequestException({ code: 'INVALID_UUID', message: 'Invalid requestId format.' });
    }

    // documentType 검증 — 무효값 시 400 에러
    if (type && !(DOCUMENT_TYPE_VALUES as readonly string[]).includes(type)) {
      throw new BadRequestException({
        code: 'INVALID_DOCUMENT_TYPE',
        message: `Invalid document type: ${type}`,
      });
    }
    const validType = type as DocumentType | undefined;

    if (calibrationId) {
      return this.documentService.findByCalibrationId(calibrationId, validType);
    }
    if (equipmentId) {
      // includeCalibrations=true: 장비 직접 첨부 + 교정 경유 문서 통합 조회 (단일 API 호출)
      if (includeCalibrations === 'true') {
        return this.documentService.findAllByEquipmentId(equipmentId);
      }
      return this.documentService.findByEquipmentId(equipmentId, validType);
    }
    if (requestId) {
      return this.documentService.findByRequestId(requestId);
    }
    return [];
  }

  // ============================================================================
  // 다운로드
  // ============================================================================

  @Get(':id/download')
  @ApiOperation({ summary: '문서 다운로드' })
  @ApiParam({ name: 'id', description: '문서 ID (UUID)' })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  @AuditLog({ action: 'download', entityType: 'document', entityIdPath: 'params.id' })
  @SkipResponseTransform()
  async download(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response): Promise<void> {
    const document = await this.documentService.findByIdAnyStatus(id);

    // S3 드라이버: Presigned URL로 리다이렉트 (서버 부하 0)
    if (
      this.storageProvider.supportsPresignedUrl() &&
      this.storageProvider.getPresignedDownloadUrl
    ) {
      const url = await this.storageProvider.getPresignedDownloadUrl(
        document.filePath,
        document.originalFileName
      );
      res.redirect(302, url);
      return;
    }

    // Local 드라이버: 서버 프록시 다운로드
    const buffer = await this.fileUploadService.readFile(document.filePath);
    const encodedFileName = encodeURIComponent(document.originalFileName);

    res.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
      'Content-Length': String(buffer.length),
      ...(document.fileHash ? { 'X-File-Hash': document.fileHash } : {}),
    });
    res.send(buffer);
  }

  // ============================================================================
  // 무결성 검증
  // ============================================================================

  @Get(':id/verify')
  @ApiOperation({ summary: '문서 무결성 검증 (SHA-256)' })
  @ApiParam({ name: 'id', description: '문서 ID (UUID)' })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  async verify(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentService.verifyIntegrity(id);
  }

  // ============================================================================
  // 삭제
  // ============================================================================

  @Delete(':id')
  @ApiOperation({ summary: '문서 삭제' })
  @ApiParam({ name: 'id', description: '문서 ID (UUID)' })
  @RequirePermissions(Permission.DELETE_EQUIPMENT)
  @AuditLog({ action: 'delete', entityType: 'document', entityIdPath: 'params.id' })
  async deleteDocument(@Param('id', ParseUUIDPipe) id: string) {
    await this.documentService.deleteDocument(id);
    return { message: '문서가 삭제되었습니다.' };
  }

  // ============================================================================
  // 개정 관리
  // ============================================================================

  @Post(':id/revisions')
  @ApiOperation({ summary: '문서 개정판 업로드' })
  @ApiParam({ name: 'id', description: '기존 문서 ID (UUID)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @RequirePermissions(Permission.CREATE_CALIBRATION)
  @AuditLog({ action: 'revision', entityType: 'document', entityIdPath: 'params.id' })
  async createRevision(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: MulterFile,
    @Request() req: AuthenticatedRequest
  ) {
    if (!file) {
      throw new BadRequestException({
        code: 'DOCUMENT_FILE_REQUIRED',
        message: 'No file was uploaded.',
      });
    }

    const userId = extractUserId(req);
    return this.documentService.createRevision(id, file, userId);
  }

  @Get(':id/revisions')
  @ApiOperation({ summary: '문서 개정 이력 조회' })
  @ApiParam({ name: 'id', description: '문서 ID (UUID)' })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  async getRevisionHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentService.getRevisionHistory(id);
  }
}
