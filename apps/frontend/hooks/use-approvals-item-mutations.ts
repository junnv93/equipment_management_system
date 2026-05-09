import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useSiteLabels } from '@/lib/i18n/use-enum-labels';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { CheckoutCacheInvalidation } from '@/lib/api/cache-invalidation';
import { queryKeys } from '@/lib/api/query-config';
import { type ApprovalCategory, type ApprovalItem, TAB_META } from '@/lib/api/approvals-api';
import { getLocalizedSummary } from '@/lib/utils/approval-summary-utils';
import { useApprovalsApi } from '@/lib/api/hooks/use-approvals-api';
import type { UserRole } from '@equipment-management/schemas';

type ApprovalsApiInstance = ReturnType<typeof useApprovalsApi>;

interface UseApprovalsItemMutationsOptions {
  activeTab: ApprovalCategory;
  userRole: UserRole;
  approvalsApi: ApprovalsApiInstance;
  onStartProcessing: (id: string) => void;
  onCompleteTransition: (id: string, outcome: 'success' | 'reject') => void;
  onCancelProcessing: (id: string) => void;
  /** 단건 승인 성공 후 추가 동작 (예: detailModal 닫기) */
  onApproveSuccessExtra?: () => void;
}

export function useApprovalsItemMutations({
  activeTab,
  userRole: _userRole,
  approvalsApi,
  onStartProcessing,
  onCompleteTransition,
  onCancelProcessing,
  onApproveSuccessExtra,
}: UseApprovalsItemMutationsOptions) {
  const t = useTranslations('approvals');
  const siteLabels = useSiteLabels();

  const [approveCommentItem, setApproveCommentItem] = useState<ApprovalItem | null>(null);
  const [approveComment, setApproveComment] = useState('');

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

  const approveMutation = useOptimisticMutation<
    void,
    { item: ApprovalItem; comment?: string },
    ApprovalItem[]
  >({
    mutationFn: async ({ item, comment }) => {
      const equipmentId = item.details?.equipmentId as string | undefined;
      await approvalsApi.approve(
        item.category,
        item.id,
        comment || t('defaults.approveComment'),
        equipmentId,
        item.originalData
      );
    },
    queryKey: queryKeys.approvals.list(activeTab),
    optimisticUpdate: (old) => old || [],
    invalidateKeys: [...getInvalidationKeys(), queryKeys.calibrations.intermediateChecks()],
    successMessage: (_, { item }) =>
      t('toasts.approveDynamic', { summary: getLocalizedSummary(item, t, siteLabels) }),
    errorMessage: t('toasts.approveError'),
    onSuccessCallback: (_, { item }) => {
      onCompleteTransition(item.id, 'success');
      onApproveSuccessExtra?.();
      setApproveCommentItem(null);
      setApproveComment('');
    },
    onErrorCallback: (_, { item }) => {
      onCancelProcessing(item.id);
    },
  });

  const rejectMutation = useOptimisticMutation<
    void,
    { item: ApprovalItem; reason: string },
    ApprovalItem[]
  >({
    mutationFn: async ({ item, reason }) => {
      const equipmentId = item.details?.equipmentId as string | undefined;
      await approvalsApi.reject(item.category, item.id, reason, equipmentId, item.originalData);
    },
    queryKey: queryKeys.approvals.list(activeTab),
    optimisticUpdate: (old) => old || [],
    invalidateKeys: getInvalidationKeys(),
    successMessage: (_, { item }) =>
      t('toasts.rejectDynamic', { summary: getLocalizedSummary(item, t, siteLabels) }),
    errorMessage: t('toasts.rejectError'),
    onSuccessCallback: (_, { item }) => {
      onCompleteTransition(item.id, 'reject');
    },
    onErrorCallback: (_, { item }) => {
      onCancelProcessing(item.id);
    },
  });

  /** TAB_META.commentRequired 분기 — commentRequired면 dialog 열고, 아니면 즉시 처리 */
  const handleApprove = useCallback(
    (item: ApprovalItem) => {
      const meta = TAB_META[item.category];
      if (meta?.commentRequired) {
        setApproveCommentItem(item);
        setApproveComment('');
      } else {
        onStartProcessing(item.id);
        approveMutation.mutate({ item });
      }
    },
    [approveMutation, onStartProcessing]
  );

  const handleApproveWithComment = useCallback(() => {
    if (!approveCommentItem || !approveComment.trim()) return;
    onStartProcessing(approveCommentItem.id);
    approveMutation.mutate({ item: approveCommentItem, comment: approveComment });
  }, [approveCommentItem, approveComment, approveMutation, onStartProcessing]);

  const handleReject = useCallback(
    async (item: ApprovalItem, reason: string) => {
      onStartProcessing(item.id);
      await rejectMutation.mutateAsync({ item, reason });
    },
    [rejectMutation, onStartProcessing]
  );

  const handleCloseCommentDialog = useCallback(() => {
    setApproveCommentItem(null);
    setApproveComment('');
  }, []);

  return {
    approveMutation,
    rejectMutation,
    approveCommentItem,
    approveComment,
    setApproveComment,
    handleApprove,
    handleApproveWithComment,
    handleReject,
    handleCloseCommentDialog,
  };
}

/** useApprovalsApi의 반환 타입 (임포트 사이드이펙트 없이 재사용) */
export type UseApprovalsItemMutations = ReturnType<typeof useApprovalsItemMutations>;
