import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { testSoftware } from '@equipment-management/db/schema';
import { NOTIFICATION_EVENTS } from '../../notifications/events/notification-events';
import { CACHE_KEY_PREFIXES } from '../../../common/cache/cache-key-prefixes';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';

interface QualityApprovedEvent {
  validationId: string;
  testSoftwareId: string;
  actorId: string;
  timestamp: Date;
}

/**
 * 소프트웨어 유효성 확인 품질 승인 시 test_software.latestValidationId 갱신
 *
 * ISO/IEC 17025 §6.4.13: 유효성 확인 이력 추적 의무
 * 절차서 시험소프트웨어유효성확인.md §131-132: 품질책임자 승인 후 UL-QP-18-07 등록
 */
@Injectable()
export class SoftwareValidationListener {
  private readonly logger = new Logger(SoftwareValidationListener.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    private readonly cacheService: SimpleCacheService
  ) {}

  @OnEvent(NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_QUALITY_APPROVED, { async: true })
  async handleQualityApproved(event: QualityApprovedEvent): Promise<void> {
    try {
      await this.db
        .update(testSoftware)
        .set({
          latestValidationId: event.validationId,
          latestValidatedAt: event.timestamp,
          updatedAt: new Date(),
        })
        .where(eq(testSoftware.id, event.testSoftwareId));

      // 품질 승인된 소프트웨어의 detail 캐시만 정확히 무효화 (전체 prefix flush 방지)
      this.cacheService.delete(`${CACHE_KEY_PREFIXES.TEST_SOFTWARE}detail:${event.testSoftwareId}`);
    } catch (err) {
      this.logger.error(
        `Failed to update latestValidationId for testSoftware ${event.testSoftwareId}`,
        err
      );
    }
  }
}
