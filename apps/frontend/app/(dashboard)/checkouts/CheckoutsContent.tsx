'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Building, ClipboardList, Clock, Search, Plus, Filter, MapPin } from 'lucide-react';
import checkoutApi, { Checkout, CheckoutQuery } from '@/lib/api/checkout-api';
import type { PaginatedResponse } from '@/lib/api/types';

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
 * 반출 관리 Client Component
 *
 * Server Component에서 초기 데이터를 받아 React Query로 관리합니다.
 * 탭/필터 변경 시 클라이언트에서 재조회합니다.
 *
 * 비즈니스 로직:
 * - 장비 반출 요청 및 현황 관리
 * - 반출 상태: 승인대기, 1차승인, 최종승인, 반출중, 거부됨, 반입됨, 기한초과
 * - 반출지: 고객사, 협력사, 지사, 전시회, 기타
 */
export default function CheckoutsContent({
  initialData,
  initialSummary,
}: CheckoutsContentProps) {
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
        query.status = statusFilter;
      }

      if (locationFilter !== 'all') {
        query.location = locationFilter;
      }

      switch (currentTab) {
        case 'overdue':
          return checkoutApi.getCheckouts({ ...query, status: 'overdue' });
        case 'today':
          const today = new Date().toISOString().split('T')[0];
          return checkoutApi.getCheckouts({ ...query, endDate: today });
        default:
          return checkoutApi.getCheckouts(query);
      }
    },
    // ✅ 초기 데이터 활용 (필터가 기본값일 때만)
    initialData:
      currentTab === 'all' &&
      statusFilter === 'all' &&
      locationFilter === 'all' &&
      !searchTerm
        ? initialData
        : undefined,
    staleTime: 30 * 1000,
  });

  // 반출 상태에 따른 배지 스타일
  const getCheckoutStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 hover:bg-yellow-50">
            승인 대기중
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-800 hover:bg-blue-50">
            1차 승인
          </Badge>
        );
      case 'approved_legacy':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-800 hover:bg-green-50">
            최종 승인
          </Badge>
        );
      case 'checked_out':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-800 hover:bg-blue-50">
            반출 중
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-800 hover:bg-red-50">
            거부됨
          </Badge>
        );
      case 'returned':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-800 hover:bg-green-50">
            반입됨
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-900 hover:bg-red-100">
            기한 초과
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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

  // 로딩 중 표시할 UI
  const renderLoadingState = () => (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-5 w-[180px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-[120px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-[100px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-[120px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-[80px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-[80px]" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">반출 관리</h1>
          <p className="text-muted-foreground">장비 반출 요청 및 현황을 관리합니다.</p>
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
            <SelectTrigger className="w-[130px]">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <span>상태</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">승인 대기중</SelectItem>
              <SelectItem value="checked_out">반출 중</SelectItem>
              <SelectItem value="rejected">거부됨</SelectItem>
              <SelectItem value="returned">반입됨</SelectItem>
              <SelectItem value="overdue">기한 초과</SelectItem>
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={handleLocationChange}>
            <SelectTrigger className="w-[130px]">
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                <span>반출지</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="customer">고객사</SelectItem>
              <SelectItem value="partner">협력사</SelectItem>
              <SelectItem value="branch">지사</SelectItem>
              <SelectItem value="exhibition">전시회</SelectItem>
              <SelectItem value="other">기타</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 반출 목록 테이블 */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>장비</TableHead>
              <TableHead>신청자</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>반출지</TableHead>
              <TableHead>반출일</TableHead>
              <TableHead>반입 예정일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checkoutsLoading ? (
              renderLoadingState()
            ) : checkoutsData?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {renderEmptyState()}
                </TableCell>
              </TableRow>
            ) : (
              checkoutsData?.data?.map((checkout: Checkout) => (
                <TableRow
                  key={checkout.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/checkouts/${checkout.id}`)}
                >
                  <TableCell className="font-medium">
                    {checkout.equipment && checkout.equipment.length > 0
                      ? `${checkout.equipment[0].name} ${checkout.equipment.length > 1 ? `외 ${checkout.equipment.length - 1}건` : ''}`
                      : '장비 정보 없음'}
                  </TableCell>
                  <TableCell>{checkout.user?.name || '알 수 없는 사용자'}</TableCell>
                  <TableCell>{getCheckoutStatusBadge(checkout.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-1 text-gray-500" />
                      {checkout.destination || checkout.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    {checkout.startDate
                      ? format(new Date(checkout.startDate), 'yyyy-MM-dd', { locale: ko })
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {checkout.expectedReturnDate
                      ? format(new Date(checkout.expectedReturnDate), 'yyyy-MM-dd', { locale: ko })
                      : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
