import { Module, forwardRef } from '@nestjs/common';
import { InternalApiKeyGuard } from '../../common/guards/internal-api-key.guard';
import { EquipmentController } from './equipment.controller';
import { DisposalController } from './disposal.controller';
import { DisposalRequestsController } from './disposal-requests.controller';
import { EquipmentService } from './equipment.service';
import { EquipmentApprovalService } from './services/equipment-approval.service';
import { EquipmentAttachmentService } from './services/equipment-attachment.service';
// FileUploadService는 FileUploadModule(@Global)에서 전역 제공
import { RepairHistoryService } from './services/repair-history.service';
import { HistoryCardService } from './services/history-card.service';
import { HistoryCardDataService } from './services/history-card-data.service';
import { HistoryCardRendererService } from './services/history-card-renderer.service';
import { EquipmentHistoryService } from './services/equipment-history.service';
import { EquipmentTimelineService } from './services/equipment-timeline.service';
import { DisposalService } from './services/disposal.service';
import { QRAccessService } from './services/qr-access.service';
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
  controllers: [
    EquipmentController,
    DisposalController,
    DisposalRequestsController,
    RepairHistoryController,
    EquipmentHistoryController,
  ],
  providers: [
    EquipmentService,
    EquipmentApprovalService,
    EquipmentAttachmentService,
    RepairHistoryService,
    EquipmentHistoryService,
    EquipmentTimelineService,
    DisposalService,
    HistoryCardService,
    HistoryCardDataService,
    HistoryCardRendererService,
    QRAccessService,
    InternalApiKeyGuard,
  ],
  exports: [
    EquipmentService,
    EquipmentApprovalService,
    EquipmentAttachmentService,
    RepairHistoryService,
    EquipmentHistoryService,
    EquipmentTimelineService,
    DisposalService,
  ],
})
export class EquipmentModule {}
