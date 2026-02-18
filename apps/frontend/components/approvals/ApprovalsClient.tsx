'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { CHECKOUT_APPROVAL_INVALIDATE_KEYS } from '@/lib/query-keys/checkout-keys';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
import {
  Package,
  FileCheck,
  ClipboardCheck,
  ArrowUpFromLine,
  ArrowDownToLine,
  Share2,
  AlertTriangle,
  Trash2,
  Calendar,
  Code,
  PackagePlus,
} from 'lucide-react';
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
import { ApprovalList } from './ApprovalList';
import { BulkActionBar } from './BulkActionBar';
import ApprovalDetailModal from './ApprovalDetailModal';
import RejectModal from './RejectModal';
import {
  APPROVAL_TAB_TOKENS,
  APPROVAL_MOTION,
  getApprovalActionButtonClasses,
  getCountBasedUrgency,
  getUrgencyFeedbackClasses,
} from '@/lib/design-tokens';

interface ApprovalsClientProps {
  userRole: UserRole;
  userId: string;
  userTeamId?: string;
  initialTab?: string;
}

// 아이콘 개별 import 매핑
const ICONS: Record<string, React.ElementType> = {
  Package,
  FileCheck,
  ClipboardCheck,
  ArrowUpFromLine,
  ArrowDownToLine,
  Share2,
  AlertTriangle,
  Trash2,
  Calendar,
  Code,
  PackagePlus,
};

export function ApprovalsClient({
  userRole,
  userId,
  userTeamId,
  initialTab,
}: ApprovalsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ Best Practice: useAuthenticatedClient를 통한 인증된 API 클라이언트 사용
  const approvalsApi = useApprovalsApi();
  const t = useTranslations('approvals');

  // ✅ Hydration 에러 방지: 클라이언트 마운트 감지
  const [mounted, setMounted] = useState(false);

  // 현재 역할에서 사용 가능한 탭 (useMemo로 안정화)
  const availableTabs = useMemo(() => ROLE_TABS[userRole] || [], [userRole]);
  const defaultTab = initialTab || availableTabs[0] || 'equipment';

  const [activeTab, setActiveTab] = useState<ApprovalCategory>(defaultTab as ApprovalCategory);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [detailModalItem, setDetailModalItem] = useState<ApprovalItem | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<ApprovalItem | null>(null);

  // ✅ 승인 코멘트 다이얼로그 상태 (commentRequired 카테고리용)
  const [approveCommentItem, setApproveCommentItem] = useState<ApprovalItem | null>(null);
  const [approveComment, setApproveComment] = useState('');
  // 벌크 승인 코멘트 다이얼로그 상태
  const [isBulkApproveCommentOpen, setIsBulkApproveCommentOpen] = useState(false);
  const [bulkApproveComment, setBulkApproveComment] = useState('');

  // 클라이언트 마운트 후에만 Radix UI 렌더링 (useId 충돌 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // 카테고리별 대기 개수 조회
  // SSOT: 네비 뱃지, 대시보드 카드와 동일한 query key 공유
  const { data: pendingCounts } = useQuery({
    queryKey: queryKeys.approvals.counts(userRole),
    queryFn: () => approvalsApi.getPendingCounts(userRole),
    staleTime: CACHE_TIMES.MEDIUM,
  });

  // ✅ 승인 처리 - Optimistic Update 패턴
  // 타입 변경: ApprovalItem → { item, comment? } — 코멘트 전달 지원
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
    optimisticUpdate: (old, { item }) => {
      // ✅ 승인한 항목만 즉시 제거 (전체 재조회 불필요)
      return old?.filter((i) => i.id !== item.id) || [];
    },
    invalidateKeys: [queryKeys.approvals.counts(userRole), ...CHECKOUT_APPROVAL_INVALIDATE_KEYS],
    successMessage: (_, { item }) => t('toasts.approveDynamic', { summary: item.summary }),
    errorMessage: t('toasts.approveError'),
    onSuccessCallback: () => {
      setDetailModalItem(null);
      setApproveCommentItem(null);
      setApproveComment('');
    },
  });

  /**
   * 승인 핸들러 — SSOT: TAB_META.commentRequired 기반 분기
   *
   * commentRequired=true → 코멘트 입력 다이얼로그 표시
   * commentRequired=false → 직접 mutation 실행
   */
  const handleApprove = (item: ApprovalItem) => {
    const meta = TAB_META[item.category];
    if (meta?.commentRequired) {
      // 상세 모달이 열려있으면 닫고 코멘트 다이얼로그로 전환
      setDetailModalItem(null);
      setApproveCommentItem(item);
      setApproveComment('');
    } else {
      approveMutation.mutate({ item });
    }
  };

  /**
   * 코멘트 다이얼로그에서 확인 클릭 시
   */
  const handleApproveWithComment = () => {
    if (!approveCommentItem || !approveComment.trim()) return;
    approveMutation.mutate({ item: approveCommentItem, comment: approveComment });
  };

  // ✅ 반려 처리 - Optimistic Update 패턴
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
    optimisticUpdate: (old, { item }) => {
      // ✅ 반려한 항목만 즉시 제거
      return old?.filter((i) => i.id !== item.id) || [];
    },
    invalidateKeys: [queryKeys.approvals.counts(userRole), ...CHECKOUT_APPROVAL_INVALIDATE_KEYS],
    successMessage: (_, { item }) => t('toasts.rejectDynamic', { summary: item.summary }),
    errorMessage: t('toasts.rejectError'),
    onSuccessCallback: () => setRejectModalItem(null),
  });

  const handleReject = async (item: ApprovalItem, reason: string) => {
    await rejectMutation.mutateAsync({ item, reason });
  };

  // ✅ 일괄 승인 처리 - Optimistic Update 패턴
  const bulkApproveMutation = useOptimisticMutation<
    { success: string[]; failed: string[] },
    { ids: string[]; comment?: string },
    ApprovalItem[]
  >({
    mutationFn: async ({ ids, comment }) => {
      return await approvalsApi.bulkApprove(activeTab, ids, userId, comment);
    },
    queryKey: queryKeys.approvals.list(activeTab, userTeamId),
    optimisticUpdate: (old, { ids }) => {
      // ✅ 선택된 항목들만 즉시 제거 (낙관적 - 모두 성공 가정)
      return old?.filter((item) => !ids.includes(item.id)) || [];
    },
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
    onSuccessCallback: () => {
      setSelectedItems([]);
      setIsBulkApproveCommentOpen(false);
      setBulkApproveComment('');
    },
  });

  /**
   * 일괄 승인 핸들러 — commentRequired 카테고리는 코멘트 다이얼로그 표시
   */
  const handleBulkApprove = () => {
    if (selectedItems.length === 0) return;
    const meta = TAB_META[activeTab];
    if (meta?.commentRequired) {
      setIsBulkApproveCommentOpen(true);
      setBulkApproveComment('');
    } else {
      bulkApproveMutation.mutate({ ids: selectedItems });
    }
  };

  /**
   * 벌크 코멘트 다이얼로그에서 확인 클릭 시
   */
  const handleBulkApproveWithComment = () => {
    if (!bulkApproveComment.trim()) return;
    bulkApproveMutation.mutate({ ids: selectedItems, comment: bulkApproveComment });
  };

  // ✅ 일괄 반려 처리 - Optimistic Update 패턴
  const bulkRejectMutation = useOptimisticMutation<
    { success: string[]; failed: string[] },
    { ids: string[]; reason: string },
    ApprovalItem[]
  >({
    mutationFn: async ({ ids, reason }) => {
      return await approvalsApi.bulkReject(activeTab, ids, userId, reason);
    },
    queryKey: queryKeys.approvals.list(activeTab, userTeamId),
    optimisticUpdate: (old, { ids }) => {
      // ✅ 선택된 항목들만 즉시 제거 (낙관적 - 모두 성공 가정)
      return old?.filter((item) => !ids.includes(item.id)) || [];
    },
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
    onSuccessCallback: () => setSelectedItems([]),
  });

  const handleBulkReject = async (reason: string) => {
    if (selectedItems.length === 0) return;
    await bulkRejectMutation.mutateAsync({ ids: selectedItems, reason });
  };

  // 선택 토글
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }, []);

  // 전체 선택
  const handleSelectAll = useCallback(() => {
    if (selectedItems.length === pendingItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(pendingItems.map((item) => item.id));
    }
  }, [pendingItems, selectedItems.length]);

  // 탭에 표시할 아이콘 컴포넌트 가져오기
  const getIcon = (iconName: string) => {
    const IconComponent = ICONS[iconName];
    return IconComponent ? <IconComponent className="h-4 w-4 mr-1.5" /> : null;
  };

  // 탭에 표시할 대기 개수
  const getCount = (category: ApprovalCategory): number => {
    if (!pendingCounts) return 0;
    return pendingCounts[category] || 0;
  };

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

  // 클라이언트 마운트 전: 스켈레톤 로더 표시
  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className={`h-10 bg-muted rounded ${APPROVAL_MOTION.skeleton}`} />
        <div className={`h-64 bg-muted rounded ${APPROVAL_MOTION.skeleton}`} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* 탭 목록 - 접근성 속성 포함 */}
        <TabsList
          className={`flex flex-wrap gap-1 h-auto p-1 ${APPROVAL_TAB_TOKENS.listContainer}`}
          role="tablist"
          aria-label={t('ariaLabel')}
        >
          {availableTabs.map((tab) => {
            const meta = TAB_META[tab];
            const count = getCount(tab);
            const urgency = getCountBasedUrgency(count);

            return (
              <TabsTrigger
                key={tab}
                value={tab}
                className={`flex items-center gap-1.5 ${APPROVAL_TAB_TOKENS.activeIndicator}`}
                aria-selected={activeTab === tab}
              >
                {getIcon(meta.icon)}
                <span>{t(`tabMeta.${tab}.label`)}</span>
                {count > 0 && (
                  <Badge
                    variant="secondary"
                    className={`${APPROVAL_TAB_TOKENS.badge.base} ${getUrgencyFeedbackClasses(urgency, false)}`}
                    aria-label={t('badge.pending', { count })}
                  >
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* 일괄 처리 바 */}
        <BulkActionBar
          selectedCount={selectedItems.length}
          totalCount={pendingItems.length}
          onSelectAll={handleSelectAll}
          onBulkApprove={handleBulkApprove}
          onBulkReject={handleBulkReject}
          actionLabel={t(`tabMeta.${activeTab}.action`)}
        />

        {/* 탭 콘텐츠 */}
        {availableTabs.map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <ApprovalList
              items={activeTab === tab ? pendingItems : []}
              isLoading={isLoading && activeTab === tab}
              selectedItems={selectedItems}
              onToggleSelect={handleToggleSelect}
              onApprove={handleApprove}
              onReject={(item) => setRejectModalItem(item)}
              onViewDetail={(item) => setDetailModalItem(item)}
              actionLabel={t(`tabMeta.${tab}.action`)}
            />
          </TabsContent>
        ))}
      </Tabs>

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

      {/* ✅ 승인 코멘트 다이얼로그 (commentRequired 카테고리용) */}
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
          <DialogHeader>
            <DialogTitle>
              {commentMeta?.commentDialogTitle
                ? t(`tabMeta.${approveCommentItem!.category}.commentDialogTitle`)
                : t('commentDialog.titleFallback')}
            </DialogTitle>
            <DialogDescription>{approveCommentItem?.summary}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approve-comment">{t('commentDialog.label')} *</Label>
              <Textarea
                id="approve-comment"
                placeholder={
                  commentMeta?.commentPlaceholder
                    ? t(`tabMeta.${approveCommentItem!.category}.commentPlaceholder`)
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
              {t(`tabMeta.${approveCommentItem!.category}.action`)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ 벌크 승인 코멘트 다이얼로그 (commentRequired 카테고리용) */}
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
  );
}
