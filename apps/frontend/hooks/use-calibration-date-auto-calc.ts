'use client';

import { useCallback } from 'react';
import { addMonths } from 'date-fns';
import { formatDate, toDate } from '@/lib/utils/date';

export interface CalibrationDateAutoCalcResult {
  /** calibrationDate 또는 calibrationCycle 변경 시 nextCalibrationDate/intermediateCheckDate 제안값 계산 */
  calcDates: (
    calibrationDate: string,
    calibrationCycle: number
  ) => { nextCalibrationDate: string; intermediateCheckDate: string };
}

/**
 * 교정 날짜 자동 계산 훅
 *
 * - nextCalibrationDate = calibrationDate + calibrationCycle(월)
 * - intermediateCheckDate = calibrationDate + calibrationCycle/2(월), 짝수 월일 때만
 * - 서버가 최종 권한 (nextCalibrationDate는 equipment.calibrationCycle 기반으로 서버가 재계산)
 * - 이 훅은 UX "제안값"만 제공 — 서버 응답이 authority
 */
export function useCalibrationDateAutoCalc(): CalibrationDateAutoCalcResult {
  const calcDates = useCallback(
    (
      calibrationDate: string,
      calibrationCycle: number
    ): { nextCalibrationDate: string; intermediateCheckDate: string } => {
      const base = toDate(calibrationDate) ?? new Date();
      const next = addMonths(base, calibrationCycle);
      const halfCycle = Math.floor(calibrationCycle / 2);
      const intermediate = halfCycle > 0 ? addMonths(base, halfCycle) : null;

      return {
        nextCalibrationDate: formatDate(next, 'yyyy-MM-dd'),
        intermediateCheckDate: intermediate ? formatDate(intermediate, 'yyyy-MM-dd') : '',
      };
    },
    []
  );

  return { calcDates };
}
