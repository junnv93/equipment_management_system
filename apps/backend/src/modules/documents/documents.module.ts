import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentRetentionScheduler } from './schedulers/document-retention.scheduler';
import { OrphanPhotoCleanupScheduler } from './schedulers/orphan-photo-cleanup.scheduler';
import { SettingsModule } from '../settings/settings.module';
import { MetricsModule } from '../../common/metrics/metrics.module';
// DocumentService + FileUploadService는 FileUploadModule(@Global)에서 전역 제공

@Module({
  imports: [SettingsModule, MetricsModule],
  controllers: [DocumentsController],
  providers: [DocumentRetentionScheduler, OrphanPhotoCleanupScheduler],
})
export class DocumentsModule {}
