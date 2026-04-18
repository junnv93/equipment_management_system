/**
 * BulkActionBar Component Tokens (Layer 3: Component-Specific)
 *
 * SSOT for the generic BulkActionBar — used across equipment list, approvals, data-migration, etc.
 * APPROVAL_BULK_BAR_TOKENS는 deprecated alias로 유지 (approval.ts 참조).
 */

export const BULK_ACTION_BAR_TOKENS = {
  /** sticky 또는 inline 배경 */
  container: 'bg-muted/30 border-border',
  /** sticky-top 변형: z-index + CSS 변수 오프셋 */
  stickyTop:
    'sticky top-[var(--sticky-header-height,0px)] z-[var(--z-sticky,20)] border-b shadow-sm',
  /** sticky-bottom 변형 */
  stickyBottom: 'sticky bottom-0 z-[var(--z-sticky,20)] border-t shadow-sm',
  /** inline 변형 (기본 — non-sticky) */
  inline: 'border-t',
  /** 내부 레이아웃 */
  inner: 'flex items-center gap-3 px-4 py-2',
  /** 선택 카운트 텍스트 */
  countText: 'text-sm font-medium text-foreground',
  /** 구분선 */
  separator: 'h-4 w-px bg-border mx-1',
  /** 전체 선택 / 선택 해제 버튼 */
  actionButton: 'text-sm text-muted-foreground hover:text-foreground',
  /** indeterminate 체크박스: WCAG 3:1 대비 primary 변형 */
  indeterminateFill:
    'data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground',
} as const;
