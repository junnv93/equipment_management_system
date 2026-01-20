import { Module } from '@nestjs/common';
import { CalibrationPlansController } from './calibration-plans.controller';
import { CalibrationPlansService } from './calibration-plans.service';
import { CalibrationPlansPdfService } from './calibration-plans-pdf.service';

@Module({
  controllers: [CalibrationPlansController],
  providers: [CalibrationPlansService, CalibrationPlansPdfService],
  exports: [CalibrationPlansService],
})
export class CalibrationPlansModule {}
