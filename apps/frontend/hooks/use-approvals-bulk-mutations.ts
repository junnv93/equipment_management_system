import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { useBulkUndoToast } from '@/hooks/use-bulk-undo-toast';
import { UNDO_TOAST_DURATION_MS } from '@/lib/checkouts/undo-constants';
import { getApprovalsInvalidationKeys } from '@/lib/api/approvals-invalidation';
import { queryKeys } from '@/lib/api/query-config';
import { type ApprovalCategory, type ApprovalItem, TAB_META } from '@/lib/api/approvals-api';
import { useApprovalsApi } from '@/lib/api/hooks/use-approvals-api';
import type { UserRole } from '@equipment-management/schemas';

type ApprovalsApiInstance = ReturnType<typeof useApprovalsApi>;

/** useRowSelection 반환에서 필요한 최소 인터페이스 */
interface SelectionHandle {
  count: number;
  selected: ReadonlySet<string>;
  clear: () => void;
}

interface UseApprovalsBulkMutationsOptions {
  activeTab: ApprovalCategory;
  userRole: UserRole;
  approvalsApi: ApprovalsApiInstance;
  selection: SelectionHandle;
  onStartProcessingMany: (ids: string[]) => void;
  onCompleteTransitionMany: (ids: string[], outcome: 'success' | 'reject') => void;
  onCancelProcessingMany: (ids: string[]) => void;
}

export function useApprovalsBulkMutations({
  activeTab,
  userRole: _userRole,
  approvalsApi,
  selection,
  onStartProcessingMany,
  onCompleteTransitionMany,
  onCancelProcessingMany,
}: UseApprovalsBulkMutationsOptions) {
  const t = useTranslations('approvals');
  const { toast } = useToast();

  const [isBulkApproveCommentOpen, setIsBulkApproveCommentOpen] = useState(false);
  const [bulkApproveComment, setBulkApproveComment] = useState('');

  const approveInvalidateKeys = useMemo(
    () => [...getApprovalsInvalidationKeys(activeTab), queryKeys.calibrations.intermediateChecks()],
    [activeTab]
  );
  const rejectInvalidateKeys = useMemo(() => getApprovalsInvalidationKeys(activeTab), [activeTab]);

  const bulkApproveMutation = useOptimisticMutation<
    { success: string[]; failed: string[] },
    { ids: string[]; comment?: string },
    ApprovalItem[]
  >({
    mutationFn: async ({ ids, comment }) => approvalsApi.bulkApprove(activeTab, ids, comment),
    queryKey: queryKeys.approvals.list(activeTab),
    optimisticUpdate: (old) => old || [],
    invalidateKeys: approveInvalidateKeys,
    errorMessage: t('toasts.bulkApproveError'),
    undoWindowMs: UNDO_TOAST_DURATION_MS,
    onSuccessCallback: (result, { ids }) => {
      if (result.failed.length > 0 && result.success.length === 0) {
        toast({
          title: t('toasts.bulkApproveError'),
          description: t('toasts.bulkApproveResult', { success: 0, failed: result.failed.length }),
          variant: 'destructive',
        });
      } else if (result.failed.length > 0) {
        toast({
          title: t('toasts.bulkApproveResult', {
            success: result.success.length,
            failed: result.failed.length,
          }),
          variant: 'destructive',
        });
      } else {
        toast({ title: t('toasts.bulkApproveAll', { count: result.success.length }) });
      }
      onCompleteTransitionMany(ids, 'success');
      selection.clear();
      setIsBulkApproveCommentOpen(false);
      setBulkApproveComment('');
    },
    onErrorCallback: (_, { ids }) => {
      onCancelProcessingMany(ids);
    },
  });

  const bulkRejectMutation = useOptimisticMutation<
    { success: string[]; failed: string[] },
    { ids: string[]; reason: string },
    ApprovalItem[]
  >({
    mutationFn: async ({ ids, reason }) => approvalsApi.bulkReject(activeTab, ids, reason),
    queryKey: queryKeys.approvals.list(activeTab),
    optimisticUpdate: (old) => old || [],
    invalidateKeys: rejectInvalidateKeys,
    errorMessage: t('toasts.bulkRejectError'),
    undoWindowMs: UNDO_TOAST_DURATION_MS,
    onSuccessCallback: (result, { ids }) => {
      if (result.failed.length > 0 && result.success.length === 0) {
        toast({
          title: t('toasts.bulkRejectError'),
          description: t('toasts.bulkRejectResult', { success: 0, failed: result.failed.length }),
          variant: 'destructive',
        });
      } else if (result.failed.length > 0) {
        toast({
          title: t('toasts.bulkRejectResult', {
            success: result.success.length,
            failed: result.failed.length,
          }),
          variant: 'destructive',
        });
      } else {
        toast({ title: t('toasts.bulkRejectAll', { count: result.success.length }) });
      }
      onCompleteTransitionMany(ids, 'reject');
      selection.clear();
    },
    onErrorCallback: (_, { ids }) => {
      onCancelProcessingMany(ids);
    },
  });

  // Bulk undo toast — undoWindowMs(5s) 내 abort 가능. comment-required(commentRequired) 흐름은
  // dialog 확정 후 mutate되므로 동일하게 적용. handleBulkApproveWithComment도 분기 통합.
  const { showBulkApproveUndoToast } = useBulkUndoToast({
    invalidateKeys: approveInvalidateKeys,
    abortUndo: bulkApproveMutation.abortUndo,
  });
  const { showBulkRejectUndoToast } = useBulkUndoToast({
    invalidateKeys: rejectInvalidateKeys,
    abortUndo: bulkRejectMutation.abortUndo,
  });

  /** TAB_META.commentRequired 분기 — commentRequired면 dialog 열고, 아니면 즉시 처리 */
  const handleBulkApprove = useCallback(async () => {
    if (selection.count === 0) return;
    const meta = TAB_META[activeTab];
    const selectedIds = Array.from(selection.selected);
    if (meta?.commentRequired) {
      setIsBulkApproveCommentOpen(true);
      setBulkApproveComment('');
      return;
    }
    onStartProcessingMany(selectedIds);
    showBulkApproveUndoToast(selectedIds.length);
    void bulkApproveMutation.mutateAsync({ ids: selectedIds }).catch(() => undefined);
  }, [activeTab, selection, bulkApproveMutation, onStartProcessingMany, showBulkApproveUndoToast]);

  const handleBulkApproveWithComment = useCallback(async () => {
    if (!bulkApproveComment.trim()) return;
    const selectedIds = Array.from(selection.selected);
    const comment = bulkApproveComment;
    // 5초 지연 동안 dialog 잠금되지 않도록 즉시 close — onSuccessCallback의 close는 race-safe (idempotent)
    setIsBulkApproveCommentOpen(false);
    setBulkApproveComment('');
    onStartProcessingMany(selectedIds);
    showBulkApproveUndoToast(selectedIds.length);
    void bulkApproveMutation.mutateAsync({ ids: selectedIds, comment }).catch(() => undefined);
  }, [
    bulkApproveComment,
    selection,
    bulkApproveMutation,
    onStartProcessingMany,
    showBulkApproveUndoToast,
  ]);

  const handleBulkReject = useCallback(
    async (reason: string) => {
      if (selection.count === 0) return;
      const selectedIds = Array.from(selection.selected);
      onStartProcessingMany(selectedIds);
      showBulkRejectUndoToast(selectedIds.length);
      void bulkRejectMutation.mutateAsync({ ids: selectedIds, reason }).catch(() => undefined);
    },
    [selection, bulkRejectMutation, onStartProcessingMany, showBulkRejectUndoToast]
  );

  const handleCloseBulkCommentDialog = useCallback(() => {
    setIsBulkApproveCommentOpen(false);
    setBulkApproveComment('');
  }, []);

  return {
    bulkApproveMutation,
    bulkRejectMutation,
    isBulkApproveCommentOpen,
    bulkApproveComment,
    setBulkApproveComment,
    handleBulkApprove,
    handleBulkApproveWithComment,
    handleBulkReject,
    handleCloseBulkCommentDialog,
  };
}
