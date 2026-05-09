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
import { AuditModule } from '../audit/audit.module';

/**
 * forwardRef — 진정한 양방향 도메인 결합.
 *
 * checkouts → equipment-imports: getInboundOverview()가 EquipmentImportsService.findAll()을 집계.
 * equipment-imports → checkouts: 반입 승인 시 CheckoutsService.create()로 return_to_vendor checkout 생성.
 *
 * 이 의존성은 UL-QP-18 도메인 워크플로 상 필연적이며, forwardRef는 NestJS 공식 권고 패턴.
 * Symbol+Interface 패턴(ITokenBlacklist 등)은 common↔module 레이어 위반 방지용으로,
 * module↔module 순환 의존 제거에는 이벤트 버스 또는 BFF 모듈 추출이 필요하다.
 *
 * 해결 트리거: 반입 도메인 전면 분리 또는 /checkouts/inbound/overview → /dashboard API 이전 시.
 */
@Module({
  imports: [
    EquipmentModule,
    TeamsModule,
    CacheModule,
    AuditModule,
    forwardRef(() => EquipmentImportsModule),
  ],
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
