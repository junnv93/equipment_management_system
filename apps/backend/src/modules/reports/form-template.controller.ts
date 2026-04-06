import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  Request,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import type { Response } from 'express';
import { FormTemplateService } from './form-template.service';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SkipResponseTransform } from '../../common/interceptors/response-transform.interceptor';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { Permission, FORM_CATALOG } from '@equipment-management/shared-constants';
import type { AuthenticatedRequest } from '../../types/auth';
import type { FormTemplate } from '@equipment-management/db/schema/form-templates';
import { extractUserId } from '../../common/utils/extract-user';

interface FormTemplateListItem {
  formNumber: string;
  name: string;
  retentionLabel: string;
  implemented: boolean;
  activeTemplate: {
    id: string;
    version: number;
    originalFilename: string;
    uploadedAt: Date;
    uploadedBy: string | null;
  } | null;
}

@ApiTags('양식 템플릿')
@Controller('form-templates')
@ApiBearerAuth()
export class FormTemplateController {
  constructor(private readonly formTemplateService: FormTemplateService) {}

  // ── GET / — 양식 목록 + 활성 버전 정보 ─────────────────────────────────────

  @Get()
  @ApiOperation({ summary: '양식 템플릿 목록 조회' })
  @ApiResponse({ status: 200, description: '양식 목록 반환' })
  @RequirePermissions(Permission.VIEW_FORM_TEMPLATES)
  async list(): Promise<FormTemplateListItem[]> {
    const items: FormTemplateListItem[] = [];

    // 전체 활성 템플릿을 1회 쿼리로 로드 (N+1 방지)
    const allActiveTemplates = await this.formTemplateService.listAllActive();
    const activeByFormNumber = new Map(allActiveTemplates.map((t) => [t.formNumber, t]));

    for (const [formNumber, entry] of Object.entries(FORM_CATALOG)) {
      const active = activeByFormNumber.get(formNumber);

      items.push({
        formNumber,
        name: entry.name,
        retentionLabel: entry.retentionLabel,
        implemented: entry.implemented,
        activeTemplate: active
          ? {
              id: active.id,
              version: active.version,
              originalFilename: active.originalFilename,
              uploadedAt: active.uploadedAt,
              uploadedBy: active.uploadedBy,
            }
          : null,
      });
    }

    return items;
  }

  // ── GET /:formNumber/download — 활성 템플릿 다운로드 ────────────────────────

  @Get(':formNumber/download')
  @ApiOperation({ summary: '활성 양식 템플릿 다운로드' })
  @ApiResponse({ status: 200, description: '파일 스트림' })
  @RequirePermissions(Permission.VIEW_FORM_TEMPLATES)
  @SkipResponseTransform()
  async download(@Param('formNumber') formNumber: string, @Res() res: Response): Promise<void> {
    const buffer = await this.formTemplateService.getTemplateBuffer(formNumber);
    const templates = await this.formTemplateService.listTemplates(formNumber);
    const active = templates.find((t) => t.isActive);

    const filename = active?.originalFilename ?? `${formNumber}.docx`;
    const mimeType =
      active?.mimeType ?? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    res.end(buffer);
  }

  // ── POST /:formNumber/upload — 새 템플릿 버전 업로드 ────────────────────────

  @Post(':formNumber/upload')
  @ApiOperation({ summary: '양식 템플릿 업로드' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: '업로드된 템플릿 정보' })
  @RequirePermissions(Permission.MANAGE_FORM_TEMPLATES)
  @AuditLog({ action: 'create', entityType: 'form_template' })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('formNumber') formNumber: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthenticatedRequest
  ): Promise<FormTemplate> {
    if (!file) {
      throw new BadRequestException({
        code: 'FILE_REQUIRED',
        message: 'File is required for template upload.',
      });
    }

    const userId = extractUserId(req);
    return this.formTemplateService.uploadTemplate(
      formNumber,
      file.buffer,
      file.originalname,
      file.mimetype,
      userId
    );
  }

  // ── GET /:formNumber/history — 버전 이력 조회 ──────────────────────────────

  @Get(':formNumber/history')
  @ApiOperation({ summary: '양식 템플릿 버전 이력 조회' })
  @ApiResponse({ status: 200, description: '버전 이력 반환' })
  @RequirePermissions(Permission.VIEW_FORM_TEMPLATES)
  async history(@Param('formNumber') formNumber: string): Promise<FormTemplate[]> {
    return this.formTemplateService.listTemplates(formNumber);
  }
}
