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
 * UUID 형태인지 간이 검사 (full UUID v4 패턴)
 *
 * 정확한 RFC 4122 검증이 아닌, UI 폴백 용도의 경량 검사.
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 사용자 표시 이름을 해석합니다.
 *
 * 우선순위: name → unknownLabel → '-'
 * UUID는 절대 사용자에게 노출하지 않습니다.
 *
 * @param name - 해석된 사용자 이름 (JOIN 결과)
 * @param fallbackId - (하위 호환용) 이름이 없을 때 참고할 ID — UUID이면 무시됨
 * @param unknownLabel - name/fallbackId 모두 없을 때 사용할 텍스트 (i18n)
 * @returns 표시할 사용자 이름 (UUID가 아닌 문자열)
 *
 * @example
 * resolveDisplayName(plan.authorName, plan.createdBy)
 * resolveDisplayName(checkout.user?.name, checkout.requesterId)
 * resolveDisplayName(plan.authorName, plan.createdBy, t('entity.unknownUser'))
 */
export function resolveDisplayName(
  name: string | null | undefined,
  fallbackId?: string | null,
  unknownLabel?: string
): string {
  if (name) return name;
  // fallbackId가 UUID가 아닌 경우에만 표시 (사번, 이메일 등)
  if (fallbackId && !UUID_PATTERN.test(fallbackId)) return fallbackId;
  return unknownLabel ?? '-';
}
