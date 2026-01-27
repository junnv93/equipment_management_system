'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
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
  CalibrationPlanStatus,
  CALIBRATION_PLAN_STATUS_LABELS,
  CALIBRATION_PLAN_STATUS_COLORS,
  SITE_LABELS,
} from '@/lib/api/calibration-plans-api';
import { format } from 'date-fns';
import { Plus, FileText, Calendar, Building2, Eye } from 'lucide-react';

export default function CalibrationPlansPage() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // 교정계획서 목록 조회
  const { data, isLoading, isError } = useQuery({
    queryKey: ['calibration-plans', selectedYear, selectedSite, selectedStatus],
    queryFn: () =>
      calibrationPlansApi.getCalibrationPlans({
        year: selectedYear !== 'all' ? Number(selectedYear) : undefined,
        siteId: selectedSite !== 'all' ? selectedSite : undefined,
        status: selectedStatus !== 'all' ? (selectedStatus as CalibrationPlanStatus) : undefined,
      }),
  });

  const plans = data?.data || [];

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
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="연도 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 연도</SelectItem>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}년
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[150px]">
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger>
                  <SelectValue placeholder="시험소 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 시험소</SelectItem>
                  <SelectItem value="suwon">수원</SelectItem>
                  <SelectItem value="uiwang">의왕</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="draft">작성 중</SelectItem>
                  <SelectItem value="pending_approval">승인 대기</SelectItem>
                  <SelectItem value="approved">승인됨</SelectItem>
                  <SelectItem value="rejected">반려됨</SelectItem>
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
                {plans.map((plan: CalibrationPlan) => (
                  <TableRow key={plan.uuid}>
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
                        onClick={() => router.push(`/calibration-plans/${plan.uuid}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        상세
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
