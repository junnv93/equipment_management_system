import { Module } from '@nestjs/common';
import { CalibrationService } from './calibration.service';
import { CalibrationController } from './calibration.controller';
// FileUploadService는 FileUploadModule(@Global)에서 전역 제공

@Module({
  controllers: [CalibrationController],
  providers: [CalibrationService],
  exports: [CalibrationService],
})
export class CalibrationModule {}
