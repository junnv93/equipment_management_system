import { Module } from '@nestjs/common';
import {
  EquipmentSelfInspectionsController,
  SelfInspectionsController,
} from './self-inspections.controller';
import { SelfInspectionsService } from './self-inspections.service';
import { ResultSectionsService } from '../intermediate-inspections/result-sections.service';
import { SelfInspectionExportDataService } from './services/self-inspection-export-data.service';
import { SelfInspectionRendererService } from './services/self-inspection-renderer.service';

@Module({
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
