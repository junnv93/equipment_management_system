import { Module } from '@nestjs/common';
import { CheckoutsController } from './checkouts.controller';
import { CheckoutsService } from './checkouts.service';
import { HandoverTokenService } from './services/handover-token.service';
import { CheckoutFormExportDataService } from './services/checkout-form-export-data.service';
import { RentalImportCheckoutFormExportDataService } from './services/rental-import-checkout-form-export-data.service';
import { CheckoutFormRendererService } from './services/checkout-form-renderer.service';
import { EquipmentModule } from '../equipment/equipment.module';
import { TeamsModule } from '../teams/teams.module';
import { CacheModule } from '../../common/cache/cache.module';
import { AuditModule } from '../audit/audit.module';
import { CHECKOUT_CREATOR } from '../../common/contracts/checkout-creator.contract';

@Module({
  imports: [EquipmentModule, TeamsModule, CacheModule, AuditModule],
  controllers: [CheckoutsController],
  providers: [
    CheckoutsService,
    HandoverTokenService,
    CheckoutFormExportDataService,
    RentalImportCheckoutFormExportDataService,
    CheckoutFormRendererService,
    // CHECKOUT_CREATOR 토큰: equipment-imports → checkouts 방향 DI.
    // CheckoutsService.create()를 ICheckoutCreator 인터페이스로 노출 — 순환 의존 0건.
    { provide: CHECKOUT_CREATOR, useExisting: CheckoutsService },
  ],
  exports: [
    CheckoutsService,
    CHECKOUT_CREATOR,
    CheckoutFormExportDataService,
    RentalImportCheckoutFormExportDataService,
    CheckoutFormRendererService,
  ],
})
export class CheckoutsModule {}
