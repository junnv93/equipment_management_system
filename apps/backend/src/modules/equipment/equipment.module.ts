import { Module } from '@nestjs/common';
import { DrizzleModule } from '../../database/drizzle.module';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';
import { EquipmentRepository } from './equipment.repository';

@Module({
  imports: [DrizzleModule],
  controllers: [EquipmentController],
  providers: [EquipmentService, EquipmentRepository],
  exports: [EquipmentService],
})
export class EquipmentModule {}
