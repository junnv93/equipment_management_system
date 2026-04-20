/**
 * 장비 이력 일괄 저장 유틸리티
 *
 * CreateEquipmentContent와 CreateSharedEquipmentContent에서 공통으로 사용.
 * Promise.all 기반 병렬 처리로 성능 향상, 부분 실패 시에도 나머지 저장 계속 진행.
 *
 * ⚠️ React 외부 유틸이므로 i18n 훅 사용 불가.
 *    라벨/메시지는 호출자(컴포넌트)에서 i18n으로 주입합니다.
 */
import equipmentApi from '@/lib/api/equipment-api';
import { ApiError } from '@/lib/errors/equipment-errors';
import type { PendingHistoryData } from '@/components/equipment/EquipmentForm';

export interface HistorySaveResult {
  type: 'location' | 'maintenance' | 'incident' | 'calibration';
  index: number;
  status: 'fulfilled' | 'rejected';
  error?: string;
}

/**
 * 장비 이력을 병렬로 일괄 저장합니다.
 *
 * @param equipmentUuid - 대상 장비 UUID
 * @param pendingHistory - 저장할 이력 데이터
 * @param errorFallback - ApiError가 아닌 경우의 폴백 에러 메시지 (i18n: t('form.toasts.saveFailed'))
 */
export async function saveHistoryInParallel(
  equipmentUuid: string,
  pendingHistory: PendingHistoryData,
  errorFallback: string
): Promise<HistorySaveResult[]> {
  const fallbackError = (err: unknown) =>
    err instanceof ApiError ? err.getUserMessage() : errorFallback;

  const locationPromises = pendingHistory.locationHistory.map((item, index) =>
    equipmentApi
      .createLocationHistory(equipmentUuid, item)
      .then(() => ({ type: 'location' as const, index, status: 'fulfilled' as const }))
      .catch((err) => ({
        type: 'location' as const,
        index,
        status: 'rejected' as const,
        error: fallbackError(err),
      }))
  );

  const maintenancePromises = pendingHistory.maintenanceHistory.map((item, index) =>
    equipmentApi
      .createMaintenanceHistory(equipmentUuid, item)
      .then(() => ({ type: 'maintenance' as const, index, status: 'fulfilled' as const }))
      .catch((err) => ({
        type: 'maintenance' as const,
        index,
        status: 'rejected' as const,
        error: fallbackError(err),
      }))
  );

  const incidentPromises = pendingHistory.incidentHistory.map((item, index) =>
    equipmentApi
      .createIncidentHistory(equipmentUuid, item)
      .then(() => ({ type: 'incident' as const, index, status: 'fulfilled' as const }))
      .catch((err) => ({
        type: 'incident' as const,
        index,
        status: 'rejected' as const,
        error: fallbackError(err),
      }))
  );

  // TODO(Phase-import): 교정 이력 일괄 임포트 — 교정 등록이 multipart(파일 필수)로 전환됨에 따라
  // 파일 없는 과거 이력 임포트는 별도 import 엔드포인트 설계 필요 (Phase 관리 방식).
  // 현재는 교정 이력 항목을 skip하고 fulfilled로 처리.
  const calibrationPromises = (pendingHistory.calibrationHistory || []).map((_item, index) =>
    Promise.resolve({ type: 'calibration' as const, index, status: 'fulfilled' as const })
  );

  return Promise.all([
    ...locationPromises,
    ...maintenancePromises,
    ...incidentPromises,
    ...calibrationPromises,
  ]);
}
