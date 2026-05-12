'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/components/ui/use-toast';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { savedViewsApi, type SavedView } from '@/lib/api/saved-views-api';
import { queryKeys } from '@/lib/api/query-config';
import { mapSavedViewErrorToToast } from '@/lib/errors/saved-views-errors';
import {
  MAX_VIEWS,
  clearLocalStorageBackup,
  readLocalStorageBackup,
} from '@/lib/checkouts/saved-views';

export { MAX_VIEWS };
export type { SavedView };

const CHECKOUTS_MODULE = 'checkouts' as const;
const SAVED_VIEWS_LIST_KEY = queryKeys.savedViews.list(CHECKOUTS_MODULE);
const INVALIDATE_KEYS = [queryKeys.savedViews.all] as const;

/**
 * 커스텀 Saved Views 관리 훅 — 서버 도메인 backed (S-7 sprint).
 *
 * SSOT:
 * - mutationFn → `savedViewsApi.*` (axios + API_ENDPOINTS SSOT)
 * - invalidateKeys → `queryKeys.savedViews.all` prefix 1개 (memory: useOptimisticMutation 단일 queryKey 한계)
 * - setQueryData 금지 — onSettled invalidateQueries prefix 로 100~300ms 후 재동기화
 *
 * 호출자(`SavedViewsToolbar`) 인터페이스 호환 보존:
 *   { views, addView, removeView, moveView, isLoading, importFromLocalStorage }
 *
 * CAS 정합: update mutation 은 latest version 을 view row 에서 추출해 동봉.
 */
export function useSavedViews() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useTranslations('checkouts.savedViews');
  const tErrors = useTranslations('errors');

  // ── Read ──────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: SAVED_VIEWS_LIST_KEY,
    queryFn: () => savedViewsApi.list(CHECKOUTS_MODULE),
    staleTime: 30_000,
  });

  const views: SavedView[] = useMemo(() => data ?? [], [data]);

  // ── Mutations ─────────────────────────────────────────────────

  const createMutation = useOptimisticMutation<
    SavedView,
    { name: string; params: string },
    SavedView[]
  >({
    mutationFn: ({ name, params }) =>
      savedViewsApi.create({
        name,
        params,
        module: CHECKOUTS_MODULE,
        scope: 'PRIVATE',
      }),
    queryKey: SAVED_VIEWS_LIST_KEY,
    optimisticUpdate: (old, input) => {
      const next = [...(old ?? [])];
      next.push({
        id: `optimistic-${Date.now()}`,
        name: input.name,
        params: input.params,
        ownerId: 'optimistic',
        module: CHECKOUTS_MODULE,
        scope: 'PRIVATE',
        teamId: null,
        sortOrder: next.length,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return next;
    },
    invalidateKeys: INVALIDATE_KEYS,
  });

  const deleteMutation = useOptimisticMutation<void, { id: string }, SavedView[]>({
    mutationFn: ({ id }) => savedViewsApi.remove(id),
    queryKey: SAVED_VIEWS_LIST_KEY,
    optimisticUpdate: (old, { id }) => (old ?? []).filter((v) => v.id !== id),
    invalidateKeys: INVALIDATE_KEYS,
  });

  const reorderMutation = useOptimisticMutation<
    void,
    { orders: Array<{ id: string; sortOrder: number }> },
    SavedView[]
  >({
    mutationFn: ({ orders }) => savedViewsApi.reorder({ module: CHECKOUTS_MODULE, orders }),
    queryKey: SAVED_VIEWS_LIST_KEY,
    optimisticUpdate: (old, { orders }) => {
      const sortOrderMap = new Map(orders.map((o) => [o.id, o.sortOrder]));
      return (old ?? [])
        .map((row) =>
          sortOrderMap.has(row.id) ? { ...row, sortOrder: sortOrderMap.get(row.id)! } : row
        )
        .sort((a, b) => a.sortOrder - b.sortOrder);
    },
    invalidateKeys: INVALIDATE_KEYS,
  });

  // G-1 closure: rename / scope 변경 등 메타 갱신 — CAS version 동봉.
  const updateMutation = useOptimisticMutation<
    SavedView,
    { id: string; version: number; name?: string; params?: string },
    SavedView[]
  >({
    mutationFn: ({ id, ...payload }) => savedViewsApi.update(id, payload),
    queryKey: SAVED_VIEWS_LIST_KEY,
    optimisticUpdate: (old, { id, name, params }) =>
      (old ?? []).map((row) =>
        row.id === id
          ? {
              ...row,
              ...(name !== undefined ? { name } : {}),
              ...(params !== undefined ? { params } : {}),
            }
          : row
      ),
    invalidateKeys: INVALIDATE_KEYS,
  });

  const bulkImportMutation = useMutation({
    mutationFn: (payload: { views: Array<{ name: string; params: string }> }) =>
      savedViewsApi.bulkImport({ module: CHECKOUTS_MODULE, views: payload.views }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.savedViews.all });
      clearLocalStorageBackup();
    },
    onError: (error: unknown) => {
      toast({ ...mapSavedViewErrorToToast(error, t, tErrors), variant: 'destructive' });
    },
  });

  // ── Public API (호출자 호환) ──────────────────────────────────

  const addView = useCallback(
    (name: string, params: string): boolean => {
      if (views.length >= MAX_VIEWS) {
        toast({ description: t('maxReached', { max: MAX_VIEWS }), variant: 'destructive' });
        return false;
      }
      createMutation.mutate(
        { name, params },
        {
          onError: (error: unknown) => {
            toast({
              ...mapSavedViewErrorToToast(error, t, tErrors),
              variant: 'destructive',
            });
          },
        }
      );
      // 낙관적 갱신이 성공 가정으로 반환 (mutation 비동기) — 실패 시 onError toast.
      return true;
    },
    [views.length, createMutation, toast, t, tErrors]
  );

  const removeView = useCallback(
    (id: string) => {
      deleteMutation.mutate(
        { id },
        {
          onError: (error: unknown) => {
            toast({
              ...mapSavedViewErrorToToast(error, t, tErrors),
              variant: 'destructive',
            });
          },
        }
      );
    },
    [deleteMutation, toast, t, tErrors]
  );

  /**
   * G-1 closure: 이름(또는 params) 편집. CAS 정합 — 현재 view 의 version 자동 동봉.
   * `version` 인자를 받지 않고 hook 안에서 lookup → 호출자 단순화 (호출 시점 stale version
   * 회피, 다른 탭이 mutate 직후엔 invalidateQueries 가 fresh 데이터로 retry).
   */
  const renameView = useCallback(
    (id: string, name: string) => {
      const current = views.find((v) => v.id === id);
      if (!current) return;
      updateMutation.mutate(
        { id, version: current.version, name },
        {
          onError: (error: unknown) => {
            toast({
              ...mapSavedViewErrorToToast(error, t, tErrors),
              variant: 'destructive',
            });
          },
        }
      );
    },
    [views, updateMutation, toast, t, tErrors]
  );

  const moveView = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const index = views.findIndex((v) => v.id === id);
      if (index === -1) return;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= views.length) return;
      // sortOrder 만 두 row 사이 swap (절대값 재계산은 backend transaction 안에서)
      const swapped = [...views];
      [swapped[index], swapped[targetIndex]] = [swapped[targetIndex], swapped[index]];
      const orders = swapped.map((v, i) => ({ id: v.id, sortOrder: i }));
      reorderMutation.mutate(
        { orders },
        {
          onError: (error: unknown) => {
            toast({
              ...mapSavedViewErrorToToast(error, t, tErrors),
              variant: 'destructive',
            });
          },
        }
      );
    },
    [views, reorderMutation, toast, t, tErrors]
  );

  const importFromLocalStorage = useCallback(() => {
    const backup = readLocalStorageBackup();
    if (backup.length === 0) {
      // 백업 없음 — silent no-op (배너가 표시되지 않아야 정상).
      return;
    }
    bulkImportMutation.mutate(
      {
        views: backup.map((b) => ({ name: b.name, params: b.params })),
      },
      {
        onSuccess: () => {
          toast({ description: t('importSuccess', { count: backup.length }) });
        },
      }
    );
  }, [bulkImportMutation, toast, t]);

  // G-4 closure: localStorage 읽기를 한 렌더당 1회로 메모화 (JSON.parse 매 렌더 회피).
  // data 가 바뀔 때만 재계산 (views 가 비었을 때만 의미).
  const localBackupCount = useMemo(
    () => (views.length === 0 ? readLocalStorageBackup().length : 0),
    [views.length]
  );

  return {
    views,
    isLoading,
    addView,
    removeView,
    moveView,
    renameView,
    importFromLocalStorage,
    /** 배너 표시 트리거: 서버에 view 0개 + localStorage 백업 ≥ 1개 */
    hasLocalBackup: localBackupCount > 0,
    localBackupCount,
  };
}
