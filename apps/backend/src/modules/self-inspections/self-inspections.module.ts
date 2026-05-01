import { Module } from '@nestjs/common';
import {
  EquipmentSelfInspectionsController,
  SelfInspectionsController,
} from './self-inspections.controller';
import { SelfInspectionsService } from './self-inspections.service';
import { ResultSectionsService } from '../intermediate-inspections/result-sections.service';
import { SelfInspectionExportDataService } from './services/self-inspection-export-data.service';
import { SelfInspectionRendererService } from './services/self-inspection-renderer.service';
import { InspectionFormTemplatesModule } from '../inspection-form-templates/inspection-form-templates.module';

@Module({
  // Build-Once Workflow auto-create hook 의존 (Phase 1B-B-2): approve 시 template 자동 생성
  imports: [InspectionFormTemplatesModule],
  controllers: [EquipmentSelfInspectionsController, SelfInspectionsController],
  providers: [
    SelfInspectionsService,
    ResultSectionsService,
    SelfInspectionExportDataService,
    SelfInspectionRendererService,
  ],
  exports: [SelfInspectionsService, SelfInspectionExportDataService, SelfInspectionRendererService],
})
export class SelfInspectionsModule {}
