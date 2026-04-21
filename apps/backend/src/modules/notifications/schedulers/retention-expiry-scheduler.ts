import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, lte, gte, isNotNull, eq } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { documents } from '@equipment-management/db/schema/documents';
import { DocumentStatusValues } from '@equipment-management/schemas';
import { NotificationsService } from '../notifications.service';

/**
 * 기록 보존연한 만료 알림 스케줄러 (UL-QP-18 섹션 15)
 *
 * 매일 자정 실행: 30일 내 보존연한 만료 예정 문서 감지 → 알림 발송
 */
@Injectable()
export class RetentionExpiryScheduler {
  private readonly logger = new Logger(RetentionExpiryScheduler.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    private readonly notificationsService: NotificationsService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkRetentionExpiry(): Promise<void> {
    this.logger.log('보존연한 만료 점검 시작');

    try {
      const now = new Date();
      const thirtyDaysLater = new Date(now);
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

      const expiringDocuments = await this.db
        .select({
          id: documents.id,
          fileName: documents.fileName,
          documentType: documents.documentType,
          retentionPeriod: documents.retentionPeriod,
          retentionExpiresAt: documents.retentionExpiresAt,
          uploadedBy: documents.uploadedBy,
        })
        .from(documents)
        .where(
          and(
            isNotNull(documents.retentionExpiresAt),
            lte(documents.retentionExpiresAt, thirtyDaysLater),
            gte(documents.retentionExpiresAt, now),
            eq(documents.status, DocumentStatusValues.ACTIVE)
          )
        );

      if (expiringDocuments.length === 0) {
        this.logger.log('만료 예정 문서 없음');
        return;
      }

      this.logger.log(`${expiringDocuments.length}건 보존연한 만료 예정 문서 발견`);

      let sentCount = 0;
      for (const doc of expiringDocuments) {
        try {
          if (!doc.uploadedBy) continue;

          const daysUntilExpiry = Math.ceil(
            (doc.retentionExpiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          await this.notificationsService.createSystemNotification(
            '문서 보존연한 만료 예정',
            `"${doc.fileName}" 문서의 보존연한이 ${daysUntilExpiry}일 후 만료됩니다. (보존연한: ${doc.retentionPeriod ?? '미설정'})`,
            'medium'
          );
          sentCount++;
        } catch (err) {
          this.logger.error(
            `보존연한 만료 알림 발송 실패 (문서: ${doc.fileName})`,
            err instanceof Error ? err.stack : String(err)
          );
        }
      }

      this.logger.log(`${sentCount}/${expiringDocuments.length}건 만료 알림 발송 완료`);
    } catch (error) {
      this.logger.error(
        '보존연한 만료 점검 실패',
        error instanceof Error ? error.stack : String(error)
      );
    }
  }
}
