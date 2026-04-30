/**
 * use-checkout-card-mutations — useOptimisticMutation 추출 회귀 테스트
 *
 * 핵심 검증:
 * 1. optimisticUpdate가 status 전이를 올바르게 수행 (PENDING → APPROVED / BORROWER_APPROVED)
 * 2. CAS 409 시 detail 캐시 제거 (removeQueries) 보존
 * 3. 일반 에러 시 detail 캐시 미제거
 *
 * 이 테스트가 실패하면 production CheckoutGroupCard에서 stale cache → 무한 409 회귀가 재발한다.
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CheckoutStatusValues as CSVal } from '@equipment-management/schemas';

const isConflictErrorMock = jest.fn();
const getCheckoutMock = jest.fn();
const approveCheckoutMock = jest.fn();
const borrowerApproveCheckoutMock = jest.fn();
const notifyCheckoutActionMock = jest.fn();

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
  toast: jest.fn(),
}));

jest.mock('@/lib/api/error', () => ({
  getErrorMessage: jest.fn((_err: unknown, fallback: string) => fallback),
  isConflictError: (err: unknown) => isConflictErrorMock(err),
}));

jest.mock('@/lib/errors/equipment-errors', () => ({
  EquipmentErrorCode: { VERSION_CONFLICT: 'VC', UNKNOWN_ERROR: 'UE' },
  getLocalizedErrorInfo: jest.fn(() => ({ title: '오류', message: '알 수 없는 오류' })),
}));

jest.mock('@/lib/checkouts/toast-templates', () => ({
  notifyCheckoutAction: (...args: unknown[]) => notifyCheckoutActionMock(...args),
}));

jest.mock('@/lib/api/checkout-api', () => ({
  __esModule: true,
  default: {
    getCheckout: (id: string) => getCheckoutMock(id),
    approveCheckout: (id: string, version: number) => approveCheckoutMock(id, version),
    borrowerApproveCheckout: (id: string, version: number) =>
      borrowerApproveCheckoutMock(id, version),
  },
}));

jest.mock('@/lib/api/cache-invalidation', () => ({
  CheckoutCacheInvalidation: {
    APPROVAL_KEYS: [['checkouts'], ['dashboard']],
  },
}));

import {
  useApproveCheckoutMutation,
  useBorrowerApproveCheckoutMutation,
} from '../use-checkout-card-mutations';

type MinimalCheckout = { id: string; status: string; version: number };

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: 0 }, queries: { retry: 0 } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { Wrapper, queryClient };
}

beforeEach(() => {
  isConflictErrorMock.mockReset().mockReturnValue(false);
  getCheckoutMock.mockReset().mockResolvedValue({ version: 1 });
  approveCheckoutMock.mockReset();
  borrowerApproveCheckoutMock.mockReset();
  notifyCheckoutActionMock.mockReset();
});

describe('useApproveCheckoutMutation', () => {
  it('성공 시 PENDING → APPROVED 상태 전이를 optimistic 캐시에 반영한다', async () => {
    const { Wrapper, queryClient } = makeWrapper();
    approveCheckoutMock.mockResolvedValue({ id: 'c1', status: CSVal.APPROVED, version: 2 });

    const queryKey = ['checkouts', 'view'];
    queryClient.setQueryData(queryKey, {
      data: [{ id: 'c1', status: CSVal.PENDING, version: 1 }] as MinimalCheckout[],
    });

    const { result } = renderHook(() => useApproveCheckoutMutation(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({ id: 'c1', equipmentName: 'Multimeter' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(approveCheckoutMock).toHaveBeenCalledWith('c1', 1);
    expect(notifyCheckoutActionMock).toHaveBeenCalledWith(
      expect.anything(),
      'approve',
      { equipmentName: 'Multimeter' },
      expect.any(Function)
    );
  });

  it('CAS 409 에러 시 detail 캐시를 removeQueries로 즉시 제거한다', async () => {
    const { Wrapper, queryClient } = makeWrapper();
    isConflictErrorMock.mockReturnValue(true);
    approveCheckoutMock.mockRejectedValue(new Error('409 Conflict'));

    queryClient.setQueryData(['checkouts', 'view'], { data: [] as MinimalCheckout[] });
    queryClient.setQueryData(['checkouts', 'resource', 'detail', 'c2'], {
      id: 'c2',
      status: CSVal.PENDING,
    });

    const removeSpy = jest.spyOn(queryClient, 'removeQueries');
    const { result } = renderHook(() => useApproveCheckoutMutation(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({ id: 'c2' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(removeSpy).toHaveBeenCalledWith({
      queryKey: ['checkouts', 'resource', 'detail', 'c2'],
    });
  });

  it('일반(non-CAS) 에러 시 detail 캐시를 제거하지 않는다', async () => {
    const { Wrapper, queryClient } = makeWrapper();
    isConflictErrorMock.mockReturnValue(false);
    approveCheckoutMock.mockRejectedValue(new Error('500 Internal'));

    queryClient.setQueryData(['checkouts', 'view'], { data: [] as MinimalCheckout[] });
    const removeSpy = jest.spyOn(queryClient, 'removeQueries');

    const { result } = renderHook(() => useApproveCheckoutMutation(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({ id: 'c3' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const detailRemoveCalls = removeSpy.mock.calls.filter((call) => {
      const arg = call[0] as { queryKey?: readonly unknown[] } | undefined;
      return arg?.queryKey?.includes('detail');
    });
    expect(detailRemoveCalls).toHaveLength(0);
  });
});

describe('useBorrowerApproveCheckoutMutation', () => {
  it('성공 시 PENDING → BORROWER_APPROVED 상태 전이를 optimistic 캐시에 반영한다', async () => {
    const { Wrapper, queryClient } = makeWrapper();
    borrowerApproveCheckoutMock.mockResolvedValue({
      id: 'c4',
      status: CSVal.BORROWER_APPROVED,
      version: 2,
    });

    queryClient.setQueryData(['checkouts', 'view'], {
      data: [{ id: 'c4', status: CSVal.PENDING, version: 1 }] as MinimalCheckout[],
    });

    const { result } = renderHook(() => useBorrowerApproveCheckoutMutation(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate({ id: 'c4', equipmentName: 'Oscilloscope' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(borrowerApproveCheckoutMock).toHaveBeenCalledWith('c4', 1);
    expect(notifyCheckoutActionMock).toHaveBeenCalledWith(
      expect.anything(),
      'borrower_approve',
      { equipmentName: 'Oscilloscope' },
      expect.any(Function)
    );
  });
});
