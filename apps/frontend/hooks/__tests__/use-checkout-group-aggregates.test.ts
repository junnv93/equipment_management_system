import { renderHook } from '@testing-library/react';
import { useCheckoutGroupAggregates } from '../use-checkout-group-aggregates';
import {
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
} from '@equipment-management/schemas';

type AnyRecord = Record<string, unknown>;
function makeCheckout(overrides: AnyRecord): AnyRecord {
  return {
    id: 'c1',
    status: CSVal.PENDING,
    purpose: CPVal.CALIBRATION,
    meta: { availableActions: { canApprove: false } },
    ...overrides,
  };
}

function makeDescriptor(overrides: Record<string, unknown> = {}) {
  return {
    availableToCurrentUser: false,
    nextActorRole: undefined,
    nextAction: undefined,
    blockedReason: null,
    ...overrides,
  } as unknown as Record<string, unknown>;
}

describe('useCheckoutGroupAggregates', () => {
  it('pendingCount: PENDING 만 카운트', () => {
    const group: CheckoutGroup = {
      key: 'g1',
      destination: 'A',
      borrower: '갑',
      borrowerId: null,
      checkouts: [
        makeCheckout({ id: 'c1', status: CSVal.PENDING }),
        makeCheckout({ id: 'c2', status: CSVal.OVERDUE }),
        makeCheckout({ id: 'c3', status: CSVal.PENDING }),
        makeCheckout({ id: 'c4', status: CSVal.RETURNED }),
      ],
      statuses: [CSVal.PENDING, CSVal.OVERDUE, CSVal.RETURNED],
      purposes: [CPVal.CALIBRATION],
    } as unknown as Parameters<typeof useCheckoutGroupAggregates>[0]['group'];

    const { result } = renderHook(() =>
      useCheckoutGroupAggregates({ group, descriptorMap: new Map() })
    );
    expect(result.current.pendingCount).toBe(2);
  });

  it('yourTurnCount: descriptor.availableToCurrentUser=true 만 카운트', () => {
    const group: CheckoutGroup = {
      key: 'g1',
      destination: 'A',
      borrower: '갑',
      borrowerId: null,
      checkouts: [
        makeCheckout({ id: 'c1' }),
        makeCheckout({ id: 'c2' }),
        makeCheckout({ id: 'c3' }),
      ],
      statuses: [CSVal.PENDING],
      purposes: [CPVal.CALIBRATION],
    } as unknown as Parameters<typeof useCheckoutGroupAggregates>[0]['group'];

    const descriptorMap = new Map<string, unknown>([
      ['c1', makeDescriptor({ availableToCurrentUser: true })],
      ['c2', makeDescriptor({ availableToCurrentUser: false })],
      ['c3', makeDescriptor({ availableToCurrentUser: true })],
    ]);

    const { result } = renderHook(() => useCheckoutGroupAggregates({ group, descriptorMap }));
    expect(result.current.yourTurnCount).toBe(2);
  });

  it('canApproveBulk: PENDING + canApprove=true 1개 이상이면 true', () => {
    const group: CheckoutGroup = {
      key: 'g1',
      destination: 'A',
      borrower: '갑',
      borrowerId: null,
      checkouts: [
        makeCheckout({
          id: 'c1',
          status: CSVal.PENDING,
          meta: { availableActions: { canApprove: false } },
        }),
        makeCheckout({
          id: 'c2',
          status: CSVal.PENDING,
          meta: { availableActions: { canApprove: true } },
        }),
      ],
      statuses: [CSVal.PENDING],
      purposes: [CPVal.CALIBRATION],
    } as unknown as Parameters<typeof useCheckoutGroupAggregates>[0]['group'];

    const { result } = renderHook(() =>
      useCheckoutGroupAggregates({ group, descriptorMap: new Map() })
    );
    expect(result.current.canApproveBulk).toBe(true);
  });

  it('canApproveBulk: 모두 canApprove=false 이면 false', () => {
    const group: CheckoutGroup = {
      key: 'g1',
      destination: 'A',
      borrower: '갑',
      borrowerId: null,
      checkouts: [
        makeCheckout({
          id: 'c1',
          status: CSVal.PENDING,
          meta: { availableActions: { canApprove: false } },
        }),
      ],
      statuses: [CSVal.PENDING],
      purposes: [CPVal.CALIBRATION],
    } as unknown as Parameters<typeof useCheckoutGroupAggregates>[0]['group'];

    const { result } = renderHook(() =>
      useCheckoutGroupAggregates({ group, descriptorMap: new Map() })
    );
    expect(result.current.canApproveBulk).toBe(false);
  });

  it('isRentalGroup + rentalStatus + rentalDescriptor — RENTAL purpose 포함 시', () => {
    const group: CheckoutGroup = {
      key: 'g1',
      destination: 'A',
      borrower: '갑',
      borrowerId: null,
      checkouts: [
        makeCheckout({ id: 'c1', purpose: CPVal.RENTAL, status: CSVal.CHECKED_OUT }),
        makeCheckout({ id: 'c2', purpose: CPVal.CALIBRATION }),
      ],
      statuses: [CSVal.IN_PROGRESS],
      purposes: [CPVal.RENTAL, CPVal.CALIBRATION],
    } as unknown as Parameters<typeof useCheckoutGroupAggregates>[0]['group'];

    const descriptorMap = new Map<string, unknown>([
      ['c1', makeDescriptor({ availableToCurrentUser: true })],
    ]);

    const { result } = renderHook(() => useCheckoutGroupAggregates({ group, descriptorMap }));
    expect(result.current.isRentalGroup).toBe(true);
    expect(result.current.rentalStatus).toBe(CSVal.CHECKED_OUT);
    expect(result.current.rentalDescriptor?.availableToCurrentUser).toBe(true);
  });

  it('non-rental: rentalStatus 빈 문자열 + rentalDescriptor undefined', () => {
    const group: CheckoutGroup = {
      key: 'g1',
      destination: 'A',
      borrower: '갑',
      borrowerId: null,
      checkouts: [makeCheckout({ id: 'c1', purpose: CPVal.CALIBRATION })],
      statuses: [CSVal.PENDING],
      purposes: [CPVal.CALIBRATION],
    } as unknown as Parameters<typeof useCheckoutGroupAggregates>[0]['group'];

    const { result } = renderHook(() =>
      useCheckoutGroupAggregates({ group, descriptorMap: new Map() })
    );
    expect(result.current.isRentalGroup).toBe(false);
    expect(result.current.rentalStatus).toBe('');
    expect(result.current.rentalDescriptor).toBeUndefined();
  });
});
