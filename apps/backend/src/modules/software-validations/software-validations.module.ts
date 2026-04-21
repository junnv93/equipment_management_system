import { Module } from '@nestjs/common';
import {
  SoftwareValidationsController,
  TestSoftwareValidationsController,
} from './software-validations.controller';
import { SoftwareValidationsService } from './software-validations.service';
import { SoftwareValidationExportDataService } from './services/software-validation-export-data.service';
import { SoftwareValidationRendererService } from './services/software-validation-renderer.service';

@Module({
  controllers: [TestSoftwareValidationsController, SoftwareValidationsController],
  providers: [
    SoftwareValidationsService,
    SoftwareValidationExportDataService,
    SoftwareValidationRendererService,
  ],
  exports: [
    SoftwareValidationsService,
    SoftwareValidationExportDataService,
    SoftwareValidationRendererService,
  ],
})
export class SoftwareValidationsModule {}
