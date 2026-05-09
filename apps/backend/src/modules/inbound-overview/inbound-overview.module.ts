import { Module } from '@nestjs/common';
import { InboundOverviewController } from './inbound-overview.controller';
import { InboundOverviewService } from './inbound-overview.service';
import { CheckoutsModule } from '../checkouts/checkouts.module';
import { EquipmentImportsModule } from '../equipment-imports/equipment-imports.module';
import { CacheModule } from '../../common/cache/cache.module';

/**
 * BFF 집계 모듈 — 반입 현황 단일 요청 집계.
 *
 * CheckoutsModule ⇌ EquipmentImportsModule 양방향 forwardRef 제거를 위한 핵심:
 *  - CheckoutsModule: CHECKOUT_CREATOR 토큰 provide/export (equipment-imports 방향)
 *  - InboundOverviewModule: 양 모듈을 직접 import (forwardRef 0건)
 *
 * 의존 방향: InboundOverviewModule → CheckoutsModule, EquipmentImportsModule (단방향)
 */
@Module({
  imports: [CheckoutsModule, EquipmentImportsModule, CacheModule],
  controllers: [InboundOverviewController],
  providers: [InboundOverviewService],
})
export class InboundOverviewModule {}
