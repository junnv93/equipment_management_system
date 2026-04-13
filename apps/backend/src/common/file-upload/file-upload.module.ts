import { Global, Module } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { FileUploadService } from './file-upload.service';
import { DocumentService } from './document.service';
import { FilesController } from './files.controller';

/**
 * 전역 Multer 옵션 — 모든 파일 업로드 엔드포인트에서 공통 사용
 *
 * defParamCharset: 'utf8'
 *   Multer 내부 busboy가 Content-Disposition filename 파라미터를 UTF-8로 디코딩.
 *   브라우저는 한국어 파일명을 UTF-8 바이트로 전송하지만 busboy 기본값(latin1)으로
 *   디코딩하면 mojibake가 발생. 이 설정으로 근본적으로 해결.
 */
export const MULTER_UTF8_OPTIONS: MulterOptions = {
  defParamCharset: 'utf8',
} as MulterOptions;

/**
 * 파일 업로드 Global 모듈
 *
 * StorageModule(@Global)이 IStorageProvider를 제공하고,
 * 이 모듈이 FileUploadService + DocumentService를 전역으로 제공합니다.
 * 개별 모듈에서 import 없이 주입할 수 있습니다.
 */
@Global()
@Module({
  controllers: [FilesController],
  providers: [FileUploadService, DocumentService],
  exports: [FileUploadService, DocumentService],
})
export class FileUploadModule {}
