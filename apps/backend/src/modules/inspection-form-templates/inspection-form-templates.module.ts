import { Module } from '@nestjs/common';
import {
  EquipmentInspectionTemplateController,
  InspectionTemplatesGalleryController,
} from './inspection-form-templates.controller';
import { InspectionFormTemplatesService } from './inspection-form-templates.service';
import { AuditModule } from '../audit/audit.module';

/**
 * Inspection Form Templates Module — Phase 1B-B
 *
 * UL-QP-18-03 (중간점검) / UL-QP-18-05 (자체점검) Build-Once Workflow.
 *
 * 의존성:
 * - AuditModule: AuditService 주입 (audit log 기록)
 * - DRIZZLE_INSTANCE: AppDatabase (database.module.ts에서 글로벌 등록)
 * - SimpleCacheService: 글로벌 cache module
 * - EventEmitter2: NestJS EventEmitter 모듈
 *
 * Service는 export — intermediate-inspections / self-inspections approve hook에서 사용.
 */
@Module({
  imports: [AuditModule],
  controllers: [EquipmentInspectionTemplateController, InspectionTemplatesGalleryController],
  providers: [InspectionFormTemplatesService],
  exports: [InspectionFormTemplatesService],
})
export class InspectionFormTemplatesModule {}
