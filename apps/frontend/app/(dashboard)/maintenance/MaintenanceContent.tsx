'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
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
import { Search, Plus, Filter, Calendar, ClipboardList, AlertTriangle, Clock } from 'lucide-react';
import maintenanceApi, {
  Maintenance,
  MaintenanceQuery,
  type MaintenanceSummary,
} from '@/lib/api/maintenance-api';
import type { PaginatedResponse } from '@/lib/api/types';

interface MaintenanceContentProps {
  /** 서버에서 가져온 초기 점검 목록 */
  initialData: PaginatedResponse<Maintenance>;
  /** 서버에서 가져온 초기 요약 정보 */
  initialSummary: MaintenanceSummary;
}

/**
 * 점검 관리 Client Component
 *
 * Server Component에서 초기 데이터를 받아 React Query로 관리합니다.
 * 탭/필터 변경 시 클라이언트에서 재조회합니다.
 */
export default function MaintenanceContent({
  initialData,
  initialSummary,
}: MaintenanceContentProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // 점검 요약 정보 (초기 데이터 활용)
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['maintenance-summary'],
    queryFn: () => maintenanceApi.getMaintenanceSummary(),
    placeholderData: initialSummary,
    staleTime: 30 * 1000,
  });

  // 점검 목록 (초기 데이터 활용)
  const { data: maintenancesData, isLoading: maintenancesLoading } = useQuery({
    queryKey: ['maintenances', currentTab, typeFilter, searchTerm],
    queryFn: async () => {
      const query: MaintenanceQuery = {
        pageSize: 100,
        search: searchTerm || undefined,
      };

      if (typeFilter !== 'all') {
        query.maintenanceType = typeFilter;
      }

      switch (currentTab) {
        case 'upcoming':
          return maintenanceApi.getUpcomingMaintenances(query);
        case 'overdue':
          return maintenanceApi.getOverdueMaintenances(query);
        case 'scheduled':
          query.status = 'scheduled';
          return maintenanceApi.getMaintenances(query);
        case 'in_progress':
          query.status = 'in_progress';
          return maintenanceApi.getMaintenances(query);
        case 'completed':
          query.status = 'completed';
          return maintenanceApi.getMaintenances(query);
        default:
          return maintenanceApi.getMaintenances(query);
      }
    },
    // ✅ 서버에서 가져온 초기 데이터 (currentTab이 'all'일 때만)
    placeholderData:
      currentTab === 'all' && typeFilter === 'all' && !searchTerm ? initialData : undefined,
    staleTime: 30 * 1000,
  });

  // 점검 상태에 따른 배지 스타일
  const getMaintenanceStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-800 hover:bg-blue-50">
            예정됨
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 hover:bg-yellow-50">
            진행 중
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-800 hover:bg-green-50">
            완료됨
          </Badge>
        );
      case 'canceled':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-800 hover:bg-gray-50">
            취소됨
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 점검 결과에 따른 배지 스타일
  const getMaintenanceResultBadge = (result: string) => {
    switch (result) {
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-800 hover:bg-green-50">
            통과
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 hover:bg-yellow-50">
            보류
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-800 hover:bg-red-50">
            불합격
          </Badge>
        );
      default:
        return <Badge variant="outline">{result}</Badge>;
    }
  };

  // 점검 유형에 따른 한글 표시
  const getMaintenanceTypeText = (type: string) => {
    switch (type) {
      case 'regular':
        return '정기 점검';
      case 'repair':
        return '수리';
      case 'inspection':
        return '검사';
      case 'other':
        return '기타';
      default:
        return type;
    }
  };

  // 검색어 변경 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // 유형 필터 변경 핸들러
  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
  };

  // 탭 변경 핸들러
  const handleTabChange = (value: string) => {
    setCurrentTab(value);
  };

  // 검색 결과가 없는 경우 표시할 UI
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <ClipboardList className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900">점검 정보가 없습니다</h3>
      <p className="text-sm text-gray-500 mt-2 mb-4">검색 조건에 맞는 점검 정보가 없습니다.</p>
      <Button
        variant="outline"
        onClick={() => {
          setSearchTerm('');
          setTypeFilter('all');
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
            <Skeleton className="h-5 w-[100px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-[100px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-[120px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-[100px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-[100px]" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">점검 관리</h1>
          <p className="text-muted-foreground">장비 점검 일정 및 결과를 관리합니다.</p>
        </div>
        <Button onClick={() => router.push('/maintenance/create')}>
          <Plus className="mr-2 h-4 w-4" /> 점검 등록
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">전체 점검</CardTitle>
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
            <CardTitle className="text-sm font-medium">예정된 점검</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{summary?.scheduled || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">진행 중인 점검</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{summary?.inProgress || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">지연된 점검</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{summary?.overdue || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 탭과 필터 */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">전체 점검</TabsTrigger>
            <TabsTrigger value="scheduled">예정됨</TabsTrigger>
            <TabsTrigger value="in_progress">진행 중</TabsTrigger>
            <TabsTrigger value="completed">완료됨</TabsTrigger>
            <TabsTrigger value="upcoming">다가오는 점검</TabsTrigger>
            <TabsTrigger value="overdue">지연된 점검</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="장비 또는 담당자 검색"
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-8"
            />
          </div>
          <Select value={typeFilter} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-[140px]">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <span>점검 유형</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="regular">정기 점검</SelectItem>
              <SelectItem value="repair">수리</SelectItem>
              <SelectItem value="inspection">검사</SelectItem>
              <SelectItem value="other">기타</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 점검 목록 테이블 */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>장비</TableHead>
              <TableHead>점검 유형</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>점검 일자</TableHead>
              <TableHead>담당자</TableHead>
              <TableHead>결과</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {maintenancesLoading ? (
              renderLoadingState()
            ) : maintenancesData?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {renderEmptyState()}
                </TableCell>
              </TableRow>
            ) : (
              maintenancesData?.data?.map((maintenance: Maintenance) => (
                <TableRow
                  key={maintenance.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/maintenance/${maintenance.id}`)}
                >
                  <TableCell className="font-medium">
                    {maintenance.equipment
                      ? `${maintenance.equipment.name} (${maintenance.equipment.managementNumber})`
                      : '장비 정보 없음'}
                  </TableCell>
                  <TableCell>{getMaintenanceTypeText(maintenance.maintenanceType)}</TableCell>
                  <TableCell>{getMaintenanceStatusBadge(maintenance.status)}</TableCell>
                  <TableCell>
                    {format(new Date(maintenance.maintenanceDate), 'yyyy-MM-dd', { locale: ko })}
                  </TableCell>
                  <TableCell>{maintenance.performedBy}</TableCell>
                  <TableCell>{getMaintenanceResultBadge(maintenance.result)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
