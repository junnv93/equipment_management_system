import { Module } from '@nestjs/common';
import {
  EquipmentIntermediateInspectionsController,
  CalibrationIntermediateInspectionsController,
  IntermediateInspectionsController,
} from './intermediate-inspections.controller';
import { IntermediateInspectionsService } from './intermediate-inspections.service';
import { ResultSectionsService } from './result-sections.service';
import { IntermediateInspectionExportDataService } from './services/intermediate-inspection-export-data.service';
import { IntermediateInspectionRendererService } from './services/intermediate-inspection-renderer.service';
import { InspectionFormTemplatesModule } from '../inspection-form-templates/inspection-form-templates.module';

@Module({
  // Build-Once Workflow auto-create hook 의존 (Phase 1B-B-2): approve 시 template 자동 생성
  imports: [InspectionFormTemplatesModule],
  controllers: [
    EquipmentIntermediateInspectionsController,
    CalibrationIntermediateInspectionsController,
    IntermediateInspectionsController,
  ],
  providers: [
    IntermediateInspectionsService,
    ResultSectionsService,
    IntermediateInspectionExportDataService,
    IntermediateInspectionRendererService,
  ],
  exports: [
    IntermediateInspectionsService,
    ResultSectionsService,
    IntermediateInspectionExportDataService,
    IntermediateInspectionRendererService,
  ],
})
export class IntermediateInspectionsModule {}
