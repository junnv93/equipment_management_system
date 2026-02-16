'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import calibrationPlansApi, {
  CalibrationPlan,
  CALIBRATION_PLAN_STATUS_LABELS,
  CALIBRATION_PLAN_STATUS_COLORS,
  SITE_LABELS,
} from '@/lib/api/calibration-plans-api';
import teamsApi from '@/lib/api/teams-api';
import type { PaginatedResponse } from '@/lib/api/types';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { useCalibrationPlansFilters } from '@/hooks/use-calibration-plans-filters';
import type { UICalibrationPlansFilters } from '@/lib/utils/calibration-plans-filter-utils';
import { format } from 'date-fns';
import { Plus, FileText, Calendar, Building2, Eye, Users } from 'lucide-react';
import type { CalibrationPlanStatus } from '@equipment-management/schemas';
import { TEAM_RESTRICTED_ROLES } from '@equipment-management/shared-constants';

interface CalibrationPlansContentProps {
  /** 서버에서 가져온 초기 데이터 */
  initialData: PaginatedResponse<CalibrationPlan>;
  /** 초기 필터 (SSOT 패턴) */
  initialFilters?: UICalibrationPlansFilters;
}

/**
 * 교정계획서 목록 Client Component
 *
 * SSOT 패턴:
 * - URL 파라미터가 유일한 진실의 소스 (useCalibrationPlansFilters 훅)
 * - Server Component에서 초기 데이터를 받아 React Query로 관리
 */
export default function CalibrationPlansContent({
  initialData,
  initialFilters,
}: CalibrationPlansContentProps) {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const { data: session } = useSession();

  // ✅ SSOT: URL-driven 필터 (useState 제거)
  const { filters, apiFilters, updateYear, updateSiteId, updateTeamId, updateStatus } =
    useCalibrationPlansFilters(initialFilters);

  // 역할 확인
  const userRole = session?.user?.role;
  const isTeamRestricted = userRole && TEAM_RESTRICTED_ROLES.includes(userRole as any);

  // 팀 목록 조회 (필터링용)
  const { data: teamsData } = useQuery({
    queryKey: queryKeys.teams.list({ site: filters.siteId || undefined }),
    queryFn: () => teamsApi.getTeams({ site: (filters.siteId as any) || undefined, pageSize: 100 }),
    enabled: !!filters.siteId,
  });

  const teams = teamsData?.data || [];

  // 교정계획서 목록 조회 (초기 데이터 활용)
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.calibrationPlans.list(apiFilters),
    queryFn: () =>
      calibrationPlansApi.getCalibrationPlans({
        ...apiFilters,
        year: apiFilters.year ? Number(apiFilters.year) : undefined,
      }),
    placeholderData: initialData,
    ...QUERY_CONFIG.CALIBRATION_PLANS,
  });

  const plans = data?.data || [];

  // ✅ 방어 코드: id 검증 및 경고 (SSOT: backend id = UUID string)
  if (process.env.NODE_ENV === 'development' && plans.length > 0) {
    const invalidPlans = plans.filter((plan) => !plan.id);
    if (invalidPlans.length > 0) {
      console.warn(
        '[CalibrationPlansContent] ID 누락된 계획서 발견:',
        invalidPlans.map((p, idx) => ({ index: idx, year: p.year, siteId: p.siteId }))
      );
    }
  }

  // 연도 옵션 생성 (현재 연도 기준 +-2년)
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">교정계획서</h1>
          <p className="text-muted-foreground">연간 외부교정 대상 장비의 교정 계획을 관리합니다</p>
        </div>
        <Button asChild>
          <Link href="/calibration-plans/create">
            <Plus className="h-4 w-4 mr-2" />새 계획서 작성
          </Link>
        </Button>
      </div>

      {/* 필터 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">필터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="w-[150px]">
              <Select value={filters.year || String(currentYear)} onValueChange={updateYear}>
                <SelectTrigger>
                  <SelectValue placeholder="연도 선택" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}년
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[150px]">
              <Select
                value={filters.siteId || '_all'}
                onValueChange={(v) => updateSiteId(v === '_all' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="시험소 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">전체 시험소</SelectItem>
                  {Object.entries(SITE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <Select
                value={filters.teamId || '_all'}
                onValueChange={(v) => updateTeamId(v === '_all' ? '' : v)}
                disabled={!filters.siteId || !!isTeamRestricted}
              >
                <SelectTrigger>
                  <SelectValue placeholder="팀 선택">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {filters.teamId
                        ? teams.find((t) => t.id === filters.teamId)?.name || '팀 선택'
                        : '전체 팀'}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {!isTeamRestricted && <SelectItem value="_all">전체 팀</SelectItem>}
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                  {teams.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground">
                      시험소를 먼저 선택하세요
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <Select
                value={filters.status || '_all'}
                onValueChange={(v) => updateStatus(v === '_all' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">전체 상태</SelectItem>
                  {(
                    Object.entries(CALIBRATION_PLAN_STATUS_LABELS) as [
                      CalibrationPlanStatus,
                      string,
                    ][]
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 계획서 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>계획서 목록</CardTitle>
          <CardDescription>총 {plans.length}개의 교정계획서가 있습니다</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>계획서 목록을 불러오는 중 오류가 발생했습니다.</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>등록된 교정계획서가 없습니다</p>
              <Button asChild className="mt-4">
                <Link href="/calibration-plans/create">
                  <Plus className="h-4 w-4 mr-2" />새 계획서 작성
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>연도</TableHead>
                  <TableHead>시험소</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>작성자</TableHead>
                  <TableHead>작성일</TableHead>
                  <TableHead>승인일</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan: CalibrationPlan, index: number) => {
                  // SSOT: backend id = UUID string (fallback key for safety)
                  const key = plan.id || `plan-fallback-${plan.year}-${plan.siteId}-${index}`;

                  return (
                    <TableRow key={key}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {plan.year}년
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {SITE_LABELS[plan.siteId] || plan.siteId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={CALIBRATION_PLAN_STATUS_COLORS[plan.status]}>
                          {CALIBRATION_PLAN_STATUS_LABELS[plan.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{plan.createdBy}</TableCell>
                      <TableCell>{format(new Date(plan.createdAt), 'yyyy-MM-dd')}</TableCell>
                      <TableCell>
                        {plan.approvedAt ? format(new Date(plan.approvedAt), 'yyyy-MM-dd') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/calibration-plans/${plan.id}`)}
                          disabled={!plan.id}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          상세
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
