import { Module, forwardRef } from '@nestjs/common';
import {
  EquipmentImportsController,
  RentalImportsController,
} from './equipment-imports.controller';
import { EquipmentImportsService } from './equipment-imports.service';
import { EquipmentModule } from '../equipment/equipment.module';
import { CheckoutsModule } from '../checkouts/checkouts.module';

@Module({
  imports: [
    EquipmentModule,
    forwardRef(() => CheckoutsModule), // 순환 의존성 방지
  ],
  controllers: [
    EquipmentImportsController, // Primary unified controller
    RentalImportsController, // Legacy controller (backward compatibility)
  ],
  providers: [EquipmentImportsService],
  exports: [EquipmentImportsService],
})
export class EquipmentImportsModule {}

// ============================================================================
// DEPRECATED: Legacy module alias (backward compatibility)
// ============================================================================

/**
 * @deprecated Use EquipmentImportsModule instead
 */
export const RentalImportsModule = EquipmentImportsModule;
