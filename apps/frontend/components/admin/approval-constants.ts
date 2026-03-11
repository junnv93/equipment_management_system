/**
 * 승인 페이지 공통 상수
 *
 * Equipment, Calibration 승인 페이지에서 공통으로 사용하는 상태 라벨과 색상.
 * CalibrationFactor, CalibrationPlan, Software는 각 API 모듈에서 자체 상수를 가지므로
 * 필요 시에만 이 상수를 사용합니다.
 */

export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending_approval: '승인 대기',
  approved: '승인됨',
  rejected: '반려됨',
};

export const APPROVAL_STATUS_COLORS: Record<string, string> = {
  pending_approval: 'bg-brand-warning/10 text-brand-warning',
  approved: 'bg-brand-ok/10 text-brand-ok',
  rejected: 'bg-brand-critical/10 text-brand-critical',
};
