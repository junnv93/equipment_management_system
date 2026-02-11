import { Module, forwardRef } from '@nestjs/common';
import { EquipmentImportsController } from './equipment-imports.controller';
import { EquipmentImportsService } from './equipment-imports.service';
import { EquipmentModule } from '../equipment/equipment.module';
import { CheckoutsModule } from '../checkouts/checkouts.module';

@Module({
  imports: [
    EquipmentModule,
    forwardRef(() => CheckoutsModule), // 순환 의존성 방지
  ],
  controllers: [EquipmentImportsController],
  providers: [EquipmentImportsService],
  exports: [EquipmentImportsService],
})
export class EquipmentImportsModule {}
