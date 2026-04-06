import { Module } from '@nestjs/common';
import { CalibrationPlansController } from './calibration-plans.controller';
import { CalibrationPlansService } from './calibration-plans.service';
import { CalibrationPlansExportService } from './calibration-plans-export.service';

// CalibrationPlansExportService depends on FormTemplateService (provided by @Global FormTemplateModule)
@Module({
  controllers: [CalibrationPlansController],
  providers: [CalibrationPlansService, CalibrationPlansExportService],
  exports: [CalibrationPlansService],
})
export class CalibrationPlansModule {}
