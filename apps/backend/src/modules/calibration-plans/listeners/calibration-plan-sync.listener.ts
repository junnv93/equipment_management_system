import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CACHE_EVENTS, type CalibrationCachePayload } from '../../../common/cache/cache-events';
import { CalibrationPlansService } from '../calibration-plans.service';

/**
 * 교정 기록 생성 시 해당 연도 교정계획서 항목의 실제 교정일을 자동 동기화.
 *
 * CalibrationService → CACHE_EVENTS.CALIBRATION_CREATED 이벤트 → 이 리스너
 * → recordActualCalibrationDate() → 동일 연도 approved 계획서 actualCalibrationDate 갱신
 *
 * 느슨한 결합: CalibrationModule ↔ CalibrationPlansModule 직접 의존 없이 이벤트 채널로 연결.
 * 실패해도 교정 등록 트랜잭션에 영향 없음 (best-effort 동기화).
 */
@Injectable()
export class CalibrationPlanSyncListener {
  private readonly logger = new Logger(CalibrationPlanSyncListener.name);

  constructor(private readonly calibrationPlansService: CalibrationPlansService) {}

  @OnEvent(CACHE_EVENTS.CALIBRATION_CREATED, { async: true })
  async handleCalibrationCreated(payload: CalibrationCachePayload): Promise<void> {
    try {
      const updated = await this.calibrationPlansService.recordActualCalibrationDate(
        payload.equipmentId,
        payload.calibrationDate
      );
      if (updated > 0) {
        this.logger.log(
          `교정계획서 실적 자동 동기화: equipmentId=${payload.equipmentId}, ` +
            `date=${payload.calibrationDate.toISOString()}, ${updated}건 갱신`
        );
      }
    } catch (error) {
      this.logger.warn(
        `교정계획서 실적 동기화 실패 (equipmentId: ${payload.equipmentId}): ${error}`
      );
    }
  }
}
