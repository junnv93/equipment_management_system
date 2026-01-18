'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import equipmentApi, { Equipment, EquipmentQuery } from '@/lib/api/equipment-api';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/shared/PageHeader';
import { useRouter } from 'next/navigation';
import debounce from 'lodash/debounce';
import VirtualizedEquipmentList from '@/components/equipment/VirtualizedEquipmentList';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import type { Site } from '@equipment-management/schemas';

// PaginationState 인터페이스 정의
interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export default function EquipmentPage() {
  const router = useRouter();
  const { user, isManager, isAdmin } = useAuth();
  const userSite = (user as any)?.site as Site | undefined;
  const userRoles = (user as any)?.roles || [];
  const isTestOperator = userRoles.includes('test_operator') && !isManager() && !isAdmin();
  const canViewAllSites = isManager() || isAdmin();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [siteFilter, setSiteFilter] = useState<string>(
    isTestOperator && userSite ? userSite : 'ALL'
  );
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // useMemo를 사용하여 검색 조건 최적화
  const queryOptions = useMemo(() => {
    // 시험실무자는 자신의 사이트만 조회, 기술책임자/관리자는 선택 가능
    const site =
      isTestOperator && userSite
        ? userSite
        : siteFilter !== 'ALL'
          ? (siteFilter as Site)
          : undefined;

    return {
      search: searchTerm || undefined,
      status: statusFilter !== 'ALL' ? (statusFilter as any) : undefined, // EquipmentStatus enum으로 변환
      category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
      site,
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
    };
  }, [searchTerm, statusFilter, categoryFilter, siteFilter, pagination, isTestOperator, userSite]);

  // 장비 데이터 쿼리
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['equipmentList', queryOptions],
    queryFn: () => equipmentApi.getEquipmentList(queryOptions),
  });

  // 더 많은 데이터 로드 함수 정의
  const loadMoreData = useCallback(() => {
    setPagination((prev: PaginationState) => ({
      ...prev,
      pageIndex: prev.pageIndex + 1,
    }));
    return Promise.resolve();
  }, []);

  // 검색어 입력에 디바운스 적용
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchTerm(value);
        setPagination((prev: PaginationState) => ({
          ...prev,
          pageIndex: 0, // 검색 시 첫 페이지로 리셋
        }));
      }, 500),
    []
  );

  // 컴포넌트 언마운트 시 디바운스 취소
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // 장비 상태 변경 핸들러
  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPagination((prev: PaginationState) => ({
      ...prev,
      pageIndex: 0, // 필터 변경 시 첫 페이지로 리셋
    }));
  }, []);

  // 장비 카테고리 변경 핸들러
  const handleCategoryChange = useCallback((value: string) => {
    setCategoryFilter(value);
    setPagination((prev: PaginationState) => ({
      ...prev,
      pageIndex: 0, // 필터 변경 시 첫 페이지로 리셋
    }));
  }, []);

  // 사이트 필터 변경 핸들러
  const handleSiteChange = useCallback((value: string) => {
    setSiteFilter(value);
    setPagination((prev: PaginationState) => ({
      ...prev,
      pageIndex: 0, // 필터 변경 시 첫 페이지로 리셋
    }));
  }, []);

  // 장비 상세 페이지로 이동하는 핸들러
  const handleEquipmentClick = useCallback(
    (equipment: Equipment) => {
      router.push(`/equipment/${equipment.id}`);
    },
    [router]
  );

  // 상태에 따른 뱃지 컴포넌트
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { class: string; darkClass: string; label: string }> = {
      AVAILABLE: {
        class: 'bg-green-100 text-green-800',
        darkClass: 'dark:bg-green-950 dark:text-green-300',
        label: '사용 가능',
      },
      IN_USE: {
        class: 'bg-blue-100 text-blue-800',
        darkClass: 'dark:bg-blue-950 dark:text-blue-300',
        label: '사용 중',
      },
      MAINTENANCE: {
        class: 'bg-yellow-100 text-yellow-800',
        darkClass: 'dark:bg-yellow-950 dark:text-yellow-300',
        label: '유지보수 중',
      },
      CALIBRATION: {
        class: 'bg-purple-100 text-purple-800',
        darkClass: 'dark:bg-purple-950 dark:text-purple-300',
        label: '교정 중',
      },
      DISPOSAL: {
        class: 'bg-red-100 text-red-800',
        darkClass: 'dark:bg-red-950 dark:text-red-300',
        label: '폐기',
      },
    };

    const config = statusConfig[status] || {
      class: 'bg-gray-100 text-gray-800',
      darkClass: 'dark:bg-gray-800 dark:text-gray-300',
      label: '알 수 없음',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.class} ${config.darkClass}`}
      >
        {config.label}
      </span>
    );
  };

  // 날짜 포맷 함수
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return dayjs(dateString).format('YYYY-MM-DD');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">장비 관리</h1>
        <Button onClick={() => router.push('/equipment/create')}>장비 등록</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>장비 검색</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">검색어</Label>
              <Input
                id="search"
                placeholder="장비명, 관리번호, 위치 등으로 검색"
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">상태</Label>
              <Select defaultValue="ALL" onValueChange={handleStatusChange}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="모든 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">모든 상태</SelectItem>
                  <SelectItem value="AVAILABLE">사용 가능</SelectItem>
                  <SelectItem value="IN_USE">사용 중</SelectItem>
                  <SelectItem value="MAINTENANCE">유지보수 중</SelectItem>
                  <SelectItem value="CALIBRATION">교정 중</SelectItem>
                  <SelectItem value="DISPOSAL">폐기</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {canViewAllSites && (
              <div className="space-y-2">
                <Label htmlFor="site">사이트</Label>
                <Select value={siteFilter} onValueChange={handleSiteChange}>
                  <SelectTrigger id="site">
                    <SelectValue placeholder="모든 사이트" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">모든 사이트</SelectItem>
                    <SelectItem value="suwon">수원</SelectItem>
                    <SelectItem value="uiwang">의왕</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="category">분류</Label>
              <Select defaultValue="ALL" onValueChange={handleCategoryChange}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="모든 분류" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">모든 분류</SelectItem>
                  <SelectItem value="MEASUREMENT">측정장비</SelectItem>
                  <SelectItem value="TESTING">시험장비</SelectItem>
                  <SelectItem value="ANALYSIS">분석장비</SelectItem>
                  <SelectItem value="CALIBRATION">교정장비</SelectItem>
                  <SelectItem value="SAFETY">안전장비</SelectItem>
                  <SelectItem value="IT">IT장비</SelectItem>
                  <SelectItem value="TOOL">공구</SelectItem>
                  <SelectItem value="OTHER">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 가상화된 장비 리스트로 교체 */}
      <VirtualizedEquipmentList
        items={data?.data || []}
        isLoading={isLoading || isFetching}
        hasNextPage={
          data
            ? (data.meta?.pagination?.currentPage || 1) < (data.meta?.pagination?.totalPages || 1)
            : false
        }
        loadNextPage={loadMoreData}
        onItemClick={handleEquipmentClick}
      />
    </div>
  );
}
