import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { CheckoutCacheInvalidation } from '@/lib/api/cache-invalidation';
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

  const getInvalidationKeys = useCallback(
    () => [
      queryKeys.approvals.countsAll,
      queryKeys.approvals.kpi(activeTab),
      ...CheckoutCacheInvalidation.APPROVAL_KEYS,
      queryKeys.equipment.all,
      queryKeys.nonConformances.all,
    ],
    [activeTab]
  );

  const bulkApproveMutation = useOptimisticMutation<
    { success: string[]; failed: string[] },
    { ids: string[]; comment?: string },
    ApprovalItem[]
  >({
    mutationFn: async ({ ids, comment }) => approvalsApi.bulkApprove(activeTab, ids, comment),
    queryKey: queryKeys.approvals.list(activeTab),
    optimisticUpdate: (old) => old || [],
    invalidateKeys: [...getInvalidationKeys(), queryKeys.calibrations.intermediateChecks()],
    errorMessage: t('toasts.bulkApproveError'),
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
    invalidateKeys: getInvalidationKeys(),
    errorMessage: t('toasts.bulkRejectError'),
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
    await bulkApproveMutation.mutateAsync({ ids: selectedIds });
  }, [activeTab, selection, bulkApproveMutation, onStartProcessingMany]);

  const handleBulkApproveWithComment = useCallback(async () => {
    if (!bulkApproveComment.trim()) return;
    const selectedIds = Array.from(selection.selected);
    onStartProcessingMany(selectedIds);
    await bulkApproveMutation.mutateAsync({ ids: selectedIds, comment: bulkApproveComment });
  }, [bulkApproveComment, selection, bulkApproveMutation, onStartProcessingMany]);

  const handleBulkReject = useCallback(
    async (reason: string) => {
      if (selection.count === 0) return;
      const selectedIds = Array.from(selection.selected);
      onStartProcessingMany(selectedIds);
      await bulkRejectMutation.mutateAsync({ ids: selectedIds, reason });
    },
    [selection, bulkRejectMutation, onStartProcessingMany]
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
