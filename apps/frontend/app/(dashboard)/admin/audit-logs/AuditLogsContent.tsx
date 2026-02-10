'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { auditApi, type AuditLogFilter } from '@/lib/api/audit-api';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Search, RefreshCw, History, Filter } from 'lucide-react';

const ACTION_LABELS: Record<string, string> = {
  create: '생성',
  update: '수정',
  delete: '삭제',
  approve: '승인',
  reject: '반려',
  checkout: '반출',
  return: '반입',
  cancel: '취소',
  login: '로그인',
  logout: '로그아웃',
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-blue-100 text-blue-800',
  update: 'bg-yellow-100 text-yellow-800',
  delete: 'bg-red-100 text-red-800',
  approve: 'bg-green-100 text-green-800',
  reject: 'bg-orange-100 text-orange-800',
  checkout: 'bg-purple-100 text-purple-800',
  return: 'bg-cyan-100 text-cyan-800',
  cancel: 'bg-gray-100 text-gray-800',
  login: 'bg-indigo-100 text-indigo-800',
  logout: 'bg-slate-100 text-slate-800',
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  equipment: '장비',
  calibration: '교정',
  checkout: '반출',
  rental: '대여',
  user: '사용자',
  team: '팀',
  calibration_factor: '보정계수',
  non_conformance: '부적합',
  software: '소프트웨어',
  calibration_plan: '교정계획서',
  repair_history: '수리이력',
};

const ROLE_LABELS: Record<string, string> = {
  test_engineer: '시험실무자',
  technical_manager: '기술책임자',
  lab_manager: '시험소 관리자',
};

export default function AuditLogsContent() {
  const [filter, setFilter] = useState<AuditLogFilter>({
    page: 1,
    limit: 20,
  });

  const [searchUserId, setSearchUserId] = useState('');
  const [searchEntityType, setSearchEntityType] = useState('');
  const [searchAction, setSearchAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 감사 로그 목록 조회
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['audit-logs', filter],
    queryFn: () => auditApi.getAuditLogs(filter),
  });

  const handleSearch = () => {
    setFilter({
      ...filter,
      page: 1,
      userId: searchUserId || undefined,
      entityType: searchEntityType || undefined,
      action: searchAction || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  const handleReset = () => {
    setSearchUserId('');
    setSearchEntityType('');
    setSearchAction('');
    setStartDate('');
    setEndDate('');
    setFilter({
      page: 1,
      limit: 20,
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilter({
      ...filter,
      page: newPage,
    });
  };

  const logs = data?.data || [];
  const pagination = data?.meta?.pagination || {
    total: 0,
    pageSize: 20,
    currentPage: 1,
    totalPages: 1,
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">감사 로그</h1>
          <p className="text-muted-foreground">시스템에서 발생한 모든 주요 활동을 기록합니다</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* 필터 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            필터
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userId">사용자 ID</Label>
              <Input
                id="userId"
                placeholder="UUID..."
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entityType">엔티티 타입</Label>
              <Select value={searchEntityType} onValueChange={setSearchEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">전체</SelectItem>
                  {Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">액션</Label>
              <Select value={searchAction} onValueChange={setSearchAction}>
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">전체</SelectItem>
                  {Object.entries(ACTION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">시작일</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">종료일</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              검색
            </Button>
            <Button variant="outline" onClick={handleReset}>
              초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 로그 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            로그 목록
          </CardTitle>
          <CardDescription>총 {pagination.total.toLocaleString()}개의 로그</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>조회된 로그가 없습니다</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">시간</TableHead>
                      <TableHead>사용자</TableHead>
                      <TableHead>역할</TableHead>
                      <TableHead>액션</TableHead>
                      <TableHead>대상</TableHead>
                      <TableHead>대상명</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">
                          {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{log.userName}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                            {log.userId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {ROLE_LABELS[log.userRole] || log.userRole}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={ACTION_COLORS[log.action] || 'bg-gray-100'}>
                            {ACTION_LABELS[log.action] || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {ENTITY_TYPE_LABELS[log.entityType] || log.entityType}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {log.entityName || (
                            <span className="text-muted-foreground text-xs">
                              {log.entityId.substring(0, 8)}...
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {log.ipAddress || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 페이지네이션 */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  {pagination.total.toLocaleString()}개 중{' '}
                  {((pagination.currentPage - 1) * pagination.pageSize + 1).toLocaleString()}-
                  {Math.min(
                    pagination.currentPage * pagination.pageSize,
                    pagination.total
                  ).toLocaleString()}
                  개 표시
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    이전
                  </Button>
                  <span className="text-sm">
                    {pagination.currentPage} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage >= pagination.totalPages}
                  >
                    다음
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
