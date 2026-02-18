'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
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
  const t = useTranslations('maintenance');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // 점검 요약 정보 (초기 데이터 활용)
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: queryKeys.maintenance.summary(),
    queryFn: () => maintenanceApi.getMaintenanceSummary(),
    placeholderData: initialSummary,
    staleTime: CACHE_TIMES.SHORT,
  });

  // 점검 목록 (초기 데이터 활용)
  const { data: maintenancesData, isLoading: maintenancesLoading } = useQuery({
    queryKey: queryKeys.maintenance.list(currentTab, typeFilter, searchTerm),
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
    staleTime: CACHE_TIMES.SHORT,
  });

  const STATUS_BADGE_COLORS: Record<string, string> = {
    scheduled: 'bg-blue-50 text-blue-800 hover:bg-blue-50',
    in_progress: 'bg-yellow-50 text-yellow-800 hover:bg-yellow-50',
    completed: 'bg-green-50 text-green-800 hover:bg-green-50',
    canceled: 'bg-gray-50 text-gray-800 hover:bg-gray-50',
  };

  const RESULT_BADGE_COLORS: Record<string, string> = {
    completed: 'bg-green-50 text-green-800 hover:bg-green-50',
    pending: 'bg-yellow-50 text-yellow-800 hover:bg-yellow-50',
    failed: 'bg-red-50 text-red-800 hover:bg-red-50',
  };

  const getMaintenanceStatusBadge = (statusKey: string) => (
    <Badge variant="outline" className={STATUS_BADGE_COLORS[statusKey] || ''}>
      {t(
        `status.${statusKey}` as
          | 'status.scheduled'
          | 'status.in_progress'
          | 'status.completed'
          | 'status.canceled'
      )}
    </Badge>
  );

  const getMaintenanceResultBadge = (resultKey: string) => (
    <Badge variant="outline" className={RESULT_BADGE_COLORS[resultKey] || ''}>
      {t(`result.${resultKey}` as 'result.completed' | 'result.pending' | 'result.failed')}
    </Badge>
  );

  const getMaintenanceTypeText = (type: string) =>
    t(`types.${type}` as 'types.regular' | 'types.repair' | 'types.inspection' | 'types.other');

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

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <ClipboardList className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900">{t('empty.title')}</h3>
      <p className="text-sm text-gray-500 mt-2 mb-4">{t('empty.description')}</p>
      <Button
        variant="outline"
        onClick={() => {
          setSearchTerm('');
          setTypeFilter('all');
        }}
      >
        {t('empty.resetFilters')}
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
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button onClick={() => router.push('/maintenance/create')}>
          <Plus className="mr-2 h-4 w-4" /> {t('createButton')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.total')}</CardTitle>
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
            <CardTitle className="text-sm font-medium">{t('stats.scheduled')}</CardTitle>
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
            <CardTitle className="text-sm font-medium">{t('stats.inProgress')}</CardTitle>
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
            <CardTitle className="text-sm font-medium">{t('stats.overdue')}</CardTitle>
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

      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
            <TabsTrigger value="scheduled">{t('tabs.scheduled')}</TabsTrigger>
            <TabsTrigger value="in_progress">{t('tabs.inProgress')}</TabsTrigger>
            <TabsTrigger value="completed">{t('tabs.completed')}</TabsTrigger>
            <TabsTrigger value="upcoming">{t('tabs.upcoming')}</TabsTrigger>
            <TabsTrigger value="overdue">{t('tabs.overdue')}</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder={t('search.placeholder')}
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-8"
            />
          </div>
          <Select value={typeFilter} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-[140px]">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <span>{t('search.typeFilter')}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('types.all')}</SelectItem>
              <SelectItem value="regular">{t('types.regular')}</SelectItem>
              <SelectItem value="repair">{t('types.repair')}</SelectItem>
              <SelectItem value="inspection">{t('types.inspection')}</SelectItem>
              <SelectItem value="other">{t('types.other')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.equipment')}</TableHead>
              <TableHead>{t('table.type')}</TableHead>
              <TableHead>{t('table.status')}</TableHead>
              <TableHead>{t('table.date')}</TableHead>
              <TableHead>{t('table.performer')}</TableHead>
              <TableHead>{t('table.result')}</TableHead>
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
                      : t('noEquipmentInfo')}
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
