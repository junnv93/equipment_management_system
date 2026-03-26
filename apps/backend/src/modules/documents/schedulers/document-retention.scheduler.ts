import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DocumentService } from '../../../common/file-upload/document.service';
import { SettingsService } from '../../settings/settings.service';

/**
 * 문서 물리 삭제 스케줄러
 *
 * 매일 새벽 2시(UTC)에 보존 기간이 지난 soft-deleted 문서의
 * 물리 파일(Local/S3)을 삭제하고 DB 레코드를 하드 삭제합니다.
 *
 * 보존 기간은 system_settings.documentRetentionDays에서 동적 로드합니다.
 * (기본값: 30일 — DEFAULT_SYSTEM_SETTINGS)
 */
@Injectable()
export class DocumentRetentionScheduler {
  private readonly logger = new Logger(DocumentRetentionScheduler.name);

  constructor(
    private readonly documentService: DocumentService,
    private readonly settingsService: SettingsService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCron(): Promise<void> {
    let retentionDays: number;
    try {
      const settings = await this.settingsService.getSystemSettings();
      retentionDays = settings.documentRetentionDays;
    } catch (error) {
      this.logger.error(
        '문서 보존 설정 로드 실패 — 스케줄러 실행 중단',
        error instanceof Error ? error.stack : String(error)
      );
      return;
    }

    try {
      this.logger.log(`문서 물리 삭제 시작 (보존 기간: ${retentionDays}일)`);
      const result = await this.documentService.purgeDeletedDocuments(retentionDays);
      this.logger.log(`문서 물리 삭제 완료: ${result.purged}건 삭제, ${result.failed}건 실패`);
    } catch (error) {
      this.logger.error(
        '문서 물리 삭제 실행 중 예외 발생',
        error instanceof Error ? error.stack : String(error)
      );
    }
  }
}
