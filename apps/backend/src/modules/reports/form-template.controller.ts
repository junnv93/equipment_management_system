import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Res,
  Request,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import type { Response } from 'express';
import { buildContentDisposition } from '../../common/http/content-disposition.util';
import { FormTemplateService } from './form-template.service';
import {
  CreateFormTemplatePipe,
  ReplaceFormTemplatePipe,
  FormTemplateHistoryQueryPipe,
  FormTemplateSearchQueryPipe,
  FormTemplateRevisionsQueryPipe,
  type CreateFormTemplateDto,
  type ReplaceFormTemplateDto,
  type FormTemplateHistoryQueryDto,
  type FormTemplateSearchQueryDto,
  type FormTemplateRevisionsQueryDto,
} from './dto/form-template.dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SkipResponseTransform } from '../../common/interceptors/response-transform.interceptor';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import {
  Permission,
  FORM_CATALOG,
  userHasPermission,
  type FormCategory,
} from '@equipment-management/shared-constants';
import { ErrorCode } from '@equipment-management/schemas';
import type { AuthenticatedRequest } from '../../types/auth';
import type { FormTemplate } from '@equipment-management/db/schema/form-templates';
import { extractUserId } from '../../common/utils/extract-user';

interface CurrentTemplateSummary {
  id: string;
  formNumber: string;
  originalFilename: string;
  uploadedAt: Date;
  uploadedBy: string | null;
}

interface FormTemplateListItem {
  formName: string;
  retentionLabel: string;
  implemented: boolean;
  category: FormCategory;
  /** 최초 등록 시점의 formNumber (FORM_CATALOG 키, 참고용) */
  initialFormNumber: string;
  /** 현행 등록된 템플릿. 없으면 null (업로드 필요) */
  current: CurrentTemplateSummary | null;
}

interface FormTemplateRevisionItem {
  id: string;
  formTemplateId: string;
  previousFormNumber: string | null;
  newFormNumber: string;
  changeSummary: string;
  revisedBy: string | null;
  revisedAt: Date;
  version: number;
}

interface HistoryItem {
  id: string;
  formNumber: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  isCurrent: boolean;
  uploadedAt: Date;
  uploadedBy: string | null;
  supersededAt: Date | null;
  /** 보존연한 만료 소프트 아카이브 시점 (UL-QP-03 §11). null이면 활성. */
  archivedAt: Date | null;
}

interface SearchByNumberResult {
  match: HistoryItem | null;
  /** 검색된 formNumber가 과거 번호일 때, 같은 formName의 현행 row 안내 */
  currentForSameForm: HistoryItem | null;
}

@ApiTags('양식 템플릿')
@Controller('form-templates')
@ApiBearerAuth()
export class FormTemplateController {
  constructor(private readonly formTemplateService: FormTemplateService) {}

  // ── GET / — 양식 목록 + 현행 정보 ──────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: '양식 템플릿 목록 조회 (양식명 기준)' })
  @ApiResponse({ status: 200, description: '양식 목록 반환' })
  @RequirePermissions(Permission.VIEW_FORM_TEMPLATES)
  async list(): Promise<FormTemplateListItem[]> {
    const allCurrent = await this.formTemplateService.listAllCurrent();
    const currentByName = new Map(allCurrent.map((row) => [row.formName, row]));

    const items: FormTemplateListItem[] = [];
    for (const [initialFormNumber, entry] of Object.entries(FORM_CATALOG)) {
      const current = currentByName.get(entry.name);
      items.push({
        formName: entry.name,
        retentionLabel: entry.retentionLabel,
        implemented: entry.implemented,
        category: entry.category,
        initialFormNumber,
        current: current
          ? {
              id: current.id,
              formNumber: current.formNumber,
              originalFilename: current.originalFilename,
              uploadedAt: current.uploadedAt,
              uploadedBy: current.uploadedBy,
            }
          : null,
      });
    }
    return items;
  }

  // ── GET /revisions?formName=... — 개정 메타데이터(changeSummary) 조회 ────

  @Get('revisions')
  @ApiOperation({ summary: '양식명 기준 개정 메타데이터 조회 (UL-QP-03 §7.5)' })
  @RequirePermissions(Permission.VIEW_FORM_TEMPLATES)
  async revisions(
    @Query(FormTemplateRevisionsQueryPipe) query: FormTemplateRevisionsQueryDto
  ): Promise<FormTemplateRevisionItem[]> {
    const rows = await this.formTemplateService.listRevisionsByName(query.formName);
    return rows.map((r) => ({
      id: r.id,
      formTemplateId: r.formTemplateId,
      previousFormNumber: r.previousFormNumber,
      newFormNumber: r.newFormNumber,
      changeSummary: r.changeSummary,
      revisedBy: r.revisedBy,
      revisedAt: r.revisedAt,
      version: r.version,
    }));
  }

  // ── GET /archived — 보존연한 만료 아카이브 양식 (UL-QP-03 §11) ────────────

  @Get('archived')
  @ApiOperation({ summary: '소프트 아카이브된 양식 목록 조회' })
  @RequirePermissions(Permission.VIEW_FORM_TEMPLATES)
  async archived(): Promise<HistoryItem[]> {
    const rows = await this.formTemplateService.listArchived();
    return rows.map(toHistoryItem);
  }

  // ── GET /history?formName=... — 개정 이력 조회 (전원 허용, 조회만) ────────

  @Get('history')
  @ApiOperation({ summary: '양식명 기준 개정 이력 조회' })
  @RequirePermissions(Permission.VIEW_FORM_TEMPLATES)
  async history(
    @Query(FormTemplateHistoryQueryPipe) query: FormTemplateHistoryQueryDto
  ): Promise<HistoryItem[]> {
    const rows = await this.formTemplateService.listHistoryByName(query.formName);
    return rows.map(toHistoryItem);
  }

  // ── GET /search?formNumber=... — 과거 번호로 검색 ──────────────────────────

  @Get('search')
  @ApiOperation({ summary: '과거 formNumber로 양식 검색' })
  @RequirePermissions(Permission.VIEW_FORM_TEMPLATES)
  async search(
    @Query(FormTemplateSearchQueryPipe) query: FormTemplateSearchQueryDto
  ): Promise<SearchByNumberResult> {
    const match = await this.formTemplateService.findByFormNumber(query.formNumber);
    if (!match) {
      return { match: null, currentForSameForm: null };
    }

    if (match.isCurrent) {
      return { match: toHistoryItem(match), currentForSameForm: null };
    }

    const current = await this.formTemplateService.findCurrentByName(match.formName);
    return {
      match: toHistoryItem(match),
      currentForSameForm: current ? toHistoryItem(current) : null,
    };
  }

  // ── GET /:id/download — 단건 다운로드 (현행/과거 공통) ────────────────────

  @Get(':id/download')
  @ApiOperation({ summary: '양식 템플릿 다운로드 (row ID 기준)' })
  @RequirePermissions(Permission.VIEW_FORM_TEMPLATES)
  @SkipResponseTransform()
  async download(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Res() res: Response
  ): Promise<void> {
    const row = await this.formTemplateService.getById(id);

    // 과거 버전 다운로드는 별도 권한 필요. PermissionsGuard와 동일한 SSOT(ROLE_PERMISSIONS)
    // 를 사용하는 `userHasPermission` 헬퍼로 중복 파생 로직을 제거합니다.
    if (!row.isCurrent) {
      if (!userHasPermission(req.user?.roles, Permission.DOWNLOAD_FORM_TEMPLATE_HISTORY)) {
        throw new ForbiddenException({
          code: ErrorCode.FormHistoryDownloadForbidden,
          message: '과거 양식 다운로드는 품질책임자/시험소장/시스템관리자만 가능합니다',
        });
      }
    }

    const buffer = await this.formTemplateService.downloadBuffer(row);

    res.set({
      'Content-Type': row.mimeType,
      'Content-Disposition': buildContentDisposition(row.originalFilename),
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    res.end(buffer);
  }

  // ── POST / — 양식 버전 생성 (최초 + 개정 통합) ────────────────────────────

  @Post()
  @ApiOperation({
    summary: '양식 템플릿 버전 생성 (최초 등록 + 개정 등록 통합)',
    description:
      '기존 현행 row가 없으면 최초 등록, 있으면 자동으로 개정(supersede + insert)으로 처리됩니다.',
  })
  @ApiConsumes('multipart/form-data')
  @RequirePermissions(Permission.MANAGE_FORM_TEMPLATES)
  @AuditLog({ action: 'create', entityType: 'form_template' })
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body(CreateFormTemplatePipe) dto: CreateFormTemplateDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthenticatedRequest
  ): Promise<FormTemplate> {
    if (!file) {
      throw new BadRequestException({
        code: ErrorCode.FileEmpty,
        message: '파일이 필요합니다',
      });
    }
    const userId = extractUserId(req);
    return this.formTemplateService.createFormTemplateVersion({
      formName: dto.formName,
      formNumber: dto.formNumber,
      changeSummary: dto.changeSummary,
      file: file.buffer,
      filename: file.originalname,
      mimeType: file.mimetype,
      userId,
    });
  }

  // ── POST /replace — 동일 formNumber 파일 교체 ─────────────────────────────

  @Post('replace')
  @ApiOperation({ summary: '양식 파일 교체 (동일 formNumber, 이력 보존 없음)' })
  @ApiConsumes('multipart/form-data')
  @RequirePermissions(Permission.MANAGE_FORM_TEMPLATES)
  @AuditLog({ action: 'update', entityType: 'form_template' })
  @UseInterceptors(FileInterceptor('file'))
  async replace(
    @Body(ReplaceFormTemplatePipe) dto: ReplaceFormTemplateDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthenticatedRequest
  ): Promise<FormTemplate> {
    if (!file) {
      throw new BadRequestException({
        code: ErrorCode.FileEmpty,
        message: '파일이 필요합니다',
      });
    }
    const userId = extractUserId(req);
    return this.formTemplateService.replaceCurrentFile({
      formName: dto.formName,
      file: file.buffer,
      filename: file.originalname,
      mimeType: file.mimetype,
      userId,
    });
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function toHistoryItem(row: FormTemplate): HistoryItem {
  return {
    id: row.id,
    formNumber: row.formNumber,
    originalFilename: row.originalFilename,
    mimeType: row.mimeType,
    fileSize: row.fileSize,
    isCurrent: row.isCurrent,
    uploadedAt: row.uploadedAt,
    uploadedBy: row.uploadedBy,
    supersededAt: row.supersededAt,
    archivedAt: row.archivedAt,
  };
}
