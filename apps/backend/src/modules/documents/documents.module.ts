import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentRetentionScheduler } from './schedulers/document-retention.scheduler';
import { SettingsModule } from '../settings/settings.module';
// DocumentService + FileUploadService는 FileUploadModule(@Global)에서 전역 제공

@Module({
  imports: [SettingsModule],
  controllers: [DocumentsController],
  providers: [DocumentRetentionScheduler],
})
export class DocumentsModule {}
