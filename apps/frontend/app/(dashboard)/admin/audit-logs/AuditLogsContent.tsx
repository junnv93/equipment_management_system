'use client';

import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useToast } from '@/hooks/use-toast';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { auditApi, type AuditLog } from '@/lib/api/audit-api';
import { apiClient } from '@/lib/api/api-client';
import type { PaginatedResponse } from '@/lib/api/types';
import {
  parseAuditLogFiltersFromSearchParams,
  convertFiltersToApiParams,
  countActiveFilters,
  type UIAuditLogFilters,
} from '@/lib/utils/audit-log-filter-utils';
import { format } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  History,
  Download,
  Info,
  Shield,
} from 'lucide-react';
import {
  AUDIT_ACTION_VALUES,
  AUDIT_ENTITY_TYPE_VALUES,
  SYSTEM_USER_UUID,
  type AuditAction,
} from '@equipment-management/schemas';
import { createAuditLabelFns } from '@/lib/utils/audit-label-utils';
import {
  USER_ROLE_LABELS,
  type UserRole,
  resolveDataScope,
  AUDIT_LOG_SCOPE,
  API_ENDPOINTS,
} from '@equipment-management/shared-constants';
import {
  AUDIT_ACTION_BADGE_TOKENS,
  DEFAULT_AUDIT_ACTION_BADGE,
  AUDIT_TABLE_TOKENS,
  AUDIT_EMPTY_STATE_TOKENS,
  AUDIT_PAGINATION_TOKENS,
  AUDIT_MOTION,
  AUDIT_FILTER_TOKENS,
  AUDIT_HEADER_TOKENS,
  getAuditActionChipClasses,
  ANIMATION_PRESETS,
  getStaggerDelay,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface AuditLogsContentProps {
  initialData: PaginatedResponse<AuditLog> | null;
}

export default function AuditLogsContent({ initialData }: AuditLogsContentProps) {
  const t = useTranslations('audit');
  const tc = useTranslations('common');
  const { getActionLabel, getEntityTypeLabel } = createAuditLabelFns(t);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // 현재 URL에서 필터 파싱 (SSOT — URL이 유일한 진실의 소스)
  const filters = parseAuditLogFiltersFromSearchParams(searchParams);
  const apiParams = convertFiltersToApiParams(filters);
  const activeFilterCount = countActiveFilters(filters);

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
  const [isExporting, setIsExporting] = useState(false);

  // 감사 로그 목록 조회 (placeholderData: 서버 prefetch 데이터)
  const { data, refetch, isRefetching } = useQuery({
    queryKey: queryKeys.auditLogs.list(apiParams),
    queryFn: () => auditApi.getAuditLogs(apiParams),
    placeholderData: initialData ?? undefined,
    ...QUERY_CONFIG.AUDIT_LOGS,
  });

  // URL 파라미터 업데이트 (필터 변경)
  const updateFilters = useCallback(
    (updates: Partial<UIAuditLogFilters>) => {
      const newParams = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === '' || value === undefined || value === null) {
          newParams.delete(key);
        } else {
          newParams.set(key, String(value));
        }
      });

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

  const handleExport = async (format: 'excel' | 'csv') => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ format });
      if (apiParams.userId) params.append('userId', apiParams.userId);
      if (apiParams.entityType) params.append('entityType', apiParams.entityType);
      if (apiParams.action) params.append('action', apiParams.action);
      if (apiParams.startDate) params.append('startDate', String(apiParams.startDate));
      if (apiParams.endDate) params.append('endDate', String(apiParams.endDate));

      const response = await apiClient.get(
        `${API_ENDPOINTS.AUDIT_LOGS.EXPORT}?${params.toString()}`,
        { responseType: 'blob' }
      );

      const ext = format === 'excel' ? 'xlsx' : 'csv';
      const filename = `감사로그_${new Date().toISOString().split('T')[0]}.${ext}`;
      const url = URL.createObjectURL(response.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('exportError');
      toast({ title: t('exportFailed'), description: message, variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const logs = data?.data || [];
  const pagination = data?.meta?.pagination || {
    total: 0,
    pageSize: 20,
    currentPage: 1,
    totalPages: 1,
  };

  return (
    <div className="container mx-auto py-6 space-y-4">
      {/* ── 헤더 ─────────────────────────────────────────────────── */}
      <div className={AUDIT_HEADER_TOKENS.container}>
        <div className={AUDIT_HEADER_TOKENS.titleGroup}>
          <h1 className={AUDIT_HEADER_TOKENS.title}>
            <Shield className="h-5 w-5 text-brand-text-muted shrink-0" />
            {t('title')}
          </h1>
          {scope && (
            <p className={AUDIT_HEADER_TOKENS.subtitle}>
              <Info className="h-3.5 w-3.5 shrink-0" />
              {scope.label}
              {activeFilterCount > 0 && (
                <span className="font-mono tabular-nums text-xs bg-brand-info/10 text-brand-info border border-brand-info/20 px-1.5 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </p>
          )}
        </div>

        <div className={AUDIT_HEADER_TOKENS.actionsGroup}>
          <span className={AUDIT_HEADER_TOKENS.statsBadge}>
            총 {pagination.total.toLocaleString()}건
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 w-9 p-0"
          >
            <RefreshCw className={cn('h-4 w-4', isRefetching && AUDIT_MOTION.refreshSpin)} />
            <span className="sr-only">{tc('actions.refresh')}</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isExporting}>
                <Download className="h-4 w-4 mr-1.5" />
                {isExporting ? t('exporting') : t('exportBtn')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                {t('exportExcel')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                {t('exportCsv')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── 필터 바 ────────────────────────────────────────────────── */}
      <div className={AUDIT_FILTER_TOKENS.bar}>
        {/* 액션 타입 칩 (단일 선택) */}
        <div className="space-y-1.5">
          <p className={AUDIT_FILTER_TOKENS.fieldLabel}>{t('filters.action')}</p>
          <div className={AUDIT_FILTER_TOKENS.actionChipsRow}>
            <button
              type="button"
              className={getAuditActionChipClasses(filters.action === '')}
              onClick={() => updateFilters({ action: '' })}
            >
              {t('filters.all')}
            </button>
            {AUDIT_ACTION_VALUES.map((action) => (
              <button
                key={action}
                type="button"
                className={getAuditActionChipClasses(filters.action === action)}
                onClick={() => updateFilters({ action: filters.action === action ? '' : action })}
              >
                {getActionLabel(action)}
              </button>
            ))}
          </div>
        </div>

        {/* 보조 필터 (엔티티, 날짜, 사용자) */}
        <div className={AUDIT_FILTER_TOKENS.secondaryRow}>
          <div className="space-y-1">
            <Label className={AUDIT_FILTER_TOKENS.fieldLabel} htmlFor="entityType">
              {t('filters.entityType')}
            </Label>
            <Select
              value={filters.entityType || '_all'}
              onValueChange={(v) => updateFilters({ entityType: v === '_all' ? '' : v })}
            >
              <SelectTrigger id="entityType" className="h-8 text-xs w-40">
                <SelectValue placeholder={t('filters.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">{t('filters.all')}</SelectItem>
                {AUDIT_ENTITY_TYPE_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {getEntityTypeLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className={AUDIT_FILTER_TOKENS.fieldLabel} htmlFor="startDate">
              {t('filters.startDate')}
            </Label>
            <Input
              id="startDate"
              type="date"
              className="h-8 text-xs w-36"
              value={filters.startDate}
              onChange={(e) => updateFilters({ startDate: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label className={AUDIT_FILTER_TOKENS.fieldLabel} htmlFor="endDate">
              {t('filters.endDate')}
            </Label>
            <Input
              id="endDate"
              type="date"
              className="h-8 text-xs w-36"
              value={filters.endDate}
              onChange={(e) => updateFilters({ endDate: e.target.value })}
            />
          </div>

          {/* userId 필터: 'all' 스코프에서만 표시 */}
          {scope?.type === 'all' && (
            <div className="space-y-1">
              <Label className={AUDIT_FILTER_TOKENS.fieldLabel} htmlFor="userId">
                {t('filters.userId')}
              </Label>
              <Input
                id="userId"
                placeholder="UUID..."
                className="h-8 text-xs w-44 font-mono"
                value={filters.userId}
                onChange={(e) => updateFilters({ userId: e.target.value })}
              />
            </div>
          )}

          <div className="self-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-brand-text-muted hover:text-brand-text-primary"
              onClick={handleReset}
            >
              {tc('actions.reset')}
            </Button>
          </div>
        </div>
      </div>

      {/* ── 로그 테이블 ────────────────────────────────────────────── */}
      {logs.length === 0 ? (
        <div
          className={cn(
            AUDIT_EMPTY_STATE_TOKENS.container,
            'border border-brand-border-subtle rounded-lg'
          )}
        >
          <History className={AUDIT_EMPTY_STATE_TOKENS.icon} />
          <p className={AUDIT_EMPTY_STATE_TOKENS.text}>{t('emptyLogs')}</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-brand-border-subtle overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-brand-bg-elevated hover:bg-brand-bg-elevated border-b border-brand-border-subtle">
                  <TableHead className="w-[160px] text-xs font-medium text-brand-text-muted">
                    {t('table.time')}
                  </TableHead>
                  <TableHead className="text-xs font-medium text-brand-text-muted">
                    {t('table.user')}
                  </TableHead>
                  <TableHead className="text-xs font-medium text-brand-text-muted">
                    {t('table.role')}
                  </TableHead>
                  <TableHead className="text-xs font-medium text-brand-text-muted">
                    {t('table.action')}
                  </TableHead>
                  <TableHead className="text-xs font-medium text-brand-text-muted">
                    {t('table.target')}
                  </TableHead>
                  <TableHead className="text-xs font-medium text-brand-text-muted">
                    {t('table.targetName')}
                  </TableHead>
                  <TableHead className="text-xs font-medium text-brand-text-muted">
                    {t('table.ip')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log, index) => (
                  <TableRow
                    key={log.id}
                    onClick={() => handleRowClick(log)}
                    className={cn(
                      AUDIT_TABLE_TOKENS.rowInteractive,
                      ANIMATION_PRESETS.fadeIn,
                      'motion-safe:duration-150'
                    )}
                    style={{ animationDelay: getStaggerDelay(Math.min(index, 9), 'list') }}
                  >
                    <TableCell className={AUDIT_TABLE_TOKENS.timestamp}>
                      {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-brand-text-primary leading-tight">
                        {log.userName}
                      </div>
                      <div className="font-mono text-xs text-brand-text-muted tabular-nums truncate max-w-[110px]">
                        {log.userId === SYSTEM_USER_UUID ? t('systemActor') : log.userId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
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
                        {getActionLabel(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {getEntityTypeLabel(log.entityType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <EntityLinkCell
                        entityType={log.entityType}
                        entityId={log.entityId}
                        entityName={log.entityName}
                      />
                    </TableCell>
                    <TableCell className={AUDIT_TABLE_TOKENS.ipAddress}>
                      {log.ipAddress || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 페이지네이션 */}
          <div className="flex items-center justify-between">
            <div className={AUDIT_PAGINATION_TOKENS.info}>
              {t('showingRange', {
                total: pagination.total.toLocaleString(),
                start: ((pagination.currentPage - 1) * pagination.pageSize + 1).toLocaleString(),
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

      {/* 감사 로그 상세 다이얼로그 */}
      {selectedLog && (
        <AuditLogDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          log={selectedLog}
        />
      )}
    </div>
  );
}
