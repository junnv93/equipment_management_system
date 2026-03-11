'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { CHECKOUT_APPROVAL_INVALIDATE_KEYS } from '@/lib/query-keys/checkout-keys';
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
import type { UserRole } from '@equipment-management/schemas';
import { useTranslations } from 'next-intl';
import {
  type ApprovalCategory,
  type ApprovalItem,
  ROLE_TABS,
  TAB_META,
} from '@/lib/api/approvals-api';
import { useApprovalsApi } from '@/lib/api/hooks/use-approvals-api';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { ApprovalKpiStrip } from './ApprovalKpiStrip';
import { ApprovalCategorySidebar } from './ApprovalCategorySidebar';
import { ApprovalMobileCategoryBar } from './ApprovalMobileCategoryBar';
import { ApprovalList } from './ApprovalList';
import { BulkActionBar } from './BulkActionBar';
import ApprovalDetailModal from './ApprovalDetailModal';
import RejectModal from './RejectModal';
import { useApprovalKpi } from '@/hooks/use-approval-kpi';
import { APPROVAL_MOTION, getApprovalActionButtonClasses } from '@/lib/design-tokens';

interface ApprovalsClientProps {
  userRole: UserRole;
  userId: string;
  userTeamId?: string;
  initialTab?: string;
}

export function ApprovalsClient({
  userRole,
  userId,
  userTeamId,
  initialTab,
}: ApprovalsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const approvalsApi = useApprovalsApi();
  const t = useTranslations('approvals');

  // 현재 역할에서 사용 가능한 탭 (useMemo로 안정화)
  const availableTabs = useMemo(() => ROLE_TABS[userRole] || [], [userRole]);
  const defaultTab = initialTab || availableTabs[0] || 'equipment';

  const [activeTab, setActiveTab] = useState<ApprovalCategory>(defaultTab as ApprovalCategory);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [detailModalItem, setDetailModalItem] = useState<ApprovalItem | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<ApprovalItem | null>(null);

  // 처리 중/퇴장 애니메이션 상태
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());

  // 승인 코멘트 다이얼로그 상태 (commentRequired 카테고리용)
  const [approveCommentItem, setApproveCommentItem] = useState<ApprovalItem | null>(null);
  const [approveComment, setApproveComment] = useState('');
  // 벌크 승인 코멘트 다이얼로그 상태
  const [isBulkApproveCommentOpen, setIsBulkApproveCommentOpen] = useState(false);
  const [bulkApproveComment, setBulkApproveComment] = useState('');

  // URL 쿼리 파라미터 동기화
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && availableTabs.includes(tabParam as ApprovalCategory)) {
      setActiveTab(tabParam as ApprovalCategory);
    }
  }, [searchParams, availableTabs]);

  // 탭 변경 핸들러
  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab as ApprovalCategory);
      setSelectedItems([]);
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // 승인 대기 목록 조회
  const { data: pendingItems = [], isLoading } = useQuery({
    queryKey: queryKeys.approvals.list(activeTab, userTeamId),
    queryFn: () => approvalsApi.getPendingItems(activeTab, userTeamId),
    staleTime: CACHE_TIMES.SHORT,
  });

  // 경과일 내림차순 정렬 (오래된 건 상단)
  const sortedItems = useMemo(() => {
    return [...pendingItems].sort(
      (a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime()
    );
  }, [pendingItems]);

  // 카테고리별 대기 개수 조회
  const { data: pendingCounts } = useQuery({
    queryKey: queryKeys.approvals.counts(userRole),
    queryFn: () => approvalsApi.getPendingCounts(userRole),
    staleTime: CACHE_TIMES.MEDIUM,
  });

  // KPI 데이터 (기존 쿼리에서 파생 — 추가 API 호출 없음)
  const kpi = useApprovalKpi(pendingCounts, sortedItems, availableTabs);

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
        userId,
        comment,
        equipmentId,
        item.originalData
      );
    },
    queryKey: queryKeys.approvals.list(activeTab, userTeamId),
    optimisticUpdate: (old) => old || [],
    invalidateKeys: [queryKeys.approvals.counts(userRole), ...CHECKOUT_APPROVAL_INVALIDATE_KEYS],
    successMessage: (_, { item }) => t('toasts.approveDynamic', { summary: item.summary }),
    errorMessage: t('toasts.approveError'),
    onSuccessCallback: (_, { item }) => {
      setProcessingIds((prev) => {
        const s = new Set(prev);
        s.delete(item.id);
        return s;
      });
      setExitingIds((prev) => new Set(prev).add(item.id));
      setTimeout(() => {
        setExitingIds((prev) => {
          const s = new Set(prev);
          s.delete(item.id);
          return s;
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
      await approvalsApi.reject(
        item.category,
        item.id,
        userId,
        reason,
        equipmentId,
        item.originalData
      );
    },
    queryKey: queryKeys.approvals.list(activeTab, userTeamId),
    optimisticUpdate: (old) => old || [],
    invalidateKeys: [queryKeys.approvals.counts(userRole), ...CHECKOUT_APPROVAL_INVALIDATE_KEYS],
    successMessage: (_, { item }) => t('toasts.rejectDynamic', { summary: item.summary }),
    errorMessage: t('toasts.rejectError'),
    onSuccessCallback: (_, { item }) => {
      setProcessingIds((prev) => {
        const s = new Set(prev);
        s.delete(item.id);
        return s;
      });
      setExitingIds((prev) => new Set(prev).add(item.id));
      setTimeout(() => {
        setExitingIds((prev) => {
          const s = new Set(prev);
          s.delete(item.id);
          return s;
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
      return await approvalsApi.bulkApprove(activeTab, ids, userId, comment);
    },
    queryKey: queryKeys.approvals.list(activeTab, userTeamId),
    optimisticUpdate: (old) => old || [],
    invalidateKeys: [queryKeys.approvals.counts(userRole), ...CHECKOUT_APPROVAL_INVALIDATE_KEYS],
    successMessage: (result) => {
      if (result.failed.length > 0) {
        return t('toasts.bulkApproveResult', {
          success: result.success.length,
          failed: result.failed.length,
        });
      }
      return t('toasts.bulkApproveAll', { count: result.success.length });
    },
    errorMessage: t('toasts.bulkApproveError'),
    onSuccessCallback: (_, { ids }) => {
      setProcessingIds((prev) => {
        const s = new Set(prev);
        ids.forEach((id) => s.delete(id));
        return s;
      });
      setExitingIds((prev) => new Set(Array.from(prev).concat(ids)));
      setTimeout(() => {
        setExitingIds((prev) => {
          const s = new Set(prev);
          ids.forEach((id) => s.delete(id));
          return s;
        });
      }, APPROVAL_MOTION.exitDurationMs);
      setSelectedItems([]);
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
    if (selectedItems.length === 0) return;
    const meta = TAB_META[activeTab];
    if (meta?.commentRequired) {
      setIsBulkApproveCommentOpen(true);
      setBulkApproveComment('');
    } else {
      setProcessingIds((prev) => new Set(Array.from(prev).concat(selectedItems)));
      bulkApproveMutation.mutate({ ids: selectedItems });
    }
  };

  const handleBulkApproveWithComment = () => {
    if (!bulkApproveComment.trim()) return;
    setProcessingIds((prev) => new Set(Array.from(prev).concat(selectedItems)));
    bulkApproveMutation.mutate({ ids: selectedItems, comment: bulkApproveComment });
  };

  // ✅ 일괄 반려 처리
  const bulkRejectMutation = useOptimisticMutation<
    { success: string[]; failed: string[] },
    { ids: string[]; reason: string },
    ApprovalItem[]
  >({
    mutationFn: async ({ ids, reason }) => {
      return await approvalsApi.bulkReject(activeTab, ids, userId, reason);
    },
    queryKey: queryKeys.approvals.list(activeTab, userTeamId),
    optimisticUpdate: (old) => old || [],
    invalidateKeys: [queryKeys.approvals.counts(userRole), ...CHECKOUT_APPROVAL_INVALIDATE_KEYS],
    successMessage: (result) => {
      if (result.failed.length > 0) {
        return t('toasts.bulkRejectResult', {
          success: result.success.length,
          failed: result.failed.length,
        });
      }
      return t('toasts.bulkRejectAll', { count: result.success.length });
    },
    errorMessage: t('toasts.bulkRejectError'),
    onSuccessCallback: (_, { ids }) => {
      setProcessingIds((prev) => {
        const s = new Set(prev);
        ids.forEach((id) => s.delete(id));
        return s;
      });
      setExitingIds((prev) => new Set(Array.from(prev).concat(ids)));
      setTimeout(() => {
        setExitingIds((prev) => {
          const s = new Set(prev);
          ids.forEach((id) => s.delete(id));
          return s;
        });
      }, APPROVAL_MOTION.exitDurationMs);
      setSelectedItems([]);
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
    if (selectedItems.length === 0) return;
    setProcessingIds((prev) => new Set(Array.from(prev).concat(selectedItems)));
    await bulkRejectMutation.mutateAsync({ ids: selectedItems, reason });
  };

  // 선택 토글
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }, []);

  // 전체 선택
  const handleSelectAll = useCallback(() => {
    if (selectedItems.length === sortedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(sortedItems.map((item) => item.id));
    }
  }, [sortedItems, selectedItems.length]);

  // 현재 탭의 코멘트 다이얼로그 메타 (SSOT: TAB_META)
  const activeTabMeta = TAB_META[activeTab];
  const commentMeta = approveCommentItem ? TAB_META[approveCommentItem.category] : null;

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
          todayProcessed={kpi.todayProcessed}
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
            {/* Bulk Action Bar */}
            <BulkActionBar
              selectedCount={selectedItems.length}
              totalCount={sortedItems.length}
              onSelectAll={handleSelectAll}
              onBulkApprove={handleBulkApprove}
              onBulkReject={handleBulkReject}
              actionLabel={t(`tabMeta.${activeTab}.action`)}
            />

            {/* Single list — no TabsContent loop */}
            <ApprovalList
              items={sortedItems}
              isLoading={isLoading}
              selectedItems={selectedItems}
              processingIds={processingIds}
              exitingIds={exitingIds}
              onToggleSelect={handleToggleSelect}
              onApprove={handleApprove}
              onReject={(item) => setRejectModalItem(item)}
              onViewDetail={(item) => setDetailModalItem(item)}
              actionLabel={t(`tabMeta.${activeTab}.action`)}
            />
          </div>
        </div>

        {/* 상세 보기 모달 */}
        {detailModalItem && (
          <ApprovalDetailModal
            item={detailModalItem}
            isOpen={!!detailModalItem}
            onClose={() => setDetailModalItem(null)}
            onApprove={() => handleApprove(detailModalItem)}
            onReject={() => {
              setDetailModalItem(null);
              setRejectModalItem(detailModalItem);
            }}
            actionLabel={t(`tabMeta.${detailModalItem.category}.action`)}
          />
        )}

        {/* 반려 모달 */}
        {rejectModalItem && (
          <RejectModal
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
                    {commentMeta?.commentDialogTitle
                      ? t(`tabMeta.${approveCommentItem.category}.commentDialogTitle`)
                      : t('commentDialog.titleFallback')}
                  </DialogTitle>
                  <DialogDescription>{approveCommentItem.summary}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="approve-comment">{t('commentDialog.label')} *</Label>
                    <Textarea
                      id="approve-comment"
                      placeholder={
                        commentMeta?.commentPlaceholder
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
                {activeTabMeta?.commentDialogTitle
                  ? t(`tabMeta.${activeTab}.commentDialogTitle`)
                  : t('bulkCommentDialog.titleFallback')}
              </DialogTitle>
              <DialogDescription>
                {t('bulkCommentDialog.description', { count: selectedItems.length })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-approve-comment">{t('bulkCommentDialog.label')} *</Label>
                <Textarea
                  id="bulk-approve-comment"
                  placeholder={
                    activeTabMeta?.commentPlaceholder
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
                className={getApprovalActionButtonClasses('approve')}
              >
                {t('bulkCommentDialog.buttonLabel', {
                  count: selectedItems.length,
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
