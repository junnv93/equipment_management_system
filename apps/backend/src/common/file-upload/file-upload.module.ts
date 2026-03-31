import { Global, Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { DocumentService } from './document.service';

/**
 * 파일 업로드 Global 모듈
 *
 * StorageModule(@Global)이 IStorageProvider를 제공하고,
 * 이 모듈이 FileUploadService + DocumentService를 전역으로 제공합니다.
 * 개별 모듈에서 import 없이 주입할 수 있습니다.
 */
@Global()
@Module({
  providers: [FileUploadService, DocumentService],
  exports: [FileUploadService, DocumentService],
})
export class FileUploadModule {}
