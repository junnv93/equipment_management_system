/**
 * use-approvals-item-mutations — 단건 승인/반려 mutation 훅 테스트
 *
 * 검증 범위:
 * 1. handleApprove — commentRequired false: 즉시 approveMutation 호출
 * 2. handleApprove — commentRequired true: approveCommentItem 설정 (dialog 트리거)
 * 3. handleApproveWithComment — comment 미입력 시 noop
 * 4. handleCloseCommentDialog — 상태 초기화
 * 5. 단건 approve 성공 → onCompleteTransition + onApproveSuccessExtra 호출
 * 6. 단건 approve 실패 → onCancelProcessing 호출
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Mocks ─────────────────────────────────────────────────────────────────

const approveMock = jest.fn();
const rejectMock = jest.fn();

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
  toast: jest.fn(),
}));

jest.mock('@/lib/i18n/use-enum-labels', () => ({
  useSiteLabels: () => ({}),
}));

jest.mock('@/lib/utils/approval-summary-utils', () => ({
  getLocalizedSummary: () => '장비 반출 (calibration)',
}));

jest.mock('@/lib/api/cache-invalidation', () => ({
  CheckoutCacheInvalidation: { APPROVAL_KEYS: [['checkouts'], ['dashboard']] },
}));

jest.mock('@/lib/api/query-config', () => ({
  queryKeys: {
    approvals: {
      list: (tab: string) => ['approvals', 'list', tab],
      counts: (role: string) => ['approvals', 'counts', role],
      kpi: (tab: string) => ['approvals', 'kpi', tab],
    },
    equipment: { all: ['equipment'] },
    nonConformances: { all: ['nonConformances'] },
    calibrations: { intermediateChecks: () => ['calibrations', 'intermediateChecks'] },
  },
}));

jest.mock('@/lib/api/approvals-api', () => ({
  TAB_META: {
    equipment: { commentRequired: false, commentDialogTitleKey: false },
    calibration_plans: { commentRequired: true, commentDialogTitleKey: true },
  },
}));

import { useApprovalsItemMutations } from '../use-approvals-item-mutations';
import type { ApprovalItem } from '@/lib/api/approvals-api';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeItem(overrides?: Partial<ApprovalItem>): ApprovalItem {
  return {
    id: 'item-1',
    category: 'equipment' as ApprovalItem['category'],
    requestedAt: new Date().toISOString(),
    status: 'pending' as ApprovalItem['status'],
    originalData: {} as ApprovalItem['originalData'],
    details: null,
    ...overrides,
  } as ApprovalItem;
}

function makeApprovalsApi() {
  return {
    approve: approveMock,
    reject: rejectMock,
    getPendingItems: jest.fn(),
    getPendingCounts: jest.fn(),
    getCategories: jest.fn(),
    getKpi: jest.fn(),
    getAnalytics: jest.fn(),
    getDelegations: jest.fn(),
    getEmptyCounts: jest.fn(),
    bulkApprove: jest.fn(),
    bulkReject: jest.fn(),
    createDelegation: jest.fn(),
    revokeDelegation: jest.fn(),
  };
}

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: 0 }, queries: { retry: 0 } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { Wrapper, queryClient };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('useApprovalsItemMutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    approveMock.mockResolvedValue(undefined);
    rejectMock.mockResolvedValue(undefined);
  });

  it('handleApprove — commentRequired=false 시 즉시 onStartProcessing + mutate 호출', async () => {
    const { Wrapper } = makeWrapper();
    const onStartProcessing = jest.fn();
    const onCompleteTransition = jest.fn();
    const onCancelProcessing = jest.fn();
    const approvalsApi = makeApprovalsApi();

    const { result } = renderHook(
      () =>
        useApprovalsItemMutations({
          activeTab: 'equipment' as ApprovalItem['category'],
          userRole: 'test_engineer',
          approvalsApi: approvalsApi as ReturnType<
            typeof import('@/lib/api/hooks/use-approvals-api').useApprovalsApi
          >,
          onStartProcessing,
          onCompleteTransition,
          onCancelProcessing,
        }),
      { wrapper: Wrapper }
    );

    const item = makeItem({ category: 'equipment' as ApprovalItem['category'] });

    act(() => {
      result.current.handleApprove(item);
    });

    expect(onStartProcessing).toHaveBeenCalledWith('item-1');

    await waitFor(() => {
      expect(approveMock).toHaveBeenCalled();
    });
  });

  it('handleApprove — commentRequired=true 시 approveCommentItem 설정 (onStartProcessing 미호출)', () => {
    const { Wrapper } = makeWrapper();
    const onStartProcessing = jest.fn();
    const approvalsApi = makeApprovalsApi();

    const { result } = renderHook(
      () =>
        useApprovalsItemMutations({
          activeTab: 'calibration_plans' as ApprovalItem['category'],
          userRole: 'test_engineer',
          approvalsApi: approvalsApi as ReturnType<
            typeof import('@/lib/api/hooks/use-approvals-api').useApprovalsApi
          >,
          onStartProcessing,
          onCompleteTransition: jest.fn(),
          onCancelProcessing: jest.fn(),
        }),
      { wrapper: Wrapper }
    );

    const item = makeItem({ category: 'calibration_plans' as ApprovalItem['category'] });

    act(() => {
      result.current.handleApprove(item);
    });

    expect(onStartProcessing).not.toHaveBeenCalled();
    expect(result.current.approveCommentItem).toEqual(item);
  });

  it('handleApproveWithComment — comment 빈 문자열 시 noop', async () => {
    const { Wrapper } = makeWrapper();
    const approvalsApi = makeApprovalsApi();
    const { result } = renderHook(
      () =>
        useApprovalsItemMutations({
          activeTab: 'equipment' as ApprovalItem['category'],
          userRole: 'test_engineer',
          approvalsApi: approvalsApi as ReturnType<
            typeof import('@/lib/api/hooks/use-approvals-api').useApprovalsApi
          >,
          onStartProcessing: jest.fn(),
          onCompleteTransition: jest.fn(),
          onCancelProcessing: jest.fn(),
        }),
      { wrapper: Wrapper }
    );

    // approveCommentItem이 null이므로 noop
    act(() => {
      result.current.handleApproveWithComment();
    });

    expect(approveMock).not.toHaveBeenCalled();
  });

  it('handleCloseCommentDialog — approveCommentItem + comment 초기화', () => {
    const { Wrapper } = makeWrapper();
    const approvalsApi = makeApprovalsApi();
    const { result } = renderHook(
      () =>
        useApprovalsItemMutations({
          activeTab: 'calibration_plans' as ApprovalItem['category'],
          userRole: 'test_engineer',
          approvalsApi: approvalsApi as ReturnType<
            typeof import('@/lib/api/hooks/use-approvals-api').useApprovalsApi
          >,
          onStartProcessing: jest.fn(),
          onCompleteTransition: jest.fn(),
          onCancelProcessing: jest.fn(),
        }),
      { wrapper: Wrapper }
    );

    const item = makeItem({ category: 'calibration_plans' as ApprovalItem['category'] });

    act(() => {
      result.current.handleApprove(item);
    });
    expect(result.current.approveCommentItem).toEqual(item);

    act(() => {
      result.current.handleCloseCommentDialog();
    });
    expect(result.current.approveCommentItem).toBeNull();
    expect(result.current.approveComment).toBe('');
  });

  it('승인 성공 → onCompleteTransition("success") + onApproveSuccessExtra 호출', async () => {
    const { Wrapper } = makeWrapper();
    const onCompleteTransition = jest.fn();
    const onApproveSuccessExtra = jest.fn();
    const approvalsApi = makeApprovalsApi();

    const { result } = renderHook(
      () =>
        useApprovalsItemMutations({
          activeTab: 'equipment' as ApprovalItem['category'],
          userRole: 'test_engineer',
          approvalsApi: approvalsApi as ReturnType<
            typeof import('@/lib/api/hooks/use-approvals-api').useApprovalsApi
          >,
          onStartProcessing: jest.fn(),
          onCompleteTransition,
          onCancelProcessing: jest.fn(),
          onApproveSuccessExtra,
        }),
      { wrapper: Wrapper }
    );

    const item = makeItem();

    act(() => {
      result.current.handleApprove(item);
    });

    await waitFor(() => {
      expect(onCompleteTransition).toHaveBeenCalledWith('item-1', 'success');
    });
    expect(onApproveSuccessExtra).toHaveBeenCalled();
  });

  it('승인 실패 → onCancelProcessing 호출', async () => {
    approveMock.mockRejectedValueOnce(new Error('network error'));
    const { Wrapper } = makeWrapper();
    const onCancelProcessing = jest.fn();
    const approvalsApi = makeApprovalsApi();

    const { result } = renderHook(
      () =>
        useApprovalsItemMutations({
          activeTab: 'equipment' as ApprovalItem['category'],
          userRole: 'test_engineer',
          approvalsApi: approvalsApi as ReturnType<
            typeof import('@/lib/api/hooks/use-approvals-api').useApprovalsApi
          >,
          onStartProcessing: jest.fn(),
          onCompleteTransition: jest.fn(),
          onCancelProcessing,
        }),
      { wrapper: Wrapper }
    );

    const item = makeItem();

    act(() => {
      result.current.handleApprove(item);
    });

    await waitFor(() => {
      expect(onCancelProcessing).toHaveBeenCalledWith('item-1');
    });
  });
});
