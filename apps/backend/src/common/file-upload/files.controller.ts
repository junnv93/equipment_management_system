import { Controller, Get, Param, Res, Inject, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import * as path from 'path';
import { EXTENSION_TO_MIME } from '@equipment-management/shared-constants';
import { STORAGE_PROVIDER, IStorageProvider } from '../storage/storage.interface';
import { FileUploadService } from './file-upload.service';
import { SkipPermissions } from '../../modules/auth/decorators/skip-permissions.decorator';

/**
 * 파일 서빙 컨트롤러 — 인증된 사용자에게 스토리지 파일 제공
 *
 * 스토리지 드라이버에 따라 두 가지 전략을 자동 선택:
 *
 * [S3 / RustFS] → JSON { presignedUrl } 반환
 *   - 문서 API(documents/:id/download)와 동일 패턴 (SSOT)
 *   - 클라이언트가 arraybuffer 수신 후 JSON 파싱 → presignedUrl 직접 사용
 *   - 앱 서버가 S3 바이트를 프록시하지 않아 메모리·CPU 절약
 *
 * [Local FS] → binary 스트리밍
 *   - 단일 서버 온프레미스 환경 (개발 / 수원 사무소 배포)
 *   - Cache-Control: private, max-age=3600
 *
 * 프론트엔드 접근 패턴:
 *   apiClient.get('/api/files/:subdir/:filename', { responseType: 'arraybuffer' })
 *   → content-type이 application/json → JSON 파싱 → presignedUrl 사용
 *   → 그 외 → Blob URL 생성 (언마운트 시 revoke)
 *   ※ <img src="/api/files/..."> 직접 사용 불가 — Next.js rewrite가 /api 제거함
 *
 * 보안:
 *   - 전역 JwtAuthGuard — 미인증 요청 401
 *   - SkipPermissions — 특정 권한 불필요, 인증만으로 충분
 *   - Path traversal 방지 — subdir/filename 분리 파라미터
 *
 * URL: GET /api/files/:subdir/:filename
 * 스토리지 키: {subdir}/{uuid}.{ext}  (FileUploadService.saveFile() SSOT)
 */
@Controller('files')
export class FilesController {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
    private readonly fileUploadService: FileUploadService
  ) {}

  /**
   * GET /api/files/:subdir/:filename
   *
   * Express 5 named wildcard({*path})는 NestJS @Get()에서 동작하지 않으므로
   * 두 파라미터로 분리. 스토리지 키 포맷({subdir}/{filename})과 1:1 대응.
   */
  @Get(':subdir/:filename')
  @SkipPermissions()
  async serveFile(
    @Param('subdir') subdir: string,
    @Param('filename') filename: string,
    @Res() res: Response
  ): Promise<void> {
    // Path traversal 방지 — 각 파라미터에 슬래시/점 차단
    const safeSubdir = subdir.replace(/[./\\]/g, '');
    const safeFilename = filename.replace(/[/\\]/g, '');

    if (!safeSubdir || !safeFilename) {
      throw new NotFoundException({ code: 'FILE_NOT_FOUND', message: 'File not found.' });
    }

    const storageKey = `${safeSubdir}/${safeFilename}`;

    // [S3 / RustFS] JSON { presignedUrl } 반환 — documents 엔드포인트와 동일 패턴
    if (this.storage.supportsPresignedUrl() && this.storage.getPresignedDownloadUrl) {
      const presignedUrl = await this.storage.getPresignedDownloadUrl(storageKey, safeFilename);
      res.json({ presignedUrl });
      return;
    }

    // [Local FS] 버퍼 스트리밍
    const buffer = await this.fileUploadService.readFile(storageKey);
    const ext = path.extname(safeFilename).toLowerCase();
    const contentType = EXTENSION_TO_MIME.get(ext) ?? 'application/octet-stream';

    res.set({
      'Content-Type': contentType,
      'Content-Length': buffer.length,
      'Cache-Control': 'private, max-age=3600',
    });
    res.end(buffer);
  }
}
