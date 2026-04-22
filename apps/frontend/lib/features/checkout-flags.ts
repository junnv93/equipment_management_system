/**
 * Checkout Feature Flags SSOT
 *
 * env 변수 읽기 헬퍼. 컴포넌트에서 직접 process.env 접근 금지 — 이 파일 경유 필수.
 * Feature Flag 상시화(rollout) 시 이 파일만 수정하면 됨.
 */

/**
 * NextStepPanel 표시 여부.
 *
 * 활성화: NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=true
 * 기본값: false (점진 롤아웃)
 */
export function isNextStepPanelEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL === 'true';
}
