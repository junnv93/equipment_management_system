/**
 * Checkout Feature Flags SSOT
 *
 * env 변수 읽기 헬퍼. 컴포넌트에서 직접 process.env 접근 금지 — 이 파일 경유 필수.
 * Feature Flag 상시화(rollout) 시 이 파일만 수정하면 됨.
 */

/**
 * NextStepPanel 표시 여부.
 *
 * Sprint 1.4(2026-04-24)에서 상시화 완료. LegacyActionsBlock 제거됨.
 * @deprecated 호출부 정리 후 이 함수도 제거 예정.
 */
export function isNextStepPanelEnabled(): boolean {
  return true;
}
