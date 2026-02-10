/**
 * SINGLE SOURCE OF TRUTH: 반출 목적(Purpose) 배지 스타일
 *
 * CheckoutDetailClient, CheckoutGroupCard 등에서 사용하는
 * 목적별 배지 색상 스타일을 중앙 관리합니다.
 *
 * @example
 * ```tsx
 * import { CHECKOUT_PURPOSE_STYLES } from '@equipment-management/shared-constants';
 *
 * <Badge variant="outline" className={CHECKOUT_PURPOSE_STYLES.calibration}>
 *   교정
 * </Badge>
 * ```
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
