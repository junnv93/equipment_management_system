import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Res,
  Body,
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
  ApiBody,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { DocumentService } from '../../common/file-upload/document.service';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SkipResponseTransform } from '../../common/interceptors/response-transform.interceptor';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { Permission } from '@equipment-management/shared-constants';
import { DOCUMENT_TYPE_VALUES, type DocumentType } from '@equipment-management/schemas';
import type { MulterFile } from '../../types/common.types';
import type { AuthenticatedRequest } from '../../types/auth';
import { extractUserId } from '../../common/utils/extract-user';
import type { DocumentRecord } from '@equipment-management/db/schema/documents';
import type { DocumentWithIntegrity } from '../../common/file-upload/document.service';

@ApiTags('문서 관리')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentService: DocumentService) {}

  // ============================================================================
  // 업로드
  // ============================================================================

  @Post()
  @ApiOperation({
    summary: '문서 업로드',
    description:
      '장비/교정/요청에 문서를 업로드합니다. equipmentId, calibrationId, requestId 중 하나 이상 필수.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'documentType'],
      properties: {
        file: { type: 'string', format: 'binary' },
        documentType: { type: 'string', enum: [...DOCUMENT_TYPE_VALUES] },
        equipmentId: { type: 'string', format: 'uuid' },
        calibrationId: { type: 'string', format: 'uuid' },
        requestId: { type: 'string', format: 'uuid' },
        softwareValidationId: { type: 'string', format: 'uuid' },
        intermediateInspectionId: { type: 'string', format: 'uuid' },
        selfInspectionId: { type: 'string', format: 'uuid' },
        description: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @RequirePermissions(Permission.CREATE_EQUIPMENT)
  @AuditLog({ action: 'upload', entityType: 'document' })
  async uploadDocument(
    @UploadedFile() file: MulterFile,
    @Body('documentType') documentType: string,
    @Request() req: AuthenticatedRequest,
    @Body('equipmentId') equipmentId?: string,
    @Body('calibrationId') calibrationId?: string,
    @Body('requestId') requestId?: string,
    @Body('softwareValidationId') softwareValidationId?: string,
    @Body('intermediateInspectionId') intermediateInspectionId?: string,
    @Body('selfInspectionId') selfInspectionId?: string,
    @Body('nonConformanceId') nonConformanceId?: string,
    @Body('description') description?: string
  ): Promise<{ document: DocumentRecord; message: string }> {
    if (!file) {
      throw new BadRequestException({
        code: 'DOCUMENT_FILE_REQUIRED',
        message: 'File is required.',
      });
    }

    if (!documentType || !DOCUMENT_TYPE_VALUES.includes(documentType as DocumentType)) {
      throw new BadRequestException({
        code: 'DOCUMENT_TYPE_INVALID',
        message: `Invalid documentType. Allowed: ${DOCUMENT_TYPE_VALUES.join(', ')}`,
      });
    }

    // 도메인 격리 — NC 첨부는 전용 엔드포인트(`POST /non-conformances/:id/attachments`)만 사용.
    // 범용 /documents에서 nonConformanceId 수신 시 permission 경계 우회 가능성(CREATE_EQUIPMENT만으로 NC 첨부).
    // 400 + 명확한 메시지로 전용 경로 유도.
    if (nonConformanceId) {
      throw new BadRequestException({
        code: 'NC_ATTACHMENT_WRONG_ENDPOINT',
        message:
          'Non-conformance attachments must use POST /non-conformances/:id/attachments (dedicated permission boundary).',
      });
    }

    const userId = extractUserId(req);
    const document = await this.documentService.createDocument(file, {
      documentType: documentType as DocumentType,
      equipmentId: equipmentId || undefined,
      calibrationId: calibrationId || undefined,
      requestId: requestId || undefined,
      softwareValidationId: softwareValidationId || undefined,
      intermediateInspectionId: intermediateInspectionId || undefined,
      selfInspectionId: selfInspectionId || undefined,
      nonConformanceId: nonConformanceId || undefined,
      description: description || undefined,
      uploadedBy: userId || undefined,
    });

    return { document, message: '문서가 업로드되었습니다.' };
  }

  // ============================================================================
  // 목록 조회
  // ============================================================================

  @Get()
  @ApiOperation({ summary: '문서 목록 조회 (장비/교정/요청별)' })
  @ApiQuery({ name: 'equipmentId', required: false })
  @ApiQuery({ name: 'calibrationId', required: false })
  @ApiQuery({ name: 'requestId', required: false })
  @ApiQuery({ name: 'softwareValidationId', required: false })
  @ApiQuery({ name: 'intermediateInspectionId', required: false })
  @ApiQuery({ name: 'selfInspectionId', required: false })
  @ApiQuery({ name: 'nonConformanceId', required: false })
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
    @Query('softwareValidationId') softwareValidationId?: string,
    @Query('intermediateInspectionId') intermediateInspectionId?: string,
    @Query('selfInspectionId') selfInspectionId?: string,
    @Query('nonConformanceId') nonConformanceId?: string,
    @Query('type') type?: string,
    @Query('includeCalibrations') includeCalibrations?: string
  ): Promise<DocumentRecord[]> {
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
    if (softwareValidationId && !uuidPattern.test(softwareValidationId)) {
      throw new BadRequestException({
        code: 'INVALID_UUID',
        message: 'Invalid softwareValidationId format.',
      });
    }
    if (intermediateInspectionId && !uuidPattern.test(intermediateInspectionId)) {
      throw new BadRequestException({
        code: 'INVALID_UUID',
        message: 'Invalid intermediateInspectionId format.',
      });
    }
    if (selfInspectionId && !uuidPattern.test(selfInspectionId)) {
      throw new BadRequestException({
        code: 'INVALID_UUID',
        message: 'Invalid selfInspectionId format.',
      });
    }
    if (nonConformanceId && !uuidPattern.test(nonConformanceId)) {
      throw new BadRequestException({
        code: 'INVALID_UUID',
        message: 'Invalid nonConformanceId format.',
      });
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
    if (softwareValidationId) {
      return this.documentService.findBySoftwareValidationId(softwareValidationId, validType);
    }
    if (intermediateInspectionId) {
      return this.documentService.findByIntermediateInspectionId(
        intermediateInspectionId,
        validType
      );
    }
    if (selfInspectionId) {
      return this.documentService.findBySelfInspectionId(selfInspectionId, validType);
    }
    if (nonConformanceId) {
      return this.documentService.findByNonConformanceId(nonConformanceId, validType);
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
    const info = await this.documentService.downloadWithPresign(id);

    if (info.type === 'presigned') {
      // S3 드라이버: Presigned URL을 JSON으로 반환
      // 302 redirect 대신 JSON 응답 — Axios가 redirect 시 Authorization 헤더를 S3에 전달하면 서명 충돌 발생
      res.json({ presignedUrl: info.url, fileName: info.fileName });
      return;
    }

    // Local 드라이버: 서버 프록시 다운로드
    const encodedFileName = encodeURIComponent(info.fileName);
    res.set({
      'Content-Type': info.mimeType,
      'Content-Disposition': `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
      'Content-Length': String(info.buffer.length),
      ...(info.fileHash ? { 'X-File-Hash': info.fileHash } : {}),
    });
    res.send(info.buffer);
  }

  // ============================================================================
  // 썸네일
  // ============================================================================

  /** 썸네일 크기 프리셋 (px width). 고정 프리셋으로 임의 resize 방지. */
  private static readonly THUMBNAIL_SIZES: Record<string, number> = {
    sm: 200,
    md: 400,
    lg: 800,
  };

  @Get(':id/thumbnail')
  @ApiOperation({ summary: '이미지 문서 썸네일 (WebP)' })
  @ApiParam({ name: 'id', description: '문서 ID (UUID)' })
  @ApiQuery({
    name: 'size',
    required: false,
    enum: ['sm', 'md', 'lg'],
    description: '기본 sm(200px)',
  })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  @AuditLog({ action: 'read', entityType: 'document', entityIdPath: 'params.id' })
  @SkipResponseTransform()
  async thumbnail(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('size') size: string = 'sm',
    @Res() res: Response
  ): Promise<void> {
    const width =
      DocumentsController.THUMBNAIL_SIZES[size] ?? DocumentsController.THUMBNAIL_SIZES['sm'];

    const webpBuffer = await this.documentService.getThumbnailBuffer(id, width);

    res.set({
      'Content-Type': 'image/webp',
      'Content-Length': String(webpBuffer.length),
      // UUID 기반 문서 ID는 내용이 바뀌면 새 ID를 발급하므로 영구 캐시 안전
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    res.send(webpBuffer);
  }

  // ============================================================================
  // 무결성 검증
  // ============================================================================

  @Get(':id/verify')
  @ApiOperation({ summary: '문서 무결성 검증 (SHA-256)' })
  @ApiParam({ name: 'id', description: '문서 ID (UUID)' })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  async verify(@Param('id', ParseUUIDPipe) id: string): Promise<DocumentWithIntegrity> {
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
  async deleteDocument(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
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
  ): Promise<DocumentRecord> {
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
  async getRevisionHistory(@Param('id', ParseUUIDPipe) id: string): Promise<DocumentRecord[]> {
    return this.documentService.getRevisionHistory(id);
  }
}
