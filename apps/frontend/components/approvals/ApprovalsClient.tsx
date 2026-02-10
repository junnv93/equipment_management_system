'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
import approvalsApi, {
  type ApprovalCategory,
  type ApprovalItem,
  ROLE_TABS,
  TAB_META,
} from '@/lib/api/approvals-api';
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ✅ 세션 초기화 대기: API 호출 전에 NextAuth 세션이 준비되어야 함
  const { status: sessionStatus } = useSession();
  const isSessionReady = sessionStatus === 'authenticated';

  // ✅ Hydration 에러 방지: 클라이언트 마운트 감지
  const [mounted, setMounted] = useState(false);

  // 현재 역할에서 사용 가능한 탭 (useMemo로 안정화)
  const availableTabs = useMemo(() => ROLE_TABS[userRole] || [], [userRole]);
  const defaultTab = initialTab || availableTabs[0] || 'equipment';

  const [activeTab, setActiveTab] = useState<ApprovalCategory>(defaultTab as ApprovalCategory);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [detailModalItem, setDetailModalItem] = useState<ApprovalItem | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<ApprovalItem | null>(null);

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
    queryKey: ['approvals', activeTab, userTeamId],
    queryFn: () => approvalsApi.getPendingItems(activeTab, userTeamId),
    enabled: isSessionReady, // ✅ 세션 준비될 때까지 대기
    staleTime: 30000, // 30초
  });

  // 카테고리별 대기 개수 조회
  const { data: pendingCounts } = useQuery({
    queryKey: ['approval-counts', userRole],
    queryFn: () => approvalsApi.getPendingCounts(userRole),
    enabled: isSessionReady, // ✅ 세션 준비될 때까지 대기
    staleTime: 60000, // 1분
  });

  // 승인 처리
  const handleApprove = useCallback(
    async (item: ApprovalItem) => {
      try {
        // equipmentId 추출 (폐기 승인에 필요)
        const equipmentId = item.details?.equipmentId as string | undefined;
        await approvalsApi.approve(item.category, item.id, userId, undefined, equipmentId);
        toast({
          title: '승인 완료',
          description: `${item.summary}이(가) 승인되었습니다.`,
        });
        queryClient.invalidateQueries({ queryKey: ['approvals'] });
        queryClient.invalidateQueries({ queryKey: ['approval-counts'] });
        // Close the detail modal after successful approval
        setDetailModalItem(null);
      } catch (error) {
        toast({
          title: '승인 실패',
          description: '승인 처리 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [userId, toast, queryClient]
  );

  // 반려 처리
  const handleReject = useCallback(
    async (item: ApprovalItem, reason: string) => {
      try {
        // equipmentId 추출 (폐기 반려에 필요)
        const equipmentId = item.details?.equipmentId as string | undefined;
        await approvalsApi.reject(item.category, item.id, userId, reason, equipmentId);
        toast({
          title: '반려 완료',
          description: `${item.summary}이(가) 반려되었습니다.`,
        });
        queryClient.invalidateQueries({ queryKey: ['approvals'] });
        queryClient.invalidateQueries({ queryKey: ['approval-counts'] });
        setRejectModalItem(null);
      } catch (error) {
        toast({
          title: '반려 실패',
          description: '반려 처리 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [userId, toast, queryClient]
  );

  // 일괄 승인 처리
  const handleBulkApprove = useCallback(async () => {
    if (selectedItems.length === 0) return;

    const result = await approvalsApi.bulkApprove(activeTab, selectedItems, userId);

    if (result.success.length > 0) {
      toast({
        title: '일괄 승인 완료',
        description: `${result.success.length}건이 승인되었습니다.`,
      });
    }

    if (result.failed.length > 0) {
      toast({
        title: '일부 승인 실패',
        description: `${result.failed.length}건 승인에 실패했습니다.`,
        variant: 'destructive',
      });
    }

    setSelectedItems([]);
    queryClient.invalidateQueries({ queryKey: ['approvals'] });
    queryClient.invalidateQueries({ queryKey: ['approval-counts'] });
  }, [activeTab, selectedItems, userId, toast, queryClient]);

  // 일괄 반려 처리
  const handleBulkReject = useCallback(
    async (reason: string) => {
      if (selectedItems.length === 0) return;

      const result = await approvalsApi.bulkReject(activeTab, selectedItems, userId, reason);

      if (result.success.length > 0) {
        toast({
          title: '일괄 반려 완료',
          description: `${result.success.length}건이 반려되었습니다.`,
        });
      }

      if (result.failed.length > 0) {
        toast({
          title: '일부 반려 실패',
          description: `${result.failed.length}건 반려에 실패했습니다.`,
          variant: 'destructive',
        });
      }

      setSelectedItems([]);
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-counts'] });
    },
    [activeTab, selectedItems, userId, toast, queryClient]
  );

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
    </div>
  );
}
