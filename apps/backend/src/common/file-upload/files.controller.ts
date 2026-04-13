import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import * as path from 'path';
import { FileUploadService } from './file-upload.service';
import { SkipPermissions } from '../../modules/auth/decorators/skip-permissions.decorator';

/**
 * 파일 서빙 컨트롤러
 *
 * 스토리지에 저장된 파일을 인증된 사용자에게 제공합니다.
 * JwtAuthGuard는 전역 적용이므로 별도 가드 불필요.
 * SkipPermissions: 파일 읽기는 특정 권한이 아닌 인증만 요구.
 *
 * URL 패턴: GET /files/{*path}
 * 프론트엔드 접근: /api/files/{storageKey}
 * → Next.js rewrite → backend GET /files/{storageKey}
 */
@Controller('files')
export class FilesController {
  private static readonly MIME_MAP: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.csv': 'text/csv',
  };

  constructor(private readonly fileUploadService: FileUploadService) {}

  @Get('{*path}')
  @SkipPermissions()
  async serveFile(@Param('path') filePath: string, @Res() res: Response): Promise<void> {
    // Path traversal 방지: '..' 세그먼트 제거
    const sanitized = filePath
      .replace(/\\/g, '/')
      .split('/')
      .filter((seg) => seg !== '' && seg !== '.' && seg !== '..')
      .join('/');

    if (!sanitized) {
      throw new NotFoundException({ code: 'FILE_NOT_FOUND', message: 'File not found.' });
    }

    const buffer = await this.fileUploadService.readFile(sanitized);

    const ext = path.extname(sanitized).toLowerCase();
    const contentType = FilesController.MIME_MAP[ext] ?? 'application/octet-stream';

    res.set({
      'Content-Type': contentType,
      'Content-Length': buffer.length,
      'Cache-Control': 'private, max-age=3600',
    });
    res.end(buffer);
  }
}
