/**
 * 승인 페이지 공통 상수
 *
 * Equipment, Calibration 승인 페이지에서 공통으로 사용하는 상태 라벨과 색상.
 * 라벨은 @equipment-management/schemas SSOT에서 import합니다.
 */

// SSOT: CALIBRATION_APPROVAL_STATUS_LABELS와 동일한 값 — 범용 승인 상태 라벨로 re-export
export { CALIBRATION_APPROVAL_STATUS_LABELS as APPROVAL_STATUS_LABELS } from '@equipment-management/schemas';

export const APPROVAL_STATUS_COLORS: Record<string, string> = {
  pending_approval: 'bg-brand-warning/10 text-brand-warning',
  approved: 'bg-brand-ok/10 text-brand-ok',
  rejected: 'bg-brand-critical/10 text-brand-critical',
};
