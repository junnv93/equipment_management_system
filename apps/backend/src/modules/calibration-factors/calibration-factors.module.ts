import { Module } from '@nestjs/common';
import { CalibrationFactorsController } from './calibration-factors.controller';
import { CalibrationFactorsService } from './calibration-factors.service';

@Module({
  controllers: [CalibrationFactorsController],
  providers: [CalibrationFactorsService],
  exports: [CalibrationFactorsService],
})
export class CalibrationFactorsModule {}
