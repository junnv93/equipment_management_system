/**
 * @deprecated CHECKOUT_PURPOSE_TOKENS으로 이전하세요.
 *
 * ```tsx
 * // Before (deprecated)
 * import { CHECKOUT_PURPOSE_STYLES } from '@equipment-management/shared-constants';
 * className={CHECKOUT_PURPOSE_STYLES.calibration}
 *
 * // After
 * import { CHECKOUT_PURPOSE_TOKENS } from '@/lib/design-tokens';
 * className={CHECKOUT_PURPOSE_TOKENS.calibration.badge}
 * ```
 *
 * SSOT: apps/frontend/lib/design-tokens/components/checkout.ts
 */
export const CHECKOUT_PURPOSE_STYLES = {
  /** 교정: 파란색 배지 */
  calibration: 'bg-blue-50 text-blue-700 border-blue-200',
  /** 수리: 주황색 배지 */
  repair: 'bg-orange-50 text-orange-700 border-orange-200',
  /** 대여: 보라색 배지 */
  rental: 'bg-purple-50 text-purple-700 border-purple-200',
  /** 렌탈 반납: 회색 배지 */
  return_to_vendor: 'bg-gray-50 text-gray-700 border-gray-200',
} as const;

export type CheckoutPurposeStyle = keyof typeof CHECKOUT_PURPOSE_STYLES;
