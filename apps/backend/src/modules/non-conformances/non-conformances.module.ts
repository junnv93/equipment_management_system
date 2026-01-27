import { Module, forwardRef } from '@nestjs/common';
import { NonConformancesController } from './non-conformances.controller';
import { NonConformancesService } from './non-conformances.service';
import { EquipmentModule } from '../equipment/equipment.module';

@Module({
  imports: [forwardRef(() => EquipmentModule)],
  controllers: [NonConformancesController],
  providers: [NonConformancesService],
  exports: [NonConformancesService],
})
export class NonConformancesModule {}
