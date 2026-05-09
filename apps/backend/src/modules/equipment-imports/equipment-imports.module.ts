import { Module, forwardRef } from '@nestjs/common';
import { EquipmentImportsController } from './equipment-imports.controller';
import { EquipmentImportsService } from './equipment-imports.service';
import { EquipmentImportFormExportDataService } from './services/equipment-import-form-export-data.service';
import { EquipmentImportFormRendererService } from './services/equipment-import-form-renderer.service';
import { EquipmentModule } from '../equipment/equipment.module';
import { CheckoutsModule } from '../checkouts/checkouts.module';

/**
 * forwardRef — 진정한 양방향 도메인 결합. (상세: checkouts.module.ts JSDoc 참조)
 *
 * equipment-imports → checkouts: 반입 승인 시 CheckoutsService.create()로 return_to_vendor checkout 생성.
 * checkouts → equipment-imports: getInboundOverview()가 EquipmentImportsService.findAll()을 집계.
 *
 * 해결 트리거: 반입 도메인 전면 분리 또는 이벤트 버스 도입 시.
 */
@Module({
  imports: [EquipmentModule, forwardRef(() => CheckoutsModule)],
  controllers: [EquipmentImportsController],
  providers: [
    EquipmentImportsService,
    EquipmentImportFormExportDataService,
    EquipmentImportFormRendererService,
  ],
  exports: [
    EquipmentImportsService,
    EquipmentImportFormExportDataService,
    EquipmentImportFormRendererService,
  ],
})
export class EquipmentImportsModule {}
