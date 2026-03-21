/**
 * 승인 KPI 상수 — Backend/Frontend 공유 SSOT
 *
 * 승인 대기 항목의 긴급도 분류 기준 및 KPI 관련 상수.
 * 이 파일이 유일한 소스이며, 프론트엔드/백엔드에서 로컬 재정의 금지.
 *
 * @example
 * // Backend (SQL)
 * import { APPROVAL_KPI } from '@equipment-management/shared-constants';
 * sql`COUNT(*) FILTER (WHERE created_at <= NOW() - interval '${APPROVAL_KPI.URGENT_THRESHOLD_DAYS} days')`
 *
 * // Frontend (visual feedback)
 * import { APPROVAL_KPI } from '@equipment-management/shared-constants';
 * if (elapsedDays >= APPROVAL_KPI.URGENT_THRESHOLD_DAYS) return 'critical';
 */
export const APPROVAL_KPI = {
  /** 긴급 임계값 (일) — 이 일수 이상 경과한 항목은 '긴급' 분류 */
  URGENT_THRESHOLD_DAYS: 8,
  /** 경고 임계값 (일) — 이 일수 이상 경과한 항목은 '주의' 분류 */
  WARNING_THRESHOLD_DAYS: 4,
  /** "오늘 처리 건수" 집계에 포함되는 감사 로그 액션 */
  PROCESSED_ACTIONS: ['approve', 'reject', 'review'] as const,
} as const;
