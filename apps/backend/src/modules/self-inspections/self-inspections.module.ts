import { Module } from '@nestjs/common';
import {
  EquipmentSelfInspectionsController,
  SelfInspectionsController,
} from './self-inspections.controller';
import { SelfInspectionsService } from './self-inspections.service';

@Module({
  controllers: [EquipmentSelfInspectionsController, SelfInspectionsController],
  providers: [SelfInspectionsService],
  exports: [SelfInspectionsService],
})
export class SelfInspectionsModule {}
