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

@Module({
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
