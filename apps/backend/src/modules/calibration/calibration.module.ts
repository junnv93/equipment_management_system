import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CalibrationService } from './calibration.service';
import { CalibrationController } from './calibration.controller';
import { FileUploadService } from '../equipment/services/file-upload.service';

@Module({
  imports: [ConfigModule],
  controllers: [CalibrationController],
  providers: [CalibrationService, FileUploadService],
  exports: [CalibrationService],
})
export class CalibrationModule {}
