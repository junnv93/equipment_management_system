/**
 * Checkout feature flags (Sprint 3.1 — canary 패턴)
 *
 * 기본값: false (canary OFF). 다음 스프린트에서 flag 완전 제거 예정.
 * env: NEXT_PUBLIC_CHECKOUT_INBOUND_BFF=true 로 BFF 사용 활성화
 */
export function isInboundBffEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CHECKOUT_INBOUND_BFF === 'true';
}
