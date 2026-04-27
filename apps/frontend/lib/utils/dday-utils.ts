/**
 * D-day 계산 유틸리티 (SSOT)
 *
 * 반납 예정일 기준 남은 일수 계산. 음수 = 기한 초과.
 * CheckoutGroupCard / DdayBadge / CheckoutDetailClient 공동 사용.
 */

/**
 * expectedReturnDate(ISO 8601 문자열) 기준 남은 일수 계산.
 * 오늘 기준 자정으로 비교. 음수 = 초과.
 */
export function calculateDaysRemaining(expectedReturnDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const returnDate = new Date(expectedReturnDate);
  returnDate.setHours(0, 0, 0, 0);
  return Math.round((returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
