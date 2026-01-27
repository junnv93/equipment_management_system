import { Module, forwardRef } from '@nestjs/common';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';
import { EquipmentApprovalService } from './services/equipment-approval.service';
import { EquipmentAttachmentService } from './services/equipment-attachment.service';
import { FileUploadService } from './services/file-upload.service';
import { RepairHistoryService } from './services/repair-history.service';
import { EquipmentHistoryService } from './services/equipment-history.service';
import { RepairHistoryController } from './repair-history.controller';
import { EquipmentHistoryController } from './equipment-history.controller';
import { CacheModule } from '../../common/cache/cache.module';
import { NonConformancesModule } from '../non-conformances/non-conformances.module';

@Module({
  imports: [
    // Drizzle DB는 app.module에서 전역으로 제공됨
    CacheModule,
    forwardRef(() => NonConformancesModule),
  ],
  controllers: [EquipmentController, RepairHistoryController, EquipmentHistoryController],
  providers: [
    EquipmentService,
    EquipmentApprovalService,
    EquipmentAttachmentService,
    FileUploadService,
    RepairHistoryService,
    EquipmentHistoryService,
  ],
  exports: [
    EquipmentService,
    EquipmentApprovalService,
    EquipmentAttachmentService,
    FileUploadService,
    RepairHistoryService,
    EquipmentHistoryService,
  ],
})
export class EquipmentModule {}
