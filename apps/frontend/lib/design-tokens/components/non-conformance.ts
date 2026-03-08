/**
 * Non-Conformance Component Tokens
 *
 * 도메인 상태 → 시멘틱 색상 매핑 레이어 (SSOT).
 * 실제 색상 스타일은 brand.ts의 getSemanticBadgeClasses() / getSemanticContainerClasses()를 사용.
 */

import type { SemanticColorKey } from '../brand';
import type { NonConformanceStatus } from '@equipment-management/schemas';

/** NC 상태 → 시멘틱 색상 매핑 (SSOT) */
const NC_STATUS_SEMANTIC_MAP: Record<NonConformanceStatus, SemanticColorKey> = {
  open: 'critical',
  analyzing: 'warning',
  corrected: 'info',
  closed: 'ok',
};

/**
 * 부적합 상태 → 시멘틱 색상 키 변환
 *
 * @example
 * // 배지
 * getSemanticBadgeClasses(ncStatusToSemantic(nc.status))
 * // 컨테이너
 * getSemanticContainerClasses(ncStatusToSemantic(nc.status))
 */
export function ncStatusToSemantic(status: string): SemanticColorKey {
  return NC_STATUS_SEMANTIC_MAP[status as NonConformanceStatus] ?? 'neutral';
}
