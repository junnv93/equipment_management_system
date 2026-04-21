import { Module, forwardRef } from '@nestjs/common';
import { CheckoutsController } from './checkouts.controller';
import { CheckoutsService } from './checkouts.service';
import { HandoverTokenService } from './services/handover-token.service';
import { CheckoutFormExportDataService } from './services/checkout-form-export-data.service';
import { RentalImportCheckoutFormExportDataService } from './services/rental-import-checkout-form-export-data.service';
import { CheckoutFormRendererService } from './services/checkout-form-renderer.service';
import { EquipmentModule } from '../equipment/equipment.module';
import { TeamsModule } from '../teams/teams.module';
import { CacheModule } from '../../common/cache/cache.module';
import { EquipmentImportsModule } from '../equipment-imports/equipment-imports.module';

@Module({
  imports: [EquipmentModule, TeamsModule, CacheModule, forwardRef(() => EquipmentImportsModule)],
  controllers: [CheckoutsController],
  providers: [
    CheckoutsService,
    HandoverTokenService,
    CheckoutFormExportDataService,
    RentalImportCheckoutFormExportDataService,
    CheckoutFormRendererService,
  ],
  exports: [
    CheckoutsService,
    CheckoutFormExportDataService,
    RentalImportCheckoutFormExportDataService,
    CheckoutFormRendererService,
  ],
})
export class CheckoutsModule {}
