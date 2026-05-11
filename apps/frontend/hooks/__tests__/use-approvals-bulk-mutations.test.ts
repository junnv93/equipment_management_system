/**
 * use-approvals-bulk-mutations — 일괄 승인/반려 mutation 훅 테스트
 *
 * 검증 범위:
 * 1. handleBulkApprove — selection 0건 시 noop
 * 2. handleBulkApprove — commentRequired=false: 즉시 bulkApproveMutation 호출
 * 3. handleBulkApprove — commentRequired=true: isBulkApproveCommentOpen=true (dialog 트리거)
 * 4. handleCloseBulkCommentDialog — isBulkApproveCommentOpen=false + comment 초기화
 * 5. 일괄 승인 성공 → onCompleteTransitionMany("success") + selection.clear
 * 6. 일괄 승인 실패 → onCancelProcessingMany 호출
 * 7. handleBulkReject — selection 0건 시 noop
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Mocks ─────────────────────────────────────────────────────────────────

const bulkApproveMock = jest.fn();
const bulkRejectMock = jest.fn();
const toastMock = jest.fn();

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

jest.mock('@/lib/api/cache-invalidation', () => ({
  CheckoutCacheInvalidation: { APPROVAL_KEYS: [['checkouts'], ['dashboard']] },
}));

// undoWindowMs 5초 지연 우회 — 테스트는 mutate 즉시 호출 검증 (production 흐름 동일성은
// CheckoutBulkActionBar 통합 spec / e2e 에서 별도 검증).
jest.mock('@/lib/checkouts/undo-constants', () => ({
  UNDO_TOAST_DURATION_MS: 0,
}));

// useBulkUndoToast 의 toast/invalidateQueries 부수효과는 본 hook 책임 외 — mock no-op.
jest.mock('@/hooks/use-bulk-undo-toast', () => ({
  useBulkUndoToast: () => ({
    showBulkApproveUndoToast: jest.fn(),
    showBulkRejectUndoToast: jest.fn(),
  }),
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
    equipment: { commentRequired: false },
    calibration_plans: { commentRequired: true },
  },
}));

import { useApprovalsBulkMutations } from '../use-approvals-bulk-mutations';
import type { ApprovalItem } from '@/lib/api/approvals-api';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeApprovalsApi() {
  return {
    bulkApprove: bulkApproveMock,
    bulkReject: bulkRejectMock,
    approve: jest.fn(),
    reject: jest.fn(),
    getPendingItems: jest.fn(),
    getPendingCounts: jest.fn(),
    getCategories: jest.fn(),
    getKpi: jest.fn(),
    getAnalytics: jest.fn(),
    getDelegations: jest.fn(),
    getEmptyCounts: jest.fn(),
    createDelegation: jest.fn(),
    revokeDelegation: jest.fn(),
  };
}

function makeSelection(ids: string[] = []) {
  return {
    count: ids.length,
    selected: new Set(ids) as ReadonlySet<string>,
    clear: jest.fn(),
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

describe('useApprovalsBulkMutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bulkApproveMock.mockResolvedValue({ success: ['id-1', 'id-2'], failed: [] });
    bulkRejectMock.mockResolvedValue({ success: ['id-1', 'id-2'], failed: [] });
  });

  it('handleBulkApprove — selection 0건 시 noop (onStartProcessingMany 미호출)', async () => {
    const { Wrapper } = makeWrapper();
    const onStartProcessingMany = jest.fn();
    const approvalsApi = makeApprovalsApi();

    const { result } = renderHook(
      () =>
        useApprovalsBulkMutations({
          activeTab: 'equipment' as ApprovalItem['category'],
          userRole: 'test_engineer',
          approvalsApi: approvalsApi as ReturnType<
            typeof import('@/lib/api/hooks/use-approvals-api').useApprovalsApi
          >,
          selection: makeSelection([]),
          onStartProcessingMany,
          onCompleteTransitionMany: jest.fn(),
          onCancelProcessingMany: jest.fn(),
        }),
      { wrapper: Wrapper }
    );

    await act(async () => {
      await result.current.handleBulkApprove();
    });

    expect(onStartProcessingMany).not.toHaveBeenCalled();
    expect(bulkApproveMock).not.toHaveBeenCalled();
  });

  it('handleBulkApprove — commentRequired=false 시 즉시 bulkApprove 호출', async () => {
    const { Wrapper } = makeWrapper();
    const onStartProcessingMany = jest.fn();
    const approvalsApi = makeApprovalsApi();

    const { result } = renderHook(
      () =>
        useApprovalsBulkMutations({
          activeTab: 'equipment' as ApprovalItem['category'],
          userRole: 'test_engineer',
          approvalsApi: approvalsApi as ReturnType<
            typeof import('@/lib/api/hooks/use-approvals-api').useApprovalsApi
          >,
          selection: makeSelection(['id-1', 'id-2']),
          onStartProcessingMany,
          onCompleteTransitionMany: jest.fn(),
          onCancelProcessingMany: jest.fn(),
        }),
      { wrapper: Wrapper }
    );

    await act(async () => {
      await result.current.handleBulkApprove();
    });

    expect(onStartProcessingMany).toHaveBeenCalledWith(['id-1', 'id-2']);
    await waitFor(() => {
      expect(bulkApproveMock).toHaveBeenCalledWith('equipment', ['id-1', 'id-2'], undefined);
    });
  });

  it('handleBulkApprove — commentRequired=true 시 isBulkApproveCommentOpen=true', async () => {
    const { Wrapper } = makeWrapper();
    const approvalsApi = makeApprovalsApi();

    const { result } = renderHook(
      () =>
        useApprovalsBulkMutations({
          activeTab: 'calibration_plans' as ApprovalItem['category'],
          userRole: 'test_engineer',
          approvalsApi: approvalsApi as ReturnType<
            typeof import('@/lib/api/hooks/use-approvals-api').useApprovalsApi
          >,
          selection: makeSelection(['id-1']),
          onStartProcessingMany: jest.fn(),
          onCompleteTransitionMany: jest.fn(),
          onCancelProcessingMany: jest.fn(),
        }),
      { wrapper: Wrapper }
    );

    expect(result.current.isBulkApproveCommentOpen).toBe(false);

    await act(async () => {
      await result.current.handleBulkApprove();
    });

    expect(result.current.isBulkApproveCommentOpen).toBe(true);
    expect(bulkApproveMock).not.toHaveBeenCalled();
  });

  it('handleCloseBulkCommentDialog — 상태 초기화', async () => {
    const { Wrapper } = makeWrapper();
    const approvalsApi = makeApprovalsApi();

    const { result } = renderHook(
      () =>
        useApprovalsBulkMutations({
          activeTab: 'calibration_plans' as ApprovalItem['category'],
          userRole: 'test_engineer',
          approvalsApi: approvalsApi as ReturnType<
            typeof import('@/lib/api/hooks/use-approvals-api').useApprovalsApi
          >,
          selection: makeSelection(['id-1']),
          onStartProcessingMany: jest.fn(),
          onCompleteTransitionMany: jest.fn(),
          onCancelProcessingMany: jest.fn(),
        }),
      { wrapper: Wrapper }
    );

    await act(async () => {
      await result.current.handleBulkApprove();
    });
    expect(result.current.isBulkApproveCommentOpen).toBe(true);

    act(() => {
      result.current.handleCloseBulkCommentDialog();
    });
    expect(result.current.isBulkApproveCommentOpen).toBe(false);
    expect(result.current.bulkApproveComment).toBe('');
  });

  it('일괄 승인 성공 → onCompleteTransitionMany("success") + selection.clear', async () => {
    const { Wrapper } = makeWrapper();
    const onCompleteTransitionMany = jest.fn();
    const selection = makeSelection(['id-1', 'id-2']);
    const approvalsApi = makeApprovalsApi();

    const { result } = renderHook(
      () =>
        useApprovalsBulkMutations({
          activeTab: 'equipment' as ApprovalItem['category'],
          userRole: 'test_engineer',
          approvalsApi: approvalsApi as ReturnType<
            typeof import('@/lib/api/hooks/use-approvals-api').useApprovalsApi
          >,
          selection,
          onStartProcessingMany: jest.fn(),
          onCompleteTransitionMany,
          onCancelProcessingMany: jest.fn(),
        }),
      { wrapper: Wrapper }
    );

    await act(async () => {
      await result.current.handleBulkApprove();
    });

    await waitFor(() => {
      expect(onCompleteTransitionMany).toHaveBeenCalledWith(['id-1', 'id-2'], 'success');
    });
    expect(selection.clear).toHaveBeenCalled();
  });

  it('일괄 승인 실패 → onCancelProcessingMany 호출', async () => {
    bulkApproveMock.mockRejectedValueOnce(new Error('서버 오류'));
    const { Wrapper } = makeWrapper();
    const onCancelProcessingMany = jest.fn();
    const approvalsApi = makeApprovalsApi();

    const { result } = renderHook(
      () =>
        useApprovalsBulkMutations({
          activeTab: 'equipment' as ApprovalItem['category'],
          userRole: 'test_engineer',
          approvalsApi: approvalsApi as ReturnType<
            typeof import('@/lib/api/hooks/use-approvals-api').useApprovalsApi
          >,
          selection: makeSelection(['id-1']),
          onStartProcessingMany: jest.fn(),
          onCompleteTransitionMany: jest.fn(),
          onCancelProcessingMany,
        }),
      { wrapper: Wrapper }
    );

    await act(async () => {
      await result.current.handleBulkApprove().catch(() => {});
    });

    await waitFor(() => {
      expect(onCancelProcessingMany).toHaveBeenCalledWith(['id-1']);
    });
  });

  it('handleBulkReject — selection 0건 시 noop', async () => {
    const { Wrapper } = makeWrapper();
    const onStartProcessingMany = jest.fn();
    const approvalsApi = makeApprovalsApi();

    const { result } = renderHook(
      () =>
        useApprovalsBulkMutations({
          activeTab: 'equipment' as ApprovalItem['category'],
          userRole: 'test_engineer',
          approvalsApi: approvalsApi as ReturnType<
            typeof import('@/lib/api/hooks/use-approvals-api').useApprovalsApi
          >,
          selection: makeSelection([]),
          onStartProcessingMany,
          onCompleteTransitionMany: jest.fn(),
          onCancelProcessingMany: jest.fn(),
        }),
      { wrapper: Wrapper }
    );

    await act(async () => {
      await result.current.handleBulkReject('이유');
    });

    expect(onStartProcessingMany).not.toHaveBeenCalled();
    expect(bulkRejectMock).not.toHaveBeenCalled();
  });
});
