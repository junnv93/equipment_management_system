import { Module } from '@nestjs/common';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';
import { EquipmentApprovalService } from './services/equipment-approval.service';
import { EquipmentAttachmentService } from './services/equipment-attachment.service';
import { FileUploadService } from './services/file-upload.service';
import { RepairHistoryService } from './services/repair-history.service';
import { RepairHistoryController } from './repair-history.controller';
import { CacheModule } from '../../common/cache/cache.module';

@Module({
  imports: [
    // Drizzle DB는 app.module에서 전역으로 제공됨
    CacheModule,
  ],
  controllers: [EquipmentController, RepairHistoryController],
  providers: [
    EquipmentService,
    EquipmentApprovalService,
    EquipmentAttachmentService,
    FileUploadService,
    RepairHistoryService,
  ],
  exports: [
    EquipmentService,
    EquipmentApprovalService,
    EquipmentAttachmentService,
    FileUploadService,
    RepairHistoryService,
  ],
})
export class EquipmentModule {}
