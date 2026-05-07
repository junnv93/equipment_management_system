/**
 * FilterChip Design Tokens
 *
 * deep-link filter (예: equipmentId 쿼리 파라미터)가 활성화된 상태를
 * 시각적으로 알리고 한 번의 클릭으로 해제할 수 있는 chip의 토큰.
 *
 * 용도: `<FilterChip>` (`components/shared/FilterChip.tsx`).
 * 도메인 중립 — calibration / checkouts / equipment 등 deep-link 패턴이 등장하는
 * 모든 도메인에서 재사용한다.
 *
 * SSOT 정합:
 * - container background는 `bg-muted/50` (세미컬러 강조 회피, focus 분산 방지).
 * - clearButton은 `text-primary hover:underline` — 기존 inline link 패턴 유지.
 * - badge가 아닌 *interactive remove button*을 포함하므로 `BADGE_TOKENS` 와는 별도.
 */
export const FILTER_CHIP_TOKENS = {
  container:
    'flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 border border-border text-sm',
  label: 'font-medium',
  value: 'text-muted-foreground',
  clearButton:
    'ml-auto text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm',
} as const;

export type FilterChipTokens = typeof FILTER_CHIP_TOKENS;
