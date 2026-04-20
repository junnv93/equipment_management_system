import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { FormTemplateController } from './form-template.controller';
import { ReportsService } from './reports.service';
import { ReportExportService } from './report-export.service';
import { RetentionService } from './retention.service';
import { FormTemplateExportService } from './form-template-export.service';
import { EquipmentRegistryDataService } from './services/equipment-registry-data.service';
import { EquipmentRegistryRendererService } from './services/equipment-registry-renderer.service';
import { SoftwareValidationRendererService } from '../software-validations/services/software-validation-renderer.service';
import { SoftwareValidationsModule } from '../software-validations/software-validations.module';
import { IntermediateInspectionsModule } from '../intermediate-inspections/intermediate-inspections.module';
import { SelfInspectionsModule } from '../self-inspections/self-inspections.module';

@Module({
  imports: [IntermediateInspectionsModule, SelfInspectionsModule, SoftwareValidationsModule],
  controllers: [ReportsController, FormTemplateController],
  providers: [
    ReportsService,
    ReportExportService,
    RetentionService,
    FormTemplateExportService,
    EquipmentRegistryDataService,
    EquipmentRegistryRendererService,
    SoftwareValidationRendererService,
  ],
  exports: [ReportsService, RetentionService, FormTemplateExportService],
})
export class ReportsModule {}
