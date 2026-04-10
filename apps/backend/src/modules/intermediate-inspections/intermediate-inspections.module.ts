import { Module } from '@nestjs/common';
import {
  EquipmentIntermediateInspectionsController,
  CalibrationIntermediateInspectionsController,
  IntermediateInspectionsController,
} from './intermediate-inspections.controller';
import { IntermediateInspectionsService } from './intermediate-inspections.service';
import { ResultSectionsService } from './result-sections.service';

@Module({
  controllers: [
    EquipmentIntermediateInspectionsController,
    CalibrationIntermediateInspectionsController,
    IntermediateInspectionsController,
  ],
  providers: [IntermediateInspectionsService, ResultSectionsService],
  exports: [IntermediateInspectionsService, ResultSectionsService],
})
export class IntermediateInspectionsModule {}
