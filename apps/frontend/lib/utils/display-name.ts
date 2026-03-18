/**
 * 사용자 표시 이름 해석 유틸리티
 *
 * 백엔드 응답에서 사용자 정보가 다양한 형태로 제공됩니다:
 * - CalibrationPlan: { createdBy: UUID, authorName: string | null }
 * - Checkout: { requesterId: UUID, user: { name: string } | null }
 * - Equipment Approval: { requestedBy: UUID, requester: { name: string } | null }
 *
 * 이 유틸리티는 표시 이름 해석의 우선순위를 SSOT로 관리합니다.
 *
 * 우선순위: 이름 → UUID 앞 8자리 → fallback 텍스트
 */

/**
 * 사용자 표시 이름을 해석합니다.
 *
 * @param name - 해석된 사용자 이름 (JOIN 결과)
 * @param fallbackId - 이름이 없을 때 사용할 UUID 또는 ID
 * @param unknownLabel - ID도 없을 때 사용할 기본 텍스트 (i18n)
 * @returns 표시할 사용자 이름
 *
 * @example
 * // 기본 사용 — CalibrationPlan
 * resolveDisplayName(plan.authorName, plan.createdBy)
 *
 * // Checkout
 * resolveDisplayName(checkout.user?.name, checkout.requesterId)
 *
 * // i18n 폴백
 * resolveDisplayName(plan.authorName, plan.createdBy, t('entity.unknownUser'))
 */
export function resolveDisplayName(
  name: string | null | undefined,
  fallbackId?: string | null,
  unknownLabel?: string
): string {
  if (name) return name;
  if (fallbackId) return fallbackId;
  return unknownLabel ?? '-';
}
