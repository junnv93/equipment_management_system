import { Module, forwardRef } from '@nestjs/common';
import { EquipmentImportsController } from './equipment-imports.controller';
import { EquipmentImportsService } from './equipment-imports.service';
import { EquipmentImportFormExportDataService } from './services/equipment-import-form-export-data.service';
import { EquipmentImportFormRendererService } from './services/equipment-import-form-renderer.service';
import { EquipmentModule } from '../equipment/equipment.module';
import { CheckoutsModule } from '../checkouts/checkouts.module';

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
