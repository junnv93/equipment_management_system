/**
 * use-non-conformance-mutations — large-component-refactor (2d94c9b4) 회귀 차단
 *
 * 핵심 검증:
 * 1. import 정합 — 파일 누락 회귀 즉시 catch
 * 2. 4 mutation 객체 반환 (updateMutation / saveMutation / closeMutation / rejectMutation)
 * 3. onSaveSuccess / onCloseSuccess / onRejectSuccess callback 호출
 * 4. fetchCasVersion → nonConformancesApi.getNonConformance(ncId) 경유
 * 5. updateMutation: status=CORRECTED 시 correctionDate 자동 채움
 * 6. saveMutation: lists invalidate
 * 7. closeMutation/rejectMutation: invalidateAfterStatusChange(queryClient, ncId, equipmentId)
 *
 * 이 spec이 실패하면 NCDetailClient에서 hook import 실패 / silent contract drift 회귀.
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NonConformanceStatusValues as NCVal } from '@equipment-management/schemas';

const getNonConformanceMock = jest.fn();
const updateNonConformanceMock = jest.fn();
const closeNonConformanceMock = jest.fn();
const rejectCorrectionMock = jest.fn();
const invalidateAfterStatusChangeMock = jest.fn();
const mapNonConformanceErrorToToastMock = jest.fn();

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('@/lib/api/non-conformances-api', () => ({
  __esModule: true,
  default: {
    getNonConformance: (id: string) => getNonConformanceMock(id),
    updateNonConformance: (id: string, data: unknown) => updateNonConformanceMock(id, data),
    closeNonConformance: (id: string, data: unknown) => closeNonConformanceMock(id, data),
    rejectCorrection: (id: string, data: unknown) => rejectCorrectionMock(id, data),
  },
}));

jest.mock('@/lib/api/cache-invalidation', () => ({
  NonConformanceCacheInvalidation: {
    invalidateAfterStatusChange: (
      queryClient: unknown,
      ncId: string,
      equipmentId: string | undefined
    ) => invalidateAfterStatusChangeMock(queryClient, ncId, equipmentId),
  },
}));

jest.mock('@/lib/errors/non-conformance-errors', () => ({
  mapNonConformanceErrorToToast: (...args: unknown[]) => {
    mapNonConformanceErrorToToastMock(...args);
    return { title: 'mapped-title', description: 'mapped-desc' };
  },
}));

import { useNonConformanceMutations } from '../use-non-conformance-mutations';

const NC_ID = 'nc-uuid-fixture';
const EQUIPMENT_ID = 'equip-uuid-fixture';

function makeWrapper(): {
  Wrapper: React.FC<{ children: React.ReactNode }>;
  queryClient: QueryClient;
} {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: 0 }, queries: { retry: 0 } },
  });
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { Wrapper, queryClient };
}

beforeEach(() => {
  getNonConformanceMock.mockReset().mockResolvedValue({ version: 7 });
  updateNonConformanceMock.mockReset();
  closeNonConformanceMock.mockReset();
  rejectCorrectionMock.mockReset();
  invalidateAfterStatusChangeMock.mockReset();
  mapNonConformanceErrorToToastMock.mockReset();
});

describe('useNonConformanceMutations', () => {
  it('returns 4 mutation objects (import + shape contract)', () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useNonConformanceMutations(NC_ID), { wrapper: Wrapper });

    expect(result.current.updateMutation).toBeDefined();
    expect(result.current.saveMutation).toBeDefined();
    expect(result.current.closeMutation).toBeDefined();
    expect(result.current.rejectMutation).toBeDefined();
  });

  it('updateMutation: fetches CAS version + auto-fills correctionDate when status=CORRECTED', async () => {
    updateNonConformanceMock.mockResolvedValue({ id: NC_ID, equipmentId: EQUIPMENT_ID });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useNonConformanceMutations(NC_ID), { wrapper: Wrapper });

    await act(async () => {
      await result.current.updateMutation.mutateAsync({
        status: NCVal.CORRECTED,
        correctionContent: 'fix applied',
      });
    });

    expect(getNonConformanceMock).toHaveBeenCalledWith(NC_ID);
    expect(updateNonConformanceMock).toHaveBeenCalledTimes(1);
    const [calledId, calledPayload] = updateNonConformanceMock.mock.calls[0];
    expect(calledId).toBe(NC_ID);
    expect(calledPayload.version).toBe(7);
    expect(calledPayload.status).toBe(NCVal.CORRECTED);
    expect(calledPayload.correctionContent).toBe('fix applied');
    expect(calledPayload.correctionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await waitFor(() =>
      expect(invalidateAfterStatusChangeMock).toHaveBeenCalledWith(
        expect.anything(),
        NC_ID,
        EQUIPMENT_ID
      )
    );
  });

  it('saveMutation: invalidates lists + invokes onSaveSuccess callback', async () => {
    updateNonConformanceMock.mockResolvedValue({ id: NC_ID, equipmentId: EQUIPMENT_ID });
    const onSaveSuccess = jest.fn();
    const { Wrapper, queryClient } = makeWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useNonConformanceMutations(NC_ID, { onSaveSuccess }), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.saveMutation.mutateAsync({ correctionContent: 'in progress' });
    });

    await waitFor(() => expect(onSaveSuccess).toHaveBeenCalledTimes(1));
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('closeMutation: passes closureNotes + invokes onCloseSuccess', async () => {
    closeNonConformanceMock.mockResolvedValue({ id: NC_ID, equipmentId: EQUIPMENT_ID });
    const onCloseSuccess = jest.fn();
    const { Wrapper } = makeWrapper();

    const { result } = renderHook(() => useNonConformanceMutations(NC_ID, { onCloseSuccess }), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.closeMutation.mutateAsync({ closureNotes: 'verified' });
    });

    expect(closeNonConformanceMock).toHaveBeenCalledWith(NC_ID, {
      version: 7,
      closureNotes: 'verified',
    });
    await waitFor(() => expect(onCloseSuccess).toHaveBeenCalledTimes(1));
    expect(invalidateAfterStatusChangeMock).toHaveBeenCalledWith(
      expect.anything(),
      NC_ID,
      EQUIPMENT_ID
    );
  });

  it('rejectMutation: passes rejectionReason + invokes onRejectSuccess + mapError on failure', async () => {
    rejectCorrectionMock.mockResolvedValue({ id: NC_ID, equipmentId: EQUIPMENT_ID });
    const onRejectSuccess = jest.fn();
    const { Wrapper } = makeWrapper();

    const { result } = renderHook(() => useNonConformanceMutations(NC_ID, { onRejectSuccess }), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.rejectMutation.mutateAsync({ rejectionReason: 'not enough evidence' });
    });

    expect(rejectCorrectionMock).toHaveBeenCalledWith(NC_ID, {
      version: 7,
      rejectionReason: 'not enough evidence',
    });
    await waitFor(() => expect(onRejectSuccess).toHaveBeenCalledTimes(1));
    expect(invalidateAfterStatusChangeMock).toHaveBeenCalledWith(
      expect.anything(),
      NC_ID,
      EQUIPMENT_ID
    );

    // Error path: mapNonConformanceErrorToToast must be invoked
    rejectCorrectionMock.mockRejectedValueOnce(new Error('domain error'));
    await act(async () => {
      try {
        await result.current.rejectMutation.mutateAsync({ rejectionReason: 'second attempt' });
      } catch {
        /* expected */
      }
    });
    await waitFor(() => expect(mapNonConformanceErrorToToastMock).toHaveBeenCalled());
  });
});
