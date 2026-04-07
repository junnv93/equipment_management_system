import { Global, Module } from '@nestjs/common';
import { FormTemplateService } from './form-template.service';
import { FormTemplateArchivalService } from './form-template-archival.service';

/**
 * 양식 템플릿 모듈 (글로벌)
 *
 * FormTemplateService를 전역으로 제공하여
 * ReportsModule, EquipmentModule 등에서 import 없이 사용 가능합니다.
 */
@Global()
@Module({
  providers: [FormTemplateService, FormTemplateArchivalService],
  exports: [FormTemplateService],
})
export class FormTemplateModule {}
