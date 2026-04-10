import { Module } from '@nestjs/common';
import {
  EquipmentSelfInspectionsController,
  SelfInspectionsController,
} from './self-inspections.controller';
import { SelfInspectionsService } from './self-inspections.service';
import { ResultSectionsService } from '../intermediate-inspections/result-sections.service';

@Module({
  controllers: [EquipmentSelfInspectionsController, SelfInspectionsController],
  providers: [SelfInspectionsService, ResultSectionsService],
  exports: [SelfInspectionsService],
})
export class SelfInspectionsModule {}
