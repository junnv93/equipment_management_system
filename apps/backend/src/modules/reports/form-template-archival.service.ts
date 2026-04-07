import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FormTemplateService } from './form-template.service';

/**
 * 양식 템플릿 보존연한 만료 자동 아카이빙 스케줄러 (UL-QP-03 §11).
 *
 * 매일 자정 FORM_CATALOG의 보존연한을 초과한 row를 소프트 아카이브합니다.
 * 파일 자체는 스토리지에 보존되며, archivedAt만 설정되어 listAllCurrent에서 제외됩니다.
 */
@Injectable()
export class FormTemplateArchivalService {
  private readonly logger = new Logger(FormTemplateArchivalService.name);

  constructor(private readonly formTemplateService: FormTemplateService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runDailyArchival(): Promise<void> {
    try {
      const { archivedCount } = await this.formTemplateService.archiveExpiredForms();
      this.logger.log(`Daily form template archival completed (archived=${archivedCount})`);
    } catch (err) {
      this.logger.error(
        `Daily form template archival failed: ${(err as Error)?.message ?? err}`,
        (err as Error)?.stack
      );
    }
  }
}
