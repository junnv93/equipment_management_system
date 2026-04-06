import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { FormTemplateController } from './form-template.controller';
import { ReportsService } from './reports.service';
import { ReportExportService } from './report-export.service';
import { RetentionService } from './retention.service';
import { FormTemplateExportService } from './form-template-export.service';

@Module({
  controllers: [ReportsController, FormTemplateController],
  providers: [ReportsService, ReportExportService, RetentionService, FormTemplateExportService],
  exports: [ReportsService, RetentionService, FormTemplateExportService],
})
export class ReportsModule {}
