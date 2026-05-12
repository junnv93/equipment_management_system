import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DocumentService } from '../../../common/file-upload/document.service';
import { MetricsService } from '../../../common/metrics/metrics.service';

/**
 * Orphan `condition_check_photo` 문서 sweep 스케줄러 (qr-visual-redesign-followups-batch-1 S-4).
 *
 * Frontend `documentApi.deleteOrphan` (best-effort) 의 silent fail 회귀 차단용 **2중 안전망**.
 * 1시간 주기 + 24시간 마진:
 * - 짧은 주기로 orphan 누적 0건 유지
 * - in-flight 업로드/저장 cycle 의 false positive 회피
 *
 * 9 다형성 FK 전부 NULL + `document_type === 'condition_check_photo'` + `status !== 'deleted'`
 * 인 문서만 sweep 대상. 파일 + DB 양쪽 즉시 삭제 (orphan 은 user-visible 0).
 *
 * 관측성: `orphan_photo_sweep_total{result}` Prometheus Counter + structured logger.log.
 * Audit log 미사용 (다른 cron 패턴 정합 — cron 은 HTTP 컨텍스트 외부이므로 `@AuditLog` decorator
 * 적용 불가. 대신 batch 단위 1 logger.log + deletedIds 배열 metadata 기록).
 */
@Injectable()
export class OrphanPhotoCleanupScheduler {
  private readonly logger = new Logger(OrphanPhotoCleanupScheduler.name);

  /** orphan 판정 마진 — 24시간. in-flight 업로드 cycle 보호. */
  private static readonly OLDER_THAN_HOURS = 24;
  /** 배치 크기 — purgeDeletedDocuments 패턴 차용. */
  private static readonly BATCH_SIZE = 100;

  constructor(
    private readonly documentService: DocumentService,
    private readonly metricsService: MetricsService
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron(): Promise<void> {
    try {
      this.logger.log(
        `orphan condition_check_photo sweep 시작 (olderThanHours=${OrphanPhotoCleanupScheduler.OLDER_THAN_HOURS}, batchSize=${OrphanPhotoCleanupScheduler.BATCH_SIZE})`
      );

      const result = await this.documentService.sweepOrphanConditionCheckPhotos(
        OrphanPhotoCleanupScheduler.OLDER_THAN_HOURS,
        OrphanPhotoCleanupScheduler.BATCH_SIZE
      );

      // Prometheus Counter — result 별 batch 단위 한 번에 누적 (inc(label, N) 패턴)
      this.metricsService.incrementOrphanPhotoSweep('deleted', result.deleted);
      this.metricsService.incrementOrphanPhotoSweep('errors', result.errors);
      if (result.deleted === 0 && result.errors === 0) {
        this.metricsService.incrementOrphanPhotoSweep('skipped');
      }

      // structured log — batch 단위 1 row + deletedIds metadata (audit 대체)
      this.logger.log(
        `orphan_photo_sweep_complete deleted=${result.deleted} errors=${result.errors} deletedIds=${JSON.stringify(result.deletedIds)}`
      );
    } catch (error) {
      this.metricsService.incrementOrphanPhotoSweep('errors', 1);
      this.logger.error(
        'orphan condition_check_photo sweep 실행 중 예외 발생',
        error instanceof Error ? error.stack : String(error)
      );
    }
  }
}
