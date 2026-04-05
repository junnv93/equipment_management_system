import { Module } from '@nestjs/common';
import {
  CalibrationIntermediateInspectionsController,
  IntermediateInspectionsController,
} from './intermediate-inspections.controller';
import { IntermediateInspectionsService } from './intermediate-inspections.service';

@Module({
  controllers: [CalibrationIntermediateInspectionsController, IntermediateInspectionsController],
  providers: [IntermediateInspectionsService],
  exports: [IntermediateInspectionsService],
})
export class IntermediateInspectionsModule {}
