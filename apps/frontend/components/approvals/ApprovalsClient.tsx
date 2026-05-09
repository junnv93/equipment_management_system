'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useRowSelection } from '@/hooks/use-bulk-selection';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { UserRole } from '@equipment-management/schemas';
import { useTranslations } from 'next-intl';
import { type ApprovalCategory, type ApprovalItem, TAB_META } from '@/lib/api/approvals-api';
import { useApprovalsApi } from '@/lib/api/hooks/use-approvals-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { ApprovalKpiStrip } from './ApprovalKpiStrip';
import { ApprovalCategorySidebar } from './ApprovalCategorySidebar';
import { ApprovalMobileCategoryBar } from './ApprovalMobileCategoryBar';
import { ApprovalList } from './ApprovalList';
import { BulkActionBar } from './BulkActionBar';
import ApprovalDetailModal from './ApprovalDetailModal';
import RejectModal from './RejectModal';
import { ApprovalCommentDialog } from './ApprovalCommentDialog';
import { useApprovalKpi } from '@/hooks/use-approval-kpi';
import { useApprovalRowTransitions } from '@/hooks/use-approval-row-transitions';
import { useApprovalsItemMutations } from '@/hooks/use-approvals-item-mutations';
import { useApprovalsBulkMutations } from '@/hooks/use-approvals-bulk-mutations';
import { ErrorState } from '@/components/shared/ErrorState';

interface ApprovalsClientProps {
  userRole: UserRole;
  userTeamId?: string;
  initialTab?: string;
}

export function ApprovalsClient({ userRole, userTeamId, initialTab }: ApprovalsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const approvalsApi = useApprovalsApi();
  const t = useTranslations('approvals');

  const { data: categorySettings, isLoading: isCategoriesLoading } = useQuery({
    queryKey: queryKeys.approvals.categories(),
    queryFn: () => approvalsApi.getCategories(),
    ...QUERY_CONFIG.APPROVAL_COUNTS,
  });

  const availableTabs = useMemo(
    () => categorySettings?.availableCategories ?? [],
    [categorySettings?.availableCategories]
  );
  const defaultTab = initialTab || availableTabs[0] || 'equipment';

  const tabParam = searchParams.get('tab');
  const activeTab: ApprovalCategory =
    tabParam && availableTabs.includes(tabParam as ApprovalCategory)
      ? (tabParam as ApprovalCategory)
      : (defaultTab as ApprovalCategory);

  const [detailModalItem, setDetailModalItem] = useState<ApprovalItem | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<ApprovalItem | null>(null);

  // 행 전환 애니메이션 상태 머신 (processingIds / exitingIds)
  const {
    processingIds,
    exitingIds,
    startProcessing,
    startProcessingMany,
    completeTransition,
    completeTransitionMany,
    cancelProcessing,
    cancelProcessingMany,
  } = useApprovalRowTransitions();

  const {
    data: pendingItems = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.approvals.list(activeTab),
    queryFn: () => approvalsApi.getPendingItems(activeTab, userTeamId),
    ...QUERY_CONFIG.PENDING_APPROVALS,
  });

  const sortedItems = useMemo(
    () =>
      [...pendingItems].sort(
        (a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime()
      ),
    [pendingItems]
  );

  const selection = useRowSelection<ApprovalItem>(sortedItems, (item) => item.id, {
    isSelectable: (item) => !processingIds.has(item.id),
    resetOn: [activeTab],
  });

  const { clear: clearSelection } = selection;
  const handleTabChange = useCallback(
    (tab: string) => {
      clearSelection();
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, clearSelection]
  );

  const { data: pendingCounts } = useQuery({
    queryKey: queryKeys.approvals.counts(userRole),
    queryFn: () => approvalsApi.getPendingCounts(userRole),
    ...QUERY_CONFIG.APPROVAL_COUNTS,
  });

  const kpi = useApprovalKpi(pendingCounts, activeTab, availableTabs);

  const { data: analytics } = useQuery({
    queryKey: queryKeys.approvals.analytics(6),
    queryFn: () => approvalsApi.getAnalytics(6),
    ...QUERY_CONFIG.APPROVAL_COUNTS,
  });

  // 단건 승인/반려 mutations
  const {
    approveMutation,
    approveCommentItem,
    approveComment,
    setApproveComment,
    handleApprove,
    handleApproveWithComment,
    handleReject,
    handleCloseCommentDialog,
  } = useApprovalsItemMutations({
    activeTab,
    userRole,
    approvalsApi,
    onStartProcessing: startProcessing,
    onCompleteTransition: completeTransition,
    onCancelProcessing: cancelProcessing,
    onApproveSuccessExtra: () => setDetailModalItem(null),
  });

  // 일괄 승인/반려 mutations
  const {
    bulkApproveMutation,
    isBulkApproveCommentOpen,
    bulkApproveComment,
    setBulkApproveComment,
    handleBulkApprove,
    handleBulkApproveWithComment,
    handleBulkReject,
    handleCloseBulkCommentDialog,
  } = useApprovalsBulkMutations({
    activeTab,
    userRole,
    approvalsApi,
    selection,
    onStartProcessingMany: startProcessingMany,
    onCompleteTransitionMany: completeTransitionMany,
    onCancelProcessingMany: cancelProcessingMany,
  });

  const activeTabMeta = TAB_META[activeTab];

  const handleRejectForList = useCallback((item: ApprovalItem) => setRejectModalItem(item), []);
  const handleViewDetail = useCallback((item: ApprovalItem) => setDetailModalItem(item), []);

  if (isCategoriesLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (availableTabs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{t('noPermission')}</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <ApprovalKpiStrip
          totalPending={kpi.totalPending}
          urgentCount={kpi.urgentCount}
          avgWaitDays={kpi.avgWaitDays}
          isLoading={isLoading && !pendingCounts}
        />

        <ApprovalMobileCategoryBar
          className="lg:hidden"
          availableTabs={availableTabs}
          activeTab={activeTab}
          pendingCounts={pendingCounts}
          onTabChange={handleTabChange}
        />

        <div className="flex gap-6">
          <ApprovalCategorySidebar
            className="hidden lg:block"
            availableTabs={availableTabs}
            activeTab={activeTab}
            pendingCounts={pendingCounts}
            onTabChange={handleTabChange}
          />

          <div className="flex-1 min-w-0 space-y-3">
            {isError && (
              <div className="py-16 flex justify-center">
                <ErrorState title={t('list.error')} onRetry={() => void refetch()} />
              </div>
            )}
            <BulkActionBar
              selectedCount={selection.count}
              totalCount={sortedItems.length}
              isAllPageSelected={selection.isAllPageSelected}
              isIndeterminate={selection.isIndeterminate}
              onSelectAll={selection.selectAllOnPage}
              onClearSelection={selection.clear}
              onBulkApprove={handleBulkApprove}
              onBulkReject={activeTabMeta.canReject !== false ? handleBulkReject : undefined}
              actionLabel={t(activeTabMeta.actionKey as Parameters<typeof t>[0])}
            />

            <ApprovalList
              items={sortedItems}
              isLoading={isLoading}
              selectedItems={Array.from(selection.selected)}
              processingIds={processingIds}
              exitingIds={exitingIds}
              onToggleSelect={selection.toggle}
              onApprove={handleApprove}
              onReject={activeTabMeta.canReject !== false ? handleRejectForList : undefined}
              onViewDetail={handleViewDetail}
              actionLabel={t(activeTabMeta.actionKey as Parameters<typeof t>[0])}
              todayProcessed={kpi.todayProcessed}
            />
          </div>
        </div>

        {analytics && analytics.buckets.length > 0 && (
          <section className="border border-border rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {analytics.buckets.slice(-4).map((bucket) => (
                <div key={bucket.month} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{bucket.month}</p>
                  <p className="text-xl font-semibold tabular-nums">{bucket.processedCount}</p>
                  <p className="text-xs text-muted-foreground">
                    {bucket.approvalCount} / {bucket.rejectionCount}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {detailModalItem && (
          <ApprovalDetailModal
            item={detailModalItem}
            isOpen={!!detailModalItem}
            onClose={() => setDetailModalItem(null)}
            onApprove={() => handleApprove(detailModalItem)}
            onReject={
              TAB_META[detailModalItem.category].canReject !== false
                ? () => {
                    setDetailModalItem(null);
                    setRejectModalItem(detailModalItem);
                  }
                : undefined
            }
            actionLabel={t(TAB_META[detailModalItem.category].actionKey as Parameters<typeof t>[0])}
          />
        )}

        {rejectModalItem && (
          <RejectModal
            mode="single"
            item={rejectModalItem}
            isOpen={!!rejectModalItem}
            onClose={() => setRejectModalItem(null)}
            onConfirm={(reason) => handleReject(rejectModalItem, reason)}
          />
        )}

        {/* 단건 승인 코멘트 다이얼로그 (commentRequired 카테고리용) */}
        {approveCommentItem && (
          <ApprovalCommentDialog
            mode="single"
            isOpen={!!approveCommentItem}
            onClose={handleCloseCommentDialog}
            onConfirm={handleApproveWithComment}
            comment={approveComment}
            onCommentChange={setApproveComment}
            item={approveCommentItem}
            isPending={approveMutation.isPending}
          />
        )}

        {/* 일괄 승인 코멘트 다이얼로그 (commentRequired 카테고리용) */}
        <ApprovalCommentDialog
          mode="bulk"
          isOpen={isBulkApproveCommentOpen}
          onClose={handleCloseBulkCommentDialog}
          onConfirm={handleBulkApproveWithComment}
          comment={bulkApproveComment}
          onCommentChange={setBulkApproveComment}
          activeTab={activeTab}
          bulkCount={selection.count}
          isPending={bulkApproveMutation.isPending}
        />
      </div>
    </TooltipProvider>
  );
}
