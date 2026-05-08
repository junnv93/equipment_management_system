'use client';

import { useMemo } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import calibrationApi, {
  type Calibration,
  type CalibrationHistory,
} from '@/lib/api/calibration-api';
import type { PaginatedResponse } from '@/lib/api/types';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';

/**
 * 장비별 교정 데이터 fetching SSOT.
 *
 * Tab(`CalibrationHistoryTab`) 과 Sub-route(`CalibrationHistoryClient`) 가 각각
 * 다른 backend endpoint 를 호출하지만 데이터는 동일 도메인. queryKey/queryFn/QUERY_CONFIG
 * pairing 을 본 hook 모듈에 결빙해 회귀 차단 + 신규 caller 강제 SSOT.
 *
 * **두 endpoint shape 가 superset 관계 아님 — hook 통합 불가**:
 * - `getEquipmentCalibrations(equipmentId)` → `Calibration[]` (version/certificatePath/calibrationManagerId 포함)
 * - `getCalibrationHistory({ equipmentId })` → `PaginatedResponse<CalibrationHistory>` (equipmentName/managementNumber join 포함)
 *
 * Backend endpoint 통합 + 응답 shape 정합화는 본 sprint out-of-scope (사용처 cache key 분리 + UX trade-off 수용).
 */
export function useEquipmentCalibrations(equipmentId: string): UseQueryResult<Calibration[]> {
  return useQuery({
    queryKey: queryKeys.calibrations.byEquipment(equipmentId),
    queryFn: () => calibrationApi.getEquipmentCalibrations(equipmentId),
    enabled: !!equipmentId,
    ...QUERY_CONFIG.HISTORY,
  });
}

/**
 * Sub-route Client 전용 — 단일 장비 필터 + 선택적 pageSize.
 * `historyList` queryKey 의 filter object 가 cache key 의 일부라 stable reference 필수.
 */
export function useEquipmentCalibrationHistory(
  equipmentId: string,
  options: { pageSize?: number } = {}
): UseQueryResult<PaginatedResponse<CalibrationHistory>> {
  const filters = useMemo(
    () => ({ equipmentId, pageSize: options.pageSize }),
    [equipmentId, options.pageSize]
  );
  return useQuery({
    queryKey: queryKeys.calibrations.historyList(filters),
    queryFn: () => calibrationApi.getCalibrationHistory(filters),
    enabled: !!equipmentId,
    ...QUERY_CONFIG.CALIBRATION_LIST,
  });
}
