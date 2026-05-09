import { queryKeys } from './query-config';
import { CheckoutCacheInvalidation } from './cache-invalidation';
import type { ApprovalCategory } from './approvals-api';

/**
 * 승인 관련 TanStack Query 캐시 무효화 키 SSOT
 *
 * 동일한 키 배열이 item-mutations / bulk-mutations 양쪽에 필요하므로
 * 순수 함수로 추출. activeTab에 따라 kpi 쿼리 키가 달라짐.
 *
 * 사용 방법:
 *   invalidateKeys: getApprovalsInvalidationKeys(activeTab)
 *   invalidateKeys: [...getApprovalsInvalidationKeys(activeTab), queryKeys.calibrations.intermediateChecks()]
 */
export function getApprovalsInvalidationKeys(activeTab: ApprovalCategory) {
  return [
    queryKeys.approvals.countsAll,
    queryKeys.approvals.kpi(activeTab),
    ...CheckoutCacheInvalidation.APPROVAL_KEYS,
    queryKeys.equipment.all,
    queryKeys.nonConformances.all,
  ] as const;
}
