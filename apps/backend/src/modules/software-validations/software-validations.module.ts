import { Module } from '@nestjs/common';
import {
  SoftwareValidationsController,
  TestSoftwareValidationsController,
} from './software-validations.controller';
import { SoftwareValidationsService } from './software-validations.service';
import { SoftwareValidationExportDataService } from './services/software-validation-export-data.service';

@Module({
  controllers: [TestSoftwareValidationsController, SoftwareValidationsController],
  providers: [SoftwareValidationsService, SoftwareValidationExportDataService],
  exports: [SoftwareValidationsService, SoftwareValidationExportDataService],
})
export class SoftwareValidationsModule {}
