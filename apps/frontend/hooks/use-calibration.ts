'use client';

import { useQuery } from '@tanstack/react-query';
import calibrationApi, { type Calibration } from '@/lib/api/calibration-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';

/**
 * 교정 기록 상세 조회 훅
 *
 * staleTime=SHORT(30s) — 승인/반려 상태 변경이 즉시 반영되어야 함.
 */
export function useCalibrationDetail(id: string | null | undefined) {
  return useQuery<Calibration>({
    queryKey: queryKeys.calibrations.detail(id ?? ''),
    queryFn: () => calibrationApi.getCalibration(id!),
    enabled: !!id,
    ...QUERY_CONFIG.CALIBRATION_DETAIL,
  });
}
