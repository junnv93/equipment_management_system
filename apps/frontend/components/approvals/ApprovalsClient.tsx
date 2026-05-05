'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { useRowSelection } from '@/hooks/use-bulk-selection';
import { CheckoutCacheInvalidation } from '@/lib/api/cache-invalidation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import type { UserRole } from '@equipment-management/schemas';
import { useTranslations } from 'next-intl';
import { useSiteLabels } from '@/lib/i18n/use-enum-labels';
import { type ApprovalCategory, type ApprovalItem, TAB_META } from '@/lib/api/approvals-api';
import { getLocalizedSummary } from '@/lib/utils/approval-summary-utils';
import { useApprovalsApi } from '@/lib/api/hooks/use-approvals-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { ApprovalKpiStrip } from './ApprovalKpiStrip';
import { ApprovalCategorySidebar } from './ApprovalCategorySidebar';
import { ApprovalMobileCategoryBar } from './ApprovalMobileCategoryBar';
import { ApprovalList } from './ApprovalList';
import { BulkActionBar } from './BulkActionBar';
import ApprovalDetailModal from './ApprovalDetailModal';
import RejectModal from './RejectModal';
import { useApprovalKpi } from '@/hooks/use-approval-kpi';
import { APPROVAL_MOTION, getApprovalActionButtonClasses } from '@/lib/design-tokens';
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
  const siteLabels = useSiteLabels();
  const { toast } = useToast();

  const { data: categorySettings, isLoading: isCategoriesLoading } = useQuery({
    queryKey: queryKeys.approvals.categories(),
    queryFn: () => approvalsApi.getCategories(),
    ...QUERY_CONFIG.APPROVAL_COUNTS,
  });

  // 현재 역할에서 사용 가능한 탭 (useMemo로 안정화)
  const availableTabs = useMemo(
    () => categorySettings?.availableCategories ?? [],
    [categorySettings?.availableCategories]
  );
  const defaultTab = initialTab || availableTabs[0] || 'equipment';

  // URL이 SSOT — tab 파라미터에서 직접 도출
  const tabParam = searchParams.get('tab');
  const activeTab: ApprovalCategory =
    tabParam && availableTabs.includes(tabParam as ApprovalCategory)
      ? (tabParam as ApprovalCategory)
      : (defaultTab as ApprovalCategory);

  const [detailModalItem, setDetailModalItem] = useState<ApprovalItem | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<ApprovalItem | null>(null);

  // 처리 중/퇴장 애니메이션 상태
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [exitingIds, setExitingIds] = useState<Map<string, 'success' | 'reject'>>(new Map());

  // 승인 코멘트 다이얼로그 상태 (commentRequired 카테고리용)
  const [approveCommentItem, setApproveCommentItem] = useState<ApprovalItem | null>(null);
  const [approveComment, setApproveComment] = useState('');
  // 벌크 승인 코멘트 다이얼로그 상태
  const [isBulkApproveCommentOpen, setIsBulkApproveCommentOpen] = useState(false);
  const [bulkApproveComment, setBulkApproveComment] = useState('');

  // 승인 대기 목록 조회
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

  // 경과일 내림차순 정렬 (오래된 건 상단)
  const sortedItems = useMemo(() => {
    return [...pendingItems].sort(
      (a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime()
    );
  }, [pendingItems]);

  const selection = useRowSelection<ApprovalItem>(sortedItems, (item) => item.id, {
    isSelectable: (item) => !processingIds.has(item.id),
    resetOn: [activeTab],
  });

  // 탭 변경 핸들러 — clearSelection은 useCallback([]) 안정 참조
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

  // 카테고리별 대기 개수 조회
  const { data: pendingCounts } = useQuery({
    queryKey: queryKeys.approvals.counts(userRole),
    queryFn: () => approvalsApi.getPendingCounts(userRole),
    ...QUERY_CONFIG.APPROVAL_COUNTS,
  });

  // KPI 데이터 — 서버 사이드 집계 (GET /api/approvals/kpi?category=X)
  const kpi = useApprovalKpi(pendingCounts, activeTab, availableTabs);

  const { data: analytics } = useQuery({
    queryKey: queryKeys.approvals.analytics(6),
    queryFn: () => approvalsApi.getAnalytics(6),
    ...QUERY_CONFIG.APPROVAL_COUNTS,
  });

  // AR-4: 승인/반려 후 공통 invalidation 키 — 4× 중복 제거
  const getInvalidationKeys = () => [
    queryKeys.approvals.counts(userRole),
    queryKeys.approvals.kpi(activeTab),
    ...CheckoutCacheInvalidation.APPROVAL_KEYS,
    queryKeys.equipment.all,
    queryKeys.nonConformances.all,
  ];

  // ✅ 승인 처리 - Optimistic Update 패턴
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
      setProcessingIds((prev) => {
        const s = new Set(prev);
        s.delete(item.id);
        return s;
      });
      setExitingIds((prev) => new Map(prev).set(item.id, 'success'));
      setTimeout(() => {
        setExitingIds((prev) => {
          const m = new Map(prev);
          m.delete(item.id);
          return m;
        });
      }, APPROVAL_MOTION.exitDurationMs);
      setDetailModalItem(null);
      setApproveCommentItem(null);
      setApproveComment('');
    },
    onErrorCallback: (_, { item }) => {
      setProcessingIds((prev) => {
        const s = new Set(prev);
        s.delete(item.id);
        return s;
      });
    },
  });

  /**
   * 승인 핸들러 — SSOT: TAB_META.commentRequired 기반 분기
   */
  const handleApprove = (item: ApprovalItem) => {
    const meta = TAB_META[item.category];
    if (meta?.commentRequired) {
      setDetailModalItem(null);
      setApproveCommentItem(item);
      setApproveComment('');
    } else {
      setProcessingIds((prev) => new Set(prev).add(item.id));
      approveMutation.mutate({ item });
    }
  };

  const handleApproveWithComment = () => {
    if (!approveCommentItem || !approveComment.trim()) return;
    setProcessingIds((prev) => new Set(prev).add(approveCommentItem.id));
    approveMutation.mutate({ item: approveCommentItem, comment: approveComment });
  };

  // ✅ 반려 처리
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
      setProcessingIds((prev) => {
        const s = new Set(prev);
        s.delete(item.id);
        return s;
      });
      setExitingIds((prev) => new Map(prev).set(item.id, 'reject'));
      setTimeout(() => {
        setExitingIds((prev) => {
          const m = new Map(prev);
          m.delete(item.id);
          return m;
        });
      }, APPROVAL_MOTION.exitDurationMs);
      setRejectModalItem(null);
    },
    onErrorCallback: (_, { item }) => {
      setProcessingIds((prev) => {
        const s = new Set(prev);
        s.delete(item.id);
        return s;
      });
    },
  });

  const handleReject = async (item: ApprovalItem, reason: string) => {
    setProcessingIds((prev) => new Set(prev).add(item.id));
    await rejectMutation.mutateAsync({ item, reason });
  };

  // ✅ 일괄 승인 처리
  const bulkApproveMutation = useOptimisticMutation<
    { success: string[]; failed: string[] },
    { ids: string[]; comment?: string },
    ApprovalItem[]
  >({
    mutationFn: async ({ ids, comment }) => {
      return await approvalsApi.bulkApprove(activeTab, ids, comment);
    },
    queryKey: queryKeys.approvals.list(activeTab),
    optimisticUpdate: (old) => old || [],
    invalidateKeys: [...getInvalidationKeys(), queryKeys.calibrations.intermediateChecks()],
    // successMessage 생략 — 부분 실패 시 토스트 title/variant를 분기해야 하므로 onSuccessCallback에서 직접 처리
    errorMessage: t('toasts.bulkApproveError'),
    onSuccessCallback: (result, { ids }) => {
      // 결과에 따라 적절한 토스트 표시
      if (result.failed.length > 0 && result.success.length === 0) {
        // 전체 실패
        toast({
          title: t('toasts.bulkApproveError'),
          description: t('toasts.bulkApproveResult', {
            success: 0,
            failed: result.failed.length,
          }),
          variant: 'destructive',
        });
      } else if (result.failed.length > 0) {
        // 부분 성공
        toast({
          title: t('toasts.bulkApproveResult', {
            success: result.success.length,
            failed: result.failed.length,
          }),
          variant: 'destructive',
        });
      } else {
        // 전체 성공
        toast({
          title: t('toasts.bulkApproveAll', { count: result.success.length }),
        });
      }

      setProcessingIds((prev) => {
        const s = new Set(prev);
        ids.forEach((id) => s.delete(id));
        return s;
      });
      setExitingIds((prev) => {
        const m = new Map(prev);
        ids.forEach((id) => m.set(id, 'success'));
        return m;
      });
      setTimeout(() => {
        setExitingIds((prev) => {
          const m = new Map(prev);
          ids.forEach((id) => m.delete(id));
          return m;
        });
      }, APPROVAL_MOTION.exitDurationMs);
      selection.clear();
      setIsBulkApproveCommentOpen(false);
      setBulkApproveComment('');
    },
    onErrorCallback: (_, { ids }) => {
      setProcessingIds((prev) => {
        const s = new Set(prev);
        ids.forEach((id) => s.delete(id));
        return s;
      });
    },
  });

  const handleBulkApprove = () => {
    if (selection.count === 0) return;
    const meta = TAB_META[activeTab];
    const selectedIds = Array.from(selection.selected);
    if (meta?.commentRequired) {
      setIsBulkApproveCommentOpen(true);
      setBulkApproveComment('');
    } else {
      setProcessingIds((prev) => new Set([...prev, ...selectedIds]));
      bulkApproveMutation.mutate({ ids: selectedIds });
    }
  };

  const handleBulkApproveWithComment = () => {
    if (!bulkApproveComment.trim()) return;
    const selectedIds = Array.from(selection.selected);
    setProcessingIds((prev) => new Set([...prev, ...selectedIds]));
    bulkApproveMutation.mutate({ ids: selectedIds, comment: bulkApproveComment });
  };

  // ✅ 일괄 반려 처리
  const bulkRejectMutation = useOptimisticMutation<
    { success: string[]; failed: string[] },
    { ids: string[]; reason: string },
    ApprovalItem[]
  >({
    mutationFn: async ({ ids, reason }) => {
      return await approvalsApi.bulkReject(activeTab, ids, reason);
    },
    queryKey: queryKeys.approvals.list(activeTab),
    optimisticUpdate: (old) => old || [],
    invalidateKeys: getInvalidationKeys(),
    // successMessage 생략 — 부분 실패 시 토스트 title/variant를 분기해야 하므로 onSuccessCallback에서 직접 처리
    errorMessage: t('toasts.bulkRejectError'),
    onSuccessCallback: (result, { ids }) => {
      // 결과에 따라 적절한 토스트 표시
      if (result.failed.length > 0 && result.success.length === 0) {
        toast({
          title: t('toasts.bulkRejectError'),
          description: t('toasts.bulkRejectResult', {
            success: 0,
            failed: result.failed.length,
          }),
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
        toast({
          title: t('toasts.bulkRejectAll', { count: result.success.length }),
        });
      }

      setProcessingIds((prev) => {
        const s = new Set(prev);
        ids.forEach((id) => s.delete(id));
        return s;
      });
      setExitingIds((prev) => {
        const m = new Map(prev);
        ids.forEach((id) => m.set(id, 'reject'));
        return m;
      });
      setTimeout(() => {
        setExitingIds((prev) => {
          const m = new Map(prev);
          ids.forEach((id) => m.delete(id));
          return m;
        });
      }, APPROVAL_MOTION.exitDurationMs);
      selection.clear();
    },
    onErrorCallback: (_, { ids }) => {
      setProcessingIds((prev) => {
        const s = new Set(prev);
        ids.forEach((id) => s.delete(id));
        return s;
      });
    },
  });

  const handleBulkReject = async (reason: string) => {
    if (selection.count === 0) return;
    const selectedIds = Array.from(selection.selected);
    setProcessingIds((prev) => new Set([...prev, ...selectedIds]));
    await bulkRejectMutation.mutateAsync({ ids: selectedIds, reason });
  };

  // 현재 탭의 코멘트 다이얼로그 메타 (SSOT: TAB_META)
  const activeTabMeta = TAB_META[activeTab];
  const commentMeta = approveCommentItem ? TAB_META[approveCommentItem.category] : null;

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
        {/* KPI Strip */}
        <ApprovalKpiStrip
          totalPending={kpi.totalPending}
          urgentCount={kpi.urgentCount}
          avgWaitDays={kpi.avgWaitDays}
          isLoading={isLoading && !pendingCounts}
        />

        {/* Mobile Category Bar (<lg) */}
        <ApprovalMobileCategoryBar
          className="lg:hidden"
          availableTabs={availableTabs}
          activeTab={activeTab}
          pendingCounts={pendingCounts}
          onTabChange={handleTabChange}
        />

        {/* Main 2-column layout */}
        <div className="flex gap-6">
          {/* Desktop Category Sidebar (lg+) */}
          <ApprovalCategorySidebar
            className="hidden lg:block"
            availableTabs={availableTabs}
            activeTab={activeTab}
            pendingCounts={pendingCounts}
            onTabChange={handleTabChange}
          />

          {/* Content Area */}
          <div className="flex-1 min-w-0 space-y-3">
            {isError && (
              <div className="py-16 flex justify-center">
                <ErrorState title={t('list.error')} onRetry={() => void refetch()} />
              </div>
            )}
            {/* Bulk Action Bar */}
            <BulkActionBar
              selectedCount={selection.count}
              totalCount={sortedItems.length}
              isAllPageSelected={selection.isAllPageSelected}
              isIndeterminate={selection.isIndeterminate}
              onSelectAll={selection.selectAllOnPage}
              onClearSelection={selection.clear}
              onBulkApprove={handleBulkApprove}
              onBulkReject={TAB_META[activeTab].canReject !== false ? handleBulkReject : undefined}
              actionLabel={t(TAB_META[activeTab].actionKey as Parameters<typeof t>[0])}
            />

            {/* Single list — no TabsContent loop */}
            <ApprovalList
              items={sortedItems}
              isLoading={isLoading}
              selectedItems={Array.from(selection.selected)}
              processingIds={processingIds}
              exitingIds={exitingIds}
              onToggleSelect={selection.toggle}
              onApprove={handleApprove}
              onReject={
                TAB_META[activeTab].canReject !== false
                  ? (item) => setRejectModalItem(item)
                  : undefined
              }
              onViewDetail={(item) => setDetailModalItem(item)}
              actionLabel={t(TAB_META[activeTab].actionKey as Parameters<typeof t>[0])}
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

        {/* 상세 보기 모달 */}
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

        {/* 반려 모달 */}
        {rejectModalItem && (
          <RejectModal
            mode="single"
            item={rejectModalItem}
            isOpen={!!rejectModalItem}
            onClose={() => setRejectModalItem(null)}
            onConfirm={(reason) => handleReject(rejectModalItem, reason)}
          />
        )}

        {/* 승인 코멘트 다이얼로그 (commentRequired 카테고리용) */}
        <Dialog
          open={!!approveCommentItem}
          onOpenChange={(open) => {
            if (!open) {
              setApproveCommentItem(null);
              setApproveComment('');
            }
          }}
        >
          <DialogContent>
            {approveCommentItem && (
              <>
                <DialogHeader>
                  <DialogTitle>
                    {commentMeta?.commentDialogTitleKey
                      ? t(`tabMeta.${approveCommentItem.category}.commentDialogTitle`)
                      : t('commentDialog.titleFallback')}
                  </DialogTitle>
                  <DialogDescription>
                    {getLocalizedSummary(approveCommentItem, t, siteLabels)}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="approve-comment">{t('commentDialog.label')} *</Label>
                    <Textarea
                      id="approve-comment"
                      placeholder={
                        commentMeta?.commentPlaceholderKey
                          ? t(`tabMeta.${approveCommentItem.category}.commentPlaceholder`)
                          : t('commentDialog.placeholderFallback')
                      }
                      value={approveComment}
                      onChange={(e) => setApproveComment(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setApproveCommentItem(null);
                      setApproveComment('');
                    }}
                  >
                    {t('actions.cancel')}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleApproveWithComment}
                    disabled={!approveComment.trim() || approveMutation.isPending}
                    loading={approveMutation.isPending}
                    className={getApprovalActionButtonClasses('approve')}
                  >
                    {t(`tabMeta.${approveCommentItem.category}.action`)}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* 벌크 승인 코멘트 다이얼로그 (commentRequired 카테고리용) */}
        <Dialog
          open={isBulkApproveCommentOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsBulkApproveCommentOpen(false);
              setBulkApproveComment('');
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {activeTabMeta?.commentDialogTitleKey
                  ? t(`tabMeta.${activeTab}.commentDialogTitle`)
                  : t('bulkCommentDialog.titleFallback')}
              </DialogTitle>
              <DialogDescription>
                {t('bulkCommentDialog.description', { count: selection.count })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-approve-comment">{t('bulkCommentDialog.label')} *</Label>
                <Textarea
                  id="bulk-approve-comment"
                  placeholder={
                    activeTabMeta?.commentPlaceholderKey
                      ? t(`tabMeta.${activeTab}.commentPlaceholder`)
                      : t('commentDialog.placeholderFallback')
                  }
                  value={bulkApproveComment}
                  onChange={(e) => setBulkApproveComment(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsBulkApproveCommentOpen(false);
                  setBulkApproveComment('');
                }}
              >
                {t('actions.cancel')}
              </Button>
              <Button
                type="button"
                onClick={handleBulkApproveWithComment}
                disabled={!bulkApproveComment.trim() || bulkApproveMutation.isPending}
                loading={bulkApproveMutation.isPending}
                className={getApprovalActionButtonClasses('approve')}
              >
                {t('bulkCommentDialog.buttonLabel', {
                  count: selection.count,
                  action: t(`tabMeta.${activeTab}.action`),
                })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
