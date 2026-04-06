import { Module } from '@nestjs/common';
import {
  EquipmentIntermediateInspectionsController,
  CalibrationIntermediateInspectionsController,
  IntermediateInspectionsController,
} from './intermediate-inspections.controller';
import { IntermediateInspectionsService } from './intermediate-inspections.service';

@Module({
  controllers: [
    EquipmentIntermediateInspectionsController,
    CalibrationIntermediateInspectionsController,
    IntermediateInspectionsController,
  ],
  providers: [IntermediateInspectionsService],
  exports: [IntermediateInspectionsService],
})
export class IntermediateInspectionsModule {}
