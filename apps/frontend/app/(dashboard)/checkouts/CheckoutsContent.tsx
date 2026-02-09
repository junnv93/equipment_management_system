'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, Clock, Search, Plus, Filter, MapPin } from 'lucide-react';
import checkoutApi, { Checkout, CheckoutQuery } from '@/lib/api/checkout-api';
import type { PaginatedResponse } from '@/lib/api/types';
import {
  CHECKOUT_STATUS_LABELS,
  CHECKOUT_STATUS_FILTER_OPTIONS,
  CheckoutStatus,
} from '@equipment-management/schemas';
import CheckoutGroupCard from '@/components/checkouts/CheckoutGroupCard';
import { groupCheckoutsByDateAndDestination } from '@/lib/utils/checkout-group-utils';

interface CheckoutSummary {
  total: number;
  pending: number;
  approved: number;
  overdue: number;
  returnedToday: number;
}

interface CheckoutsContentProps {
  /** 서버에서 가져온 초기 반출 목록 */
  initialData: PaginatedResponse<Checkout>;
  /** 서버에서 가져온 초기 요약 정보 */
  initialSummary: CheckoutSummary;
}

/**
 * 반출입 관리 Client Component
 *
 * Server Component에서 초기 데이터를 받아 React Query로 관리합니다.
 * 탭/필터 변경 시 클라이언트에서 재조회합니다.
 *
 * 비즈니스 로직:
 * - 장비 반출 요청 및 현황 관리
 * - 반출 상태: CHECKOUT_STATUS_LABELS (SSOT) 기반 13개 상태
 * - 반출지: DB에서 동적으로 조회
 */
export default function CheckoutsContent({ initialData, initialSummary }: CheckoutsContentProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  // 반출 요약 정보 (초기 데이터 활용)
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['checkout-summary'],
    queryFn: async () => {
      const response = await checkoutApi.getCheckouts({ pageSize: 1 });
      return {
        total: response.meta.pagination.total,
        pending: 0,
        approved: 0,
        overdue: 0,
        returnedToday: 0,
      };
    },
    initialData: initialSummary,
    staleTime: 30 * 1000,
  });

  // 반출 목록 (초기 데이터 활용)
  const { data: checkoutsData, isLoading: checkoutsLoading } = useQuery({
    queryKey: ['checkouts', currentTab, statusFilter, locationFilter, searchTerm],
    queryFn: async () => {
      const query: CheckoutQuery = {
        pageSize: 100,
        search: searchTerm || undefined,
      };

      if (statusFilter !== 'all') {
        query.statuses = statusFilter;
      }

      if (locationFilter !== 'all') {
        query.destination = locationFilter;
      }

      switch (currentTab) {
        case 'overdue':
          return checkoutApi.getCheckouts({ ...query, statuses: 'overdue' });
        case 'today':
          const today = new Date().toISOString().split('T')[0];
          return checkoutApi.getCheckouts({ ...query, endDate: today });
        default:
          return checkoutApi.getCheckouts(query);
      }
    },
    // ✅ 초기 데이터 활용 (필터가 기본값일 때만)
    initialData:
      currentTab === 'all' && statusFilter === 'all' && locationFilter === 'all' && !searchTerm
        ? initialData
        : undefined,
    staleTime: 30 * 1000,
  });

  // ✅ SSOT: 반출지 목록 DB 기반 조회
  const { data: destinations } = useQuery({
    queryKey: ['checkout-destinations'],
    queryFn: () => checkoutApi.getDestinations(),
    staleTime: 5 * 60 * 1000,
  });

  // ✅ 그룹화: 날짜 + 반출지 기준으로 checkout 그룹 생성
  const groups = useMemo(() => {
    if (!checkoutsData?.data) return [];
    return groupCheckoutsByDateAndDestination(checkoutsData.data);
  }, [checkoutsData?.data]);

  // ✅ SSOT: 반출 상태에 따른 배지 스타일 (CHECKOUT_STATUS_LABELS 기반)
  const statusStyles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-blue-100 text-blue-800 border-blue-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    checked_out: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    lender_checked: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    borrower_received: 'bg-teal-100 text-teal-800 border-teal-200',
    in_use: 'bg-purple-100 text-purple-800 border-purple-200',
    borrower_returned: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    lender_received: 'bg-lime-100 text-lime-800 border-lime-200',
    returned: 'bg-green-100 text-green-800 border-green-200',
    return_approved: 'bg-green-100 text-green-800 border-green-200',
    overdue: 'bg-red-100 text-red-800 border-red-200',
    canceled: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const getCheckoutStatusBadge = (status: string) => {
    return (
      <Badge variant="outline" className={statusStyles[status] || ''}>
        {CHECKOUT_STATUS_LABELS[status as CheckoutStatus] || status}
      </Badge>
    );
  };

  // 검색어 변경 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // 상태 필터 변경 핸들러
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
  };

  // 위치 필터 변경 핸들러
  const handleLocationChange = (value: string) => {
    setLocationFilter(value);
  };

  // 탭 변경 핸들러
  const handleTabChange = (value: string) => {
    setCurrentTab(value);
  };

  // 검색 결과가 없는 경우 표시할 UI
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <ClipboardList className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900">반출 정보가 없습니다</h3>
      <p className="text-sm text-gray-500 mt-2 mb-4">검색 조건에 맞는 반출 정보가 없습니다.</p>
      <Button
        variant="outline"
        onClick={() => {
          setSearchTerm('');
          setStatusFilter('all');
          setLocationFilter('all');
        }}
      >
        필터 초기화
      </Button>
    </div>
  );

  // 로딩 중 표시할 UI (카드형 스켈레톤)
  const renderLoadingState = () => (
    <>
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-4">
              <Skeleton className="h-5 w-[100px]" />
              <Skeleton className="h-5 w-[120px]" />
              <Skeleton className="h-5 w-[60px]" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-[60px]" />
              <Skeleton className="h-5 w-[50px]" />
            </div>
          </div>
        </Card>
      ))}
    </>
  );

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">반출입 관리</h1>
          <p className="text-muted-foreground">장비 반출입 요청 및 현황을 관리합니다.</p>
        </div>
        <Button onClick={() => router.push('/checkouts/create')}>
          <Plus className="mr-2 h-4 w-4" /> 반출 신청
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">전체 반출</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{summary?.total || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">승인 대기중</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{summary?.pending || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">반입 기한 초과</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{summary?.overdue || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">오늘 반입 예정</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{summary?.returnedToday || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 탭과 필터 */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">전체 반출</TabsTrigger>
            <TabsTrigger value="overdue">기한 초과</TabsTrigger>
            <TabsTrigger value="today">오늘 반입</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="장비 또는 사용자 검색"
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px]">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <span>상태</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {CHECKOUT_STATUS_FILTER_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {CHECKOUT_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={handleLocationChange}>
            <SelectTrigger className="w-[140px]">
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                <span>반출지</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {destinations?.map((dest) => (
                <SelectItem key={dest} value={dest}>
                  {dest}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 반출 목록 - 그룹 카드 */}
      <div className="space-y-3">
        {checkoutsLoading
          ? renderLoadingState()
          : groups.length === 0
            ? renderEmptyState()
            : groups.map((group) => (
                <CheckoutGroupCard
                  key={group.key}
                  group={group}
                  onCheckoutClick={(id) => router.push(`/checkouts/${id}`)}
                  getStatusBadge={getCheckoutStatusBadge}
                />
              ))}
      </div>
    </div>
  );
}
