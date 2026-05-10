/**
 * Checkout QR Drawer Design Tokens
 *
 * SSOT for QR drawer layout spacing. dark: prefix 금지 — CSS 변수 자동 전환.
 */
export const CHECKOUT_QR_DRAWER_TOKENS = {
  content: {
    bodyPadding: 'px-6 pb-6',
    itemGap: 'gap-6',
  },
  item: {
    wrapper: 'flex flex-col items-center gap-1',
    name: 'text-sm font-medium text-foreground text-center',
    number: 'text-xs text-muted-foreground font-mono',
    divider: 'w-full border-t border-border my-2',
  },
} as const;
