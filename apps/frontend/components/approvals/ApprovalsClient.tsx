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
    successMessage: (_, { item }) => `${item.summary}이(가) 승인되었습니다.`,
    errorMessage: '승인 처리 중 오류가 발생했습니다.',
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
    successMessage: (_, { item }) => `${item.summary}이(가) 반려되었습니다.`,
    errorMessage: '반려 처리 중 오류가 발생했습니다.',
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
        return `${result.success.length}건 승인 완료, ${result.failed.length}건 실패`;
      }
      return `${result.success.length}건이 승인되었습니다.`;
    },
    errorMessage: '일괄 승인 중 오류가 발생했습니다.',
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
        return `${result.success.length}건 반려 완료, ${result.failed.length}건 실패`;
      }
      return `${result.success.length}건이 반려되었습니다.`;
    },
    errorMessage: '일괄 반려 중 오류가 발생했습니다.',
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
        <p>승인 권한이 없습니다.</p>
      </div>
    );
  }

  // 클라이언트 마운트 전: 스켈레톤 로더 표시
  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* 탭 목록 - 접근성 속성 포함 */}
        <TabsList
          className="flex flex-wrap gap-1 h-auto p-1 bg-muted/50"
          role="tablist"
          aria-label="승인 카테고리"
        >
          {availableTabs.map((tab) => {
            const meta = TAB_META[tab];
            const count = getCount(tab);

            return (
              <TabsTrigger
                key={tab}
                value={tab}
                className="flex items-center gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-ul-red"
                aria-selected={activeTab === tab}
              >
                {getIcon(meta.icon)}
                <span>{meta.label}</span>
                {count > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 min-w-5 px-1.5 bg-ul-orange text-white"
                    aria-label={`대기 ${count}건`}
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
          actionLabel={TAB_META[activeTab]?.action || '승인'}
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
              actionLabel={TAB_META[tab]?.action || '승인'}
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
          actionLabel={TAB_META[detailModalItem.category]?.action || '승인'}
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
            <DialogTitle>{commentMeta?.commentDialogTitle || '승인 코멘트'}</DialogTitle>
            <DialogDescription>{approveCommentItem?.summary}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approve-comment">검토 코멘트 *</Label>
              <Textarea
                id="approve-comment"
                placeholder={commentMeta?.commentPlaceholder || '검토 내용을 입력하세요'}
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
              취소
            </Button>
            <Button
              type="button"
              onClick={handleApproveWithComment}
              disabled={!approveComment.trim() || approveMutation.isPending}
            >
              {commentMeta?.action || '승인'}
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
            <DialogTitle>{activeTabMeta?.commentDialogTitle || '일괄 승인 코멘트'}</DialogTitle>
            <DialogDescription>
              선택된 {selectedItems.length}건에 공통 코멘트를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-approve-comment">검토 코멘트 *</Label>
              <Textarea
                id="bulk-approve-comment"
                placeholder={activeTabMeta?.commentPlaceholder || '검토 내용을 입력하세요'}
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
              취소
            </Button>
            <Button
              type="button"
              onClick={handleBulkApproveWithComment}
              disabled={!bulkApproveComment.trim() || bulkApproveMutation.isPending}
            >
              {selectedItems.length}건 {activeTabMeta?.action || '승인'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
