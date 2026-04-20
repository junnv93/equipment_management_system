import {
  CalibrationPlanStatusValues,
  type CalibrationPlanStatus,
} from '@equipment-management/schemas';

// allowlist — 백엔드 EXPORTABLE_PLAN_STATUSES 패턴과 방향 통일
// (calibration-plan-export-data.service.ts 동기화)
// 신규 CalibrationPlanStatus 추가 시 이 목록을 명시적으로 갱신해야 export 허용
export const EXPORTABLE_CALIBRATION_PLAN_STATUSES: readonly CalibrationPlanStatus[] = [
  CalibrationPlanStatusValues.APPROVED,
] as const;

export function isCalibrationPlanExportable(status: CalibrationPlanStatus): boolean {
  return (EXPORTABLE_CALIBRATION_PLAN_STATUSES as readonly string[]).includes(status);
}
