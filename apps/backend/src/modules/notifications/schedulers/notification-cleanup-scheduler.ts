import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from '../notifications.service';
import { SettingsService } from '../../settings/settings.service';

/**
 * 만료 알림 정리 스케줄러
 *
 * 매일 자정(UTC)에 expiresAt이 현재 시각 이전인 알림을 삭제.
 * 중요도(priority) × 읽음(isRead) 매트릭스에 따라 차등 유예 기간 적용.
 * 유예 기간은 SettingsService에서 동적으로 로드 (DB system_settings).
 */
@Injectable()
export class NotificationCleanupScheduler {
  private readonly logger = new Logger(NotificationCleanupScheduler.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly settingsService: SettingsService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron(): Promise<void> {
    this.logger.log('만료 알림 정리 시작');
    try {
      const settings = await this.settingsService.getSystemSettings();

      const deletedCount = await this.notificationsService.deleteExpired({
        highGraceDays: settings.notificationHighGraceDays,
        mediumUnreadGraceDays: settings.notificationMediumUnreadGraceDays,
      });

      this.logger.log(`만료 알림 정리 완료: ${deletedCount}건 삭제`);
    } catch (error) {
      this.logger.error(
        '만료 알림 정리 실패',
        error instanceof Error ? error.stack : String(error)
      );
    }
  }
}
