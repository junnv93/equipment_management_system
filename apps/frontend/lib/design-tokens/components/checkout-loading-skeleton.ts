/**
 * Checkout Loading Skeleton Design Tokens
 *
 * SSOT: 모든 checkout 스켈레톤 컴포넌트는 이 토큰을 공유
 * animate-pulse + motion-reduce:animate-none 패턴 준수
 * spinner 사용 금지
 */

export const CHECKOUT_LOADING_SKELETON_TOKENS = {
  base: 'animate-pulse rounded-md bg-muted motion-reduce:animate-none',
  text: {
    sm: 'h-3 w-24',
    md: 'h-4 w-40',
    lg: 'h-5 w-56',
  },
  card: 'h-24 w-full rounded-lg',
  badge: 'h-6 w-16 rounded-full',
  icon: 'h-8 w-8 rounded-full',
  timeline: 'h-64 w-full',
} as const;
