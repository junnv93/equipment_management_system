'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { dataMigrationApi } from '@/lib/api/data-migration-api';
import type {
  MigrationPreviewResult,
  MigrationExecuteResult,
  MigrationRowPreview,
  PreviewOptions,
  ExecuteOptions,
} from '@/lib/api/data-migration-api';
import { toast } from 'sonner';
import { mapBackendErrorCode, EquipmentErrorCode, ApiError } from '@/lib/errors/equipment-errors';
import {
  EquipmentCacheInvalidation,
  DashboardCacheInvalidation,
} from '@/lib/api/cache-invalidation';

interface PreviewStepProps {
  preview: MigrationPreviewResult;
  options: PreviewOptions;
  onExecuteComplete: (result: MigrationExecuteResult) => void;
  onBack: () => void;
}

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
  valid: 'default',
  error: 'destructive',
  duplicate: 'secondary',
  warning: 'outline',
};

function RowErrorsCell({ row }: { row: MigrationRowPreview }) {
  const t = useTranslations('dataMigration');
  const [expanded, setExpanded] = useState(false);
  const allMessages = [
    ...row.errors.map((e) => ({ type: 'error' as const, text: `[${e.field}] ${e.message}` })),
    ...row.warnings.map((w) => ({ type: 'warning' as const, text: w })),
  ];

  if (allMessages.length === 0) return <span className="text-muted-foreground">-</span>;

  const visible = expanded ? allMessages : allMessages.slice(0, 1);

  return (
    <div className="space-y-1">
      {visible.map((msg, i) => (
        <p
          key={i}
          className={`text-xs ${msg.type === 'error' ? 'text-destructive' : 'text-amber-600'}`}
        >
          {msg.text}
        </p>
      ))}
      {allMessages.length > 1 && (
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" /> {t('preview.table.collapse')}
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />{' '}
              {t('preview.table.showMore', { count: allMessages.length - 1 })}
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function PreviewStep({
  preview,
  options,
  onExecuteComplete,
  onBack,
}: PreviewStepProps) {
  const t = useTranslations('dataMigration');

  // 선택 가능한 행: valid + warning (error/duplicate 제외, skipDuplicates=false면 duplicate 포함)
  const selectableRows = preview.rows.filter(
    (r) =>
      r.status === 'valid' ||
      r.status === 'warning' ||
      (!options.skipDuplicates && r.status === 'duplicate')
  );

  const [selectedRowNumbers, setSelectedRowNumbers] = useState<Set<number>>(
    () => new Set(selectableRows.map((r) => r.rowNumber))
  );

  const queryClient = useQueryClient();

  const executeMutation = useMutation({
    mutationFn: (executeOptions: ExecuteOptions) =>
      dataMigrationApi.executeEquipmentMigration(executeOptions),
    onSuccess: async (result) => {
      await Promise.all([
        EquipmentCacheInvalidation.invalidateAll(queryClient),
        DashboardCacheInvalidation.invalidateAll(queryClient),
      ]);
      onExecuteComplete(result);
    },
    onError: (err) => {
      const code =
        err instanceof ApiError ? mapBackendErrorCode(err.code) : EquipmentErrorCode.UNKNOWN_ERROR;
      if (code === EquipmentErrorCode.NOT_FOUND) {
        toast.error(t('errors.sessionExpired'));
      } else {
        toast.error(t('errors.executeFailed'));
      }
    },
  });

  const errorReportMutation = useMutation({
    mutationFn: () => dataMigrationApi.downloadErrorReport(preview.sessionId),
    onError: () => {
      toast.error(t('errors.downloadFailed'));
    },
  });

  const allSelected = selectableRows.every((r) => selectedRowNumbers.has(r.rowNumber));
  const someSelected = selectedRowNumbers.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedRowNumbers(new Set());
    } else {
      setSelectedRowNumbers(new Set(selectableRows.map((r) => r.rowNumber)));
    }
  };

  const toggleRow = (rowNumber: number) => {
    setSelectedRowNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) {
        next.delete(rowNumber);
      } else {
        next.add(rowNumber);
      }
      return next;
    });
  };

  const handleExecute = () => {
    if (selectedRowNumbers.size === 0) {
      toast.error(t('preview.noValidRows'));
      return;
    }
    executeMutation.mutate({
      sessionId: preview.sessionId,
      ...options,
      selectedRows: Array.from(selectedRowNumbers),
    });
  };

  const hasErrors = preview.errorRows > 0 || preview.duplicateRows > 0;

  return (
    <div className="space-y-4">
      {/* 요약 바 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(
          [
            { key: 'total', count: preview.totalRows, className: 'bg-muted' },
            { key: 'valid', count: preview.validRows, className: 'bg-green-50 dark:bg-green-950' },
            { key: 'error', count: preview.errorRows, className: 'bg-red-50 dark:bg-red-950' },
            {
              key: 'duplicate',
              count: preview.duplicateRows,
              className: 'bg-yellow-50 dark:bg-yellow-950',
            },
            {
              key: 'warning',
              count: preview.warningRows,
              className: 'bg-orange-50 dark:bg-orange-950',
            },
          ] as const
        ).map((item) => (
          <Card key={item.key} className={item.className}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{item.count}</p>
              <p className="text-xs text-muted-foreground">{t(`preview.summary.${item.key}`)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 인식 불가 컬럼 경고 */}
      {preview.unmappedColumns.length > 0 && (
        <Alert variant="default">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('preview.unmappedColumns')}</AlertTitle>
          <AlertDescription>
            <p className="mb-1 text-xs">{t('preview.unmappedColumnsHint')}</p>
            <div className="flex flex-wrap gap-1">
              {preview.unmappedColumns.map((col) => (
                <Badge key={col} variant="outline" className="text-xs">
                  {col}
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* 행별 테이블 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('preview.title')}</CardTitle>
          <CardDescription>{t('preview.description')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pl-4">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label={
                        allSelected ? t('preview.table.deselectAll') : t('preview.table.selectAll')
                      }
                    />
                  </TableHead>
                  <TableHead className="w-14">{t('preview.table.row')}</TableHead>
                  <TableHead className="w-24">{t('preview.table.status')}</TableHead>
                  <TableHead>{t('preview.table.name')}</TableHead>
                  <TableHead className="w-36">{t('preview.table.managementNumber')}</TableHead>
                  <TableHead className="min-w-48">{t('preview.table.errors')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.rows.map((row) => {
                  const isSelectable =
                    row.status === 'valid' ||
                    row.status === 'warning' ||
                    (!options.skipDuplicates && row.status === 'duplicate');
                  const isChecked = selectedRowNumbers.has(row.rowNumber);

                  return (
                    <TableRow
                      key={row.rowNumber}
                      className={!isSelectable ? 'opacity-50' : undefined}
                    >
                      <TableCell className="pl-4">
                        {isSelectable && (
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleRow(row.rowNumber)}
                            aria-label={t('preview.table.selectRow', { row: row.rowNumber })}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.rowNumber}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE_VARIANT[row.status] ?? 'secondary'}>
                          {t(`preview.status.${row.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{String(row.data['name'] ?? '-')}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.managementNumber ?? String(row.data['managementNumber'] ?? '-')}
                      </TableCell>
                      <TableCell>
                        <RowErrorsCell row={row} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 액션 버튼 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            {t('preview.backButton')}
          </Button>
          {hasErrors && (
            <Button
              variant="outline"
              onClick={() => errorReportMutation.mutate()}
              disabled={errorReportMutation.isPending}
            >
              <Download className="mr-2 h-4 w-4" />
              {t('preview.downloadErrorReport')}
            </Button>
          )}
        </div>
        <Button onClick={handleExecute} disabled={!someSelected || executeMutation.isPending}>
          {executeMutation.isPending
            ? t('preview.loading')
            : t('preview.executeButtonCount', { count: selectedRowNumbers.size })}
        </Button>
      </div>
    </div>
  );
}
