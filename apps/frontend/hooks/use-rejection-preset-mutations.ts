'use client';

import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import checkoutApi, { type RejectionPreset } from '@/lib/api/checkout-api';
import { queryKeys } from '@/lib/api/query-config';

/**
 * 반려 사유 프리셋 admin CRUD mutations (S-4).
 *
 * SSOT:
 * - mutationFn → `checkoutApi.*` (axios SSOT)
 * - invalidateKeys → `queryKeys.checkouts.resource.rejectionPresets()` 단일
 * - setQueryData 금지 — invalidateQueries 전용 (CLAUDE.md Rule, MEMORY `useOptimisticMutation` 한계)
 *
 * 권한: `Permission.MANAGE_SYSTEM_SETTINGS` (backend controller decorator).
 * Frontend 권한 체크는 admin page server component에서 redirect 처리.
 */

const REJECTION_PRESETS_QK = queryKeys.checkouts.resource.rejectionPresets();
const INVALIDATE_KEYS = [REJECTION_PRESETS_QK] as const;

interface CreateInput {
  label: string;
  template?: string;
  sortOrder?: number;
}

interface UpdateInput {
  id: string;
  label?: string;
  template?: string | null;
  sortOrder?: number;
}

interface ReorderInput {
  orders: Array<{ id: string; sortOrder: number }>;
}

/**
 * 반려 사유 프리셋 생성 (admin).
 * Optimistic update: 신규 row를 리스트 끝에 append (id는 서버 응답으로 교체).
 */
export function useCreateRejectionPresetMutation() {
  return useOptimisticMutation<RejectionPreset, CreateInput, RejectionPreset[]>({
    mutationFn: (input) => checkoutApi.createRejectionPreset(input),
    queryKey: REJECTION_PRESETS_QK,
    optimisticUpdate: (old, input) => {
      const optimistic: RejectionPreset = {
        id: `optimistic-${Date.now()}`,
        label: input.label,
        template: input.template ?? null,
        isDefault: false,
        sortOrder: input.sortOrder ?? 0,
      };
      return [...(old ?? []), optimistic];
    },
    invalidateKeys: INVALIDATE_KEYS,
  });
}

/**
 * 반려 사유 프리셋 수정 (admin, 부분 수정).
 * isDefault 토글 차단 (backend service-layer 강제).
 */
export function useUpdateRejectionPresetMutation() {
  return useOptimisticMutation<RejectionPreset, UpdateInput, RejectionPreset[]>({
    mutationFn: ({ id, ...input }) => checkoutApi.updateRejectionPreset(id, input),
    queryKey: REJECTION_PRESETS_QK,
    optimisticUpdate: (old, { id, label, template, sortOrder }) =>
      (old ?? []).map((row) =>
        row.id === id
          ? {
              ...row,
              ...(label !== undefined ? { label } : {}),
              ...(template !== undefined ? { template } : {}),
              ...(sortOrder !== undefined ? { sortOrder } : {}),
            }
          : row
      ),
    invalidateKeys: INVALIDATE_KEYS,
  });
}

/**
 * 반려 사유 프리셋 삭제 (admin).
 * isDefault=true row 차단 (backend service-layer 강제 — frontend는 disabled UI).
 */
export function useDeleteRejectionPresetMutation() {
  return useOptimisticMutation<void, { id: string }, RejectionPreset[]>({
    mutationFn: ({ id }) => checkoutApi.deleteRejectionPreset(id),
    queryKey: REJECTION_PRESETS_QK,
    optimisticUpdate: (old, { id }) => (old ?? []).filter((row) => row.id !== id),
    invalidateKeys: INVALIDATE_KEYS,
  });
}

/**
 * 반려 사유 프리셋 일괄 정렬 (admin).
 * transaction 내 bulk UPDATE — partial 실패 시 rollback.
 */
export function useReorderRejectionPresetsMutation() {
  return useOptimisticMutation<{ updated: number }, ReorderInput, RejectionPreset[]>({
    mutationFn: ({ orders }) => checkoutApi.reorderRejectionPresets(orders),
    queryKey: REJECTION_PRESETS_QK,
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
}
