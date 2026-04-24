import { CHECKOUT_STATUS_VALUES, type CheckoutStatus } from '@equipment-management/schemas';
import { isCheckoutExportable, NON_EXPORTABLE_CHECKOUT_STATUSES } from '../checkout-exportability';

// 신규 CheckoutStatus가 추가되면 이 테스트가 깨져 명시적 정책 결정을 강제한다.
const EXPORTABLE_STATUSES: CheckoutStatus[] = CHECKOUT_STATUS_VALUES.filter(
  (s) => !NON_EXPORTABLE_CHECKOUT_STATUSES.includes(s as CheckoutStatus)
) as CheckoutStatus[];

describe('isCheckoutExportable()', () => {
  it('pending → false (반출 승인 없음, 확인서 데이터 미존재)', () => {
    expect(isCheckoutExportable('pending')).toBe(false);
  });

  it('rejected → false (반출 거절, 확인서 데이터 미존재)', () => {
    expect(isCheckoutExportable('rejected')).toBe(false);
  });

  it('canceled → false (반출 취소, 확인서 export 불필요)', () => {
    expect(isCheckoutExportable('canceled')).toBe(false);
  });

  it.each(EXPORTABLE_STATUSES)('"%s" → true (반출 사실 존재, 확인서 export 가능)', (status) => {
    expect(isCheckoutExportable(status)).toBe(true);
  });

  it('전체 상태 매트릭스: pending/borrower_approved/rejected/canceled만 false', () => {
    const results = CHECKOUT_STATUS_VALUES.map((s) => ({
      status: s,
      exportable: isCheckoutExportable(s as CheckoutStatus),
    }));
    const nonExportable = results.filter((r) => !r.exportable).map((r) => r.status);
    expect(nonExportable).toEqual(['pending', 'borrower_approved', 'rejected', 'canceled']);
  });
});

describe('NON_EXPORTABLE_CHECKOUT_STATUSES', () => {
  it('pending, borrower_approved, rejected, canceled 포함', () => {
    expect(NON_EXPORTABLE_CHECKOUT_STATUSES).toEqual([
      'pending',
      'borrower_approved',
      'rejected',
      'canceled',
    ]);
  });

  it('CheckoutStatus 중 10개는 제외되지 않음', () => {
    const totalStatuses = CHECKOUT_STATUS_VALUES.length;
    expect(totalStatuses - NON_EXPORTABLE_CHECKOUT_STATUSES.length).toBe(10);
  });
});
