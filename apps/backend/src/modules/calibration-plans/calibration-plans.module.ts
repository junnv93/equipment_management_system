import { Module } from '@nestjs/common';
import { CalibrationPlansController } from './calibration-plans.controller';
import { CalibrationPlansService } from './calibration-plans.service';
import { CalibrationPlansExportService } from './calibration-plans-export.service';
import { CalibrationPlanExportDataService } from './services/calibration-plan-export-data.service';
import { CalibrationPlanRendererService } from './services/calibration-plan-renderer.service';
import { CalibrationPlanSyncListener } from './listeners/calibration-plan-sync.listener';

// CalibrationPlanRendererService depends on FormTemplateService (provided by @Global FormTemplateModule)
@Module({
  controllers: [CalibrationPlansController],
  providers: [
    CalibrationPlansService,
    CalibrationPlansExportService,
    CalibrationPlanExportDataService,
    CalibrationPlanRendererService,
    CalibrationPlanSyncListener,
  ],
  exports: [CalibrationPlansService],
})
export class CalibrationPlansModule {}
