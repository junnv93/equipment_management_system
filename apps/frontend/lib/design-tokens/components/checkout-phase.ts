/**
 * Checkout Rental Phase UI 토큰 (Layer 3: Component-Specific)
 *
 * CheckoutPhaseIndicator · WorkflowTimeline 렌더 전용.
 * 3단계 Phase (approve → handover → return) UI 표현.
 *
 * 색상: brand CSS 변수 경유 (`:root`/`.dark` 자동 전환, `dark:` prefix 금지).
 */

import type { RentalPhase } from '@equipment-management/schemas';

/** Phase Indicator 컨테이너 */
export const CHECKOUT_RENTAL_PHASE_TOKENS = {
  /** 인디케이터 컨테이너 */
  container: 'flex items-center gap-1.5',
  /** compact 변형 (목록 행) */
  containerCompact: 'flex items-center gap-1',
  /** inline 변형 (상세 패널 내) */
  containerInline: 'flex items-center gap-2',

  /** Phase 라벨 (텍스트 부분) */
  label: 'text-xs font-medium text-foreground',
  labelCompact: 'text-xs font-medium text-muted-foreground',

  /** Phase dot 공통 */
  dotBase: 'h-2 w-2 rounded-full shrink-0 transition-colors',
  /** dot 상태별 */
  dotState: {
    complete: 'bg-brand-ok',
    current: 'bg-brand-info ring-2 ring-brand-info/30',
    future: 'bg-muted',
  } as const satisfies Record<'complete' | 'current' | 'future', string>,

  /** Phase card (WorkflowTimeline phase-collapsible 모드) */
  phaseCard: {
    base: 'border rounded-lg overflow-hidden',
    complete: 'border-brand-ok/30 bg-brand-ok/5',
    current: 'border-brand-info/40 bg-brand-info/5',
    future: 'border-border bg-background',
  },
  phaseCardHeader: {
    base: 'flex items-center justify-between px-4 py-3 cursor-pointer select-none',
    complete: 'text-brand-ok',
    current: 'text-brand-info font-medium',
    future: 'text-muted-foreground',
  },
  phaseCardContent: 'px-4 pb-4',
  expandBtn: 'text-xs text-muted-foreground underline-offset-2 hover:underline',
  collapsedSummary: 'text-xs text-muted-foreground',
  expandAllBtn:
    'text-xs text-muted-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded',
} as const;

/** phase dot 상태 계산 헬퍼 (phaseIndex 비교 기반) */
export function getPhaseCardState(
  phase: RentalPhase,
  currentPhaseIndex: number | null,
  allPhases: readonly RentalPhase[]
): 'complete' | 'current' | 'future' {
  if (currentPhaseIndex === null) return 'future';
  const phaseIndex = allPhases.indexOf(phase);
  if (phaseIndex < currentPhaseIndex) return 'complete';
  if (phaseIndex === currentPhaseIndex) return 'current';
  return 'future';
}
