import { getApprovalsInvalidationKeys } from '../approvals-invalidation';
import { queryKeys } from '../query-config';
import { CheckoutCacheInvalidation } from '../cache-invalidation';

describe('getApprovalsInvalidationKeys', () => {
  it('countsAll 키를 포함한다', () => {
    const keys = getApprovalsInvalidationKeys('checkout_approval');
    expect(keys).toContainEqual(queryKeys.approvals.countsAll);
  });

  it('activeTab에 맞는 kpi 키를 포함한다', () => {
    const tab = 'calibration_plan_approval' as const;
    const keys = getApprovalsInvalidationKeys(tab);
    expect(keys).toContainEqual(queryKeys.approvals.kpi(tab));
  });

  it('다른 activeTab은 다른 kpi 키를 반환한다', () => {
    const keysA = getApprovalsInvalidationKeys('checkout_approval');
    const keysB = getApprovalsInvalidationKeys('calibration_plan_approval');
    // kpi 키의 마지막 원소(category)가 달라야 함
    const kpiA = keysA.find((k) => Array.isArray(k) && k.includes('kpi'));
    const kpiB = keysB.find((k) => Array.isArray(k) && k.includes('kpi'));
    expect(kpiA).not.toEqual(kpiB);
  });

  it('CheckoutCacheInvalidation.APPROVAL_KEYS를 모두 포함한다', () => {
    const keys = getApprovalsInvalidationKeys('checkout_approval');
    for (const approvalKey of CheckoutCacheInvalidation.APPROVAL_KEYS) {
      expect(keys).toContainEqual(approvalKey);
    }
  });

  it('equipment.all 키를 포함한다', () => {
    const keys = getApprovalsInvalidationKeys('checkout_approval');
    expect(keys).toContainEqual(queryKeys.equipment.all);
  });

  it('nonConformances.all 키를 포함한다', () => {
    const keys = getApprovalsInvalidationKeys('checkout_approval');
    expect(keys).toContainEqual(queryKeys.nonConformances.all);
  });

  it('최소 5개 이상의 키를 반환한다 (countsAll + kpi + APPROVAL_KEYS + equipment + nc)', () => {
    const keys = getApprovalsInvalidationKeys('checkout_approval');
    expect(keys.length).toBeGreaterThanOrEqual(5);
  });
});
