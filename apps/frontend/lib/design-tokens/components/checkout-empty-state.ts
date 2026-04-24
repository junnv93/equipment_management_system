/**
 * Checkout Empty State Tokens (Layer 3: Component-Specific)
 *
 * CheckoutEmptyState 전용 variant 토큰 SSOT.
 * 공용 레이아웃(container/icon/title/description/actions)은 EMPTY_STATE_TOKENS(semantic.ts) 재사용.
 * 이 파일은 checkout variant 3종의 아이콘 색상/배경만 정의한다.
 *
 * Variant 키는 CHECKOUT_ICON_MAP.emptyState 키와 1:1 대응 (checkout-icons.ts).
 */

export type CheckoutEmptyStateVariant = 'in-progress' | 'completed' | 'filtered';

export const CHECKOUT_EMPTY_STATE_TOKENS = {
  /** variant별 아이콘 색상 */
  variantIconColor: {
    'in-progress': 'text-brand-info',
    completed: 'text-muted-foreground',
    filtered: 'text-muted-foreground',
  },
  /** variant별 아이콘 배경 (iconContainer 결합용) */
  variantIconBg: {
    'in-progress': 'bg-brand-info/5 rounded-full p-3',
    completed: '',
    filtered: '',
  },
} as const;
