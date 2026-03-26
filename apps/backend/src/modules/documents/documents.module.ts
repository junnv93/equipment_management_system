import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
// DocumentService + FileUploadService는 FileUploadModule(@Global)에서 전역 제공

@Module({
  controllers: [DocumentsController],
})
export class DocumentsModule {}
