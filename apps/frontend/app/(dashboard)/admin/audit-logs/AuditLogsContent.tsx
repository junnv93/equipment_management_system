'use client';

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
import { EntityLinkCell } from '@/components/ui/entity-link-cell';
import { AuditLogDetailDialog } from '@/components/audit-logs/AuditLogDetailDialog';
import { PrintableAuditReport } from '@/components/audit-logs/PrintableAuditReport';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { auditApi, type AuditLog } from '@/lib/api/audit-api';
import type { PaginatedResponse } from '@/lib/api/types';
import {
  parseAuditLogFiltersFromSearchParams,
  convertFiltersToApiParams,
  type UIAuditLogFilters,
} from '@/lib/utils/audit-log-filter-utils';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, RefreshCw, History, Filter, Printer, Info } from 'lucide-react';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_TYPE_LABELS,
  type AuditAction,
  type AuditEntityType,
} from '@equipment-management/schemas';
import {
  USER_ROLE_LABELS,
  type UserRole,
  resolveDataScope,
  AUDIT_LOG_SCOPE,
} from '@equipment-management/shared-constants';
import {
  AUDIT_ACTION_BADGE_TOKENS,
  DEFAULT_AUDIT_ACTION_BADGE,
  AUDIT_TABLE_TOKENS,
  AUDIT_EMPTY_STATE_TOKENS,
  AUDIT_PAGINATION_TOKENS,
  AUDIT_MOTION,
} from '@/lib/design-tokens';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface AuditLogsContentProps {
  initialData: PaginatedResponse<AuditLog> | null;
  initialFilters: UIAuditLogFilters;
}

export default function AuditLogsContent({ initialData }: AuditLogsContentProps) {
  const t = useTranslations('audit');
  const tc = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // 현재 URL에서 필터 파싱 (SSOT — URL이 유일한 진실의 소스)
  const filters = parseAuditLogFiltersFromSearchParams(searchParams);
  const apiParams = convertFiltersToApiParams(filters);

  // 역할 기반 스코프 해석
  const userRole = session?.user?.role as UserRole | undefined;
  const scope = userRole
    ? resolveDataScope(
        { role: userRole, site: session?.user?.site, teamId: session?.user?.teamId },
        AUDIT_LOG_SCOPE
      )
    : null;

  // 상세 다이얼로그 상태
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // 감사 로그 목록 조회 (placeholderData: 서버 prefetch 데이터)
  const { data, refetch, isRefetching } = useQuery({
    queryKey: queryKeys.auditLogs.list(apiParams),
    queryFn: () => auditApi.getAuditLogs(apiParams),
    placeholderData: initialData ?? undefined,
    staleTime: CACHE_TIMES.SHORT,
  });

  // URL 파라미터 업데이트 (필터 변경)
  const updateFilters = useCallback(
    (updates: Partial<UIAuditLogFilters>) => {
      const newParams = new URLSearchParams(searchParams.toString());

      // 모든 업데이트를 URL에 반영
      Object.entries(updates).forEach(([key, value]) => {
        if (value === '' || value === undefined || value === null) {
          newParams.delete(key);
        } else {
          newParams.set(key, String(value));
        }
      });

      // 필터 변경 시 page를 1로 리셋 (page 자체를 업데이트하는 경우 제외)
      if (!('page' in updates)) {
        newParams.delete('page');
      }

      router.push(`?${newParams.toString()}`);
    },
    [router, searchParams]
  );

  const handleReset = useCallback(() => {
    router.push('?');
  }, [router]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateFilters({ page: newPage });
    },
    [updateFilters]
  );

  const handleRowClick = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const logs = data?.data || [];
  const pagination = data?.meta?.pagination || {
    total: 0,
    pageSize: 20,
    currentPage: 1,
    totalPages: 1,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          {scope && (
            <p className="text-muted-foreground flex items-center gap-1.5">
              <Info className="h-4 w-4" />
              {scope.label}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? AUDIT_MOTION.refreshSpin : ''}`} />
            {tc('actions.refresh')}
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            {tc('actions.print')}
          </Button>
        </div>
      </div>

      {/* 필터 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('filter')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* userId 필터: 'all' 스코프에서만 표시 (site/team 스코프에서는 불필요) */}
            {scope?.type === 'all' && (
              <div className="space-y-2">
                <Label htmlFor="userId">{t('filters.userId')}</Label>
                <Input
                  id="userId"
                  placeholder="UUID..."
                  value={filters.userId}
                  onChange={(e) => updateFilters({ userId: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="entityType">{t('filters.entityType')}</Label>
              <Select
                value={filters.entityType || '_all'}
                onValueChange={(v) => updateFilters({ entityType: v === '_all' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">{t('filters.all')}</SelectItem>
                  {Object.entries(AUDIT_ENTITY_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">{t('filters.action')}</Label>
              <Select
                value={filters.action || '_all'}
                onValueChange={(v) => updateFilters({ action: v === '_all' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">{t('filters.all')}</SelectItem>
                  {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">{t('filters.startDate')}</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => updateFilters({ startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">{t('filters.endDate')}</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => updateFilters({ endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handleReset}>
              {tc('actions.reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 로그 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t('logList')}
          </CardTitle>
          <CardDescription>
            {t('totalLogs', { count: pagination.total.toLocaleString() })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className={AUDIT_EMPTY_STATE_TOKENS.container}>
              <History className={AUDIT_EMPTY_STATE_TOKENS.icon} />
              <p className={AUDIT_EMPTY_STATE_TOKENS.text}>{t('emptyLogs')}</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">{t('table.time')}</TableHead>
                      <TableHead>{t('table.user')}</TableHead>
                      <TableHead>{t('table.role')}</TableHead>
                      <TableHead>{t('table.action')}</TableHead>
                      <TableHead>{t('table.target')}</TableHead>
                      <TableHead>{t('table.targetName')}</TableHead>
                      <TableHead>{t('table.ip')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow
                        key={log.id}
                        onClick={() => handleRowClick(log)}
                        className={AUDIT_TABLE_TOKENS.rowInteractive}
                      >
                        <TableCell className={AUDIT_TABLE_TOKENS.timestamp}>
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
                            {USER_ROLE_LABELS[log.userRole as UserRole] || log.userRole}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              AUDIT_ACTION_BADGE_TOKENS[log.action as AuditAction] ||
                              DEFAULT_AUDIT_ACTION_BADGE
                            }
                          >
                            {AUDIT_ACTION_LABELS[log.action as AuditAction] || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {AUDIT_ENTITY_TYPE_LABELS[log.entityType as AuditEntityType] ||
                              log.entityType}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <EntityLinkCell
                            entityType={log.entityType}
                            entityId={log.entityId}
                            entityName={log.entityName}
                          />
                        </TableCell>
                        <TableCell className={AUDIT_TABLE_TOKENS.ipAddress}>
                          {log.ipAddress || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 페이지네이션 */}
              <div className="flex items-center justify-between mt-4">
                <div className={AUDIT_PAGINATION_TOKENS.info}>
                  {t('showingRange', {
                    total: pagination.total.toLocaleString(),
                    start: (
                      (pagination.currentPage - 1) * pagination.pageSize +
                      1
                    ).toLocaleString(),
                    end: Math.min(
                      pagination.currentPage * pagination.pageSize,
                      pagination.total
                    ).toLocaleString(),
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {tc('pagination.previous')}
                  </Button>
                  <span className={AUDIT_PAGINATION_TOKENS.pageNumber}>
                    {tc('pagination.pageOf', {
                      current: pagination.currentPage,
                      total: pagination.totalPages,
                    })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage >= pagination.totalPages}
                  >
                    {tc('pagination.next')}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 감사 로그 상세 다이얼로그 */}
      {selectedLog && (
        <AuditLogDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          log={selectedLog}
        />
      )}

      {/* 인쇄용 보고서 */}
      <PrintableAuditReport logs={logs} filters={apiParams} />
    </div>
  );
}
