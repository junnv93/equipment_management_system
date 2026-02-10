import { Module, forwardRef } from '@nestjs/common';
import { RentalImportsController } from './rental-imports.controller';
import { RentalImportsService } from './rental-imports.service';
import { EquipmentModule } from '../equipment/equipment.module';
import { CheckoutsModule } from '../checkouts/checkouts.module';

@Module({
  imports: [
    EquipmentModule,
    forwardRef(() => CheckoutsModule), // 순환 의존성 방지
  ],
  controllers: [RentalImportsController],
  providers: [RentalImportsService],
  exports: [RentalImportsService],
})
export class RentalImportsModule {}
