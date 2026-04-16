'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Download, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useExecuteMigration, useDownloadErrorReport } from '@/hooks/use-data-migration';
import type {
  MultiSheetPreviewResult,
  MultiSheetExecuteResult,
  SheetPreviewResult,
  MigrationRowPreview,
  MigrationSheetType,
  PreviewOptions,
} from '@/lib/api/data-migration-api';
import { useToast } from '@/components/ui/use-toast';

interface PreviewStepProps {
  preview: MultiSheetPreviewResult;
  options: PreviewOptions;
  onExecuteComplete: (result: MultiSheetExecuteResult) => void;
  onBack: () => void;
}

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
  valid: 'default',
  error: 'destructive',
  duplicate: 'secondary',
  warning: 'outline',
};

/** 이력 시트에서 날짜 컬럼 필드명 */
const DATE_FIELD: Partial<Record<MigrationSheetType, string>> = {
  calibration: 'calibrationDate',
  repair: 'repairDate',
  incident: 'occurredAt',
};

function RowErrorsCell({ row }: { row: MigrationRowPreview }) {
  const t = useTranslations('data-migration');
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

/** 시트별 요약 미니 카드 */
function SheetSummaryBar({ sheet }: { sheet: SheetPreviewResult }) {
  const t = useTranslations('data-migration');
  return (
    <div className="grid grid-cols-5 gap-2 text-center text-xs">
      {(
        [
          { key: 'total', count: sheet.totalRows, cls: 'bg-muted' },
          { key: 'valid', count: sheet.validRows, cls: 'bg-green-50 dark:bg-green-950' },
          { key: 'error', count: sheet.errorRows, cls: 'bg-red-50 dark:bg-red-950' },
          { key: 'duplicate', count: sheet.duplicateRows, cls: 'bg-yellow-50 dark:bg-yellow-950' },
          { key: 'warning', count: sheet.warningRows, cls: 'bg-orange-50 dark:bg-orange-950' },
        ] as const
      ).map((item) => (
        <div key={item.key} className={`rounded p-2 ${item.cls}`}>
          <p className="text-base font-bold">{item.count}</p>
          <p className="text-muted-foreground">{t(`preview.summary.${item.key}`)}</p>
        </div>
      ))}
    </div>
  );
}

/** 장비 시트 테이블 (체크박스 선택 가능) */
function EquipmentSheetTable({
  sheet,
  options,
  selectedRowNumbers,
  onToggleAll,
  onToggleRow,
}: {
  sheet: SheetPreviewResult;
  options: PreviewOptions;
  selectedRowNumbers: Set<number>;
  onToggleAll: () => void;
  onToggleRow: (n: number) => void;
}) {
  const t = useTranslations('data-migration');
  const selectableRows = sheet.rows.filter(
    (r) =>
      r.status === 'valid' ||
      r.status === 'warning' ||
      (!options.skipDuplicates && r.status === 'duplicate')
  );
  const allSelected =
    selectableRows.length > 0 && selectableRows.every((r) => selectedRowNumbers.has(r.rowNumber));

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 pl-4">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onToggleAll}
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
          {sheet.rows.map((row) => {
            const isSelectable =
              row.status === 'valid' ||
              row.status === 'warning' ||
              (!options.skipDuplicates && row.status === 'duplicate');
            const isChecked = selectedRowNumbers.has(row.rowNumber);

            return (
              <TableRow key={row.rowNumber} className={!isSelectable ? 'opacity-50' : undefined}>
                <TableCell className="pl-4">
                  {isSelectable && (
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => onToggleRow(row.rowNumber)}
                      aria-label={t('preview.table.selectRow', { row: row.rowNumber })}
                    />
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.rowNumber}</TableCell>
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
  );
}

/** 이력 시트 테이블 (읽기 전용) */
function HistorySheetTable({ sheet }: { sheet: SheetPreviewResult }) {
  const t = useTranslations('data-migration');
  const dateField = DATE_FIELD[sheet.sheetType];

  return (
    <div className="space-y-3">
      <Alert variant="default" className="py-2">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">{t('preview.historyReadOnly')}</AlertDescription>
      </Alert>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">{t('preview.table.row')}</TableHead>
              <TableHead className="w-24">{t('preview.table.status')}</TableHead>
              <TableHead className="w-36">{t('preview.table.managementNumber')}</TableHead>
              {dateField && <TableHead className="w-32">{t('preview.table.date')}</TableHead>}
              <TableHead className="min-w-48">{t('preview.table.errors')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sheet.rows.map((row) => (
              <TableRow
                key={row.rowNumber}
                className={row.status === 'error' ? 'opacity-50' : undefined}
              >
                <TableCell className="text-sm text-muted-foreground">{row.rowNumber}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE_VARIANT[row.status] ?? 'secondary'}>
                    {t(`preview.status.${row.status}`)}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {String(row.data['managementNumber'] ?? '-')}
                </TableCell>
                {dateField && (
                  <TableCell className="text-xs">{String(row.data[dateField] ?? '-')}</TableCell>
                )}
                <TableCell>
                  <RowErrorsCell row={row} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/** 개별 시트 탭 콘텐츠 */
function SheetTabContent({
  sheet,
  options,
  selectedRowNumbers,
  onToggleAll,
  onToggleRow,
}: {
  sheet: SheetPreviewResult;
  options: PreviewOptions;
  selectedRowNumbers: Set<number>;
  onToggleAll: () => void;
  onToggleRow: (n: number) => void;
}) {
  const t = useTranslations('data-migration');

  return (
    <div className="space-y-3 pt-2">
      <SheetSummaryBar sheet={sheet} />

      {sheet.unmappedColumns.length > 0 && (
        <Alert variant="default">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('preview.unmappedColumns')}</AlertTitle>
          <AlertDescription>
            <p className="mb-1 text-xs">{t('preview.unmappedColumnsHint')}</p>
            <div className="flex flex-wrap gap-1">
              {sheet.unmappedColumns.map((col) => (
                <Badge key={col} variant="outline" className="text-xs">
                  {col}
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-0">
          {sheet.sheetType === 'equipment' ? (
            <EquipmentSheetTable
              sheet={sheet}
              options={options}
              selectedRowNumbers={selectedRowNumbers}
              onToggleAll={onToggleAll}
              onToggleRow={onToggleRow}
            />
          ) : (
            <HistorySheetTable sheet={sheet} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PreviewStep({
  preview,
  options,
  onExecuteComplete,
  onBack,
}: PreviewStepProps) {
  const t = useTranslations('data-migration');
  const { toast } = useToast();

  const equipmentSheet = preview.sheets.find((s) => s.sheetType === 'equipment');
  const isMultiSheet = preview.sheets.length > 1;

  const selectableEquipmentRows = (equipmentSheet?.rows ?? []).filter(
    (r) =>
      r.status === 'valid' ||
      r.status === 'warning' ||
      (!options.skipDuplicates && r.status === 'duplicate')
  );

  const [selectedRowNumbers, setSelectedRowNumbers] = useState<Set<number>>(
    () => new Set(selectableEquipmentRows.map((r) => r.rowNumber))
  );

  const executeMutation = useExecuteMigration();
  const errorReportMutation = useDownloadErrorReport();

  const toggleAll = () => {
    if (selectableEquipmentRows.every((r) => selectedRowNumbers.has(r.rowNumber))) {
      setSelectedRowNumbers(new Set());
    } else {
      setSelectedRowNumbers(new Set(selectableEquipmentRows.map((r) => r.rowNumber)));
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
      toast({ variant: 'destructive', description: t('preview.noValidRows') });
      return;
    }
    executeMutation.mutate(
      {
        sessionId: preview.sessionId,
        ...options,
        selectedRows: Array.from(selectedRowNumbers),
      },
      { onSuccess: (result) => onExecuteComplete(result) }
    );
  };

  const hasErrors = preview.errorRows > 0;
  const someSelected = selectedRowNumbers.size > 0;

  // 단일 장비 시트 — 탭 없이 기존 레이아웃
  if (!isMultiSheet && equipmentSheet) {
    return (
      <div className="space-y-4">
        {/* 요약 바 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(
            [
              { key: 'total', count: preview.totalRows, className: 'bg-muted' },
              {
                key: 'valid',
                count: preview.validRows,
                className: 'bg-green-50 dark:bg-green-950',
              },
              { key: 'error', count: preview.errorRows, className: 'bg-red-50 dark:bg-red-950' },
              {
                key: 'duplicate',
                count: equipmentSheet.duplicateRows,
                className: 'bg-yellow-50 dark:bg-yellow-950',
              },
              {
                key: 'warning',
                count: equipmentSheet.warningRows,
                className: 'bg-orange-50 dark:bg-orange-950',
              },
            ] as const
          ).map((item) => (
            <Card key={item.key} className={item.className}>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold" data-testid={`summary-${item.key}`}>
                  {item.count}
                </p>
                <p className="text-xs text-muted-foreground">{t(`preview.summary.${item.key}`)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {preview.fkResolutionSummary && (
          <Alert variant="default" className="py-2">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {t('preview.fkResolution.title')}:{' '}
              {t('preview.fkResolution.managers', {
                resolved: preview.fkResolutionSummary.resolvedManagers,
                unresolved: preview.fkResolutionSummary.unresolvedManagers,
              })}
              {' / '}
              {t('preview.fkResolution.deputies', {
                resolved: preview.fkResolutionSummary.resolvedDeputyManagers,
                unresolved: preview.fkResolutionSummary.unresolvedDeputyManagers,
              })}
              {' / '}
              {t('preview.fkResolution.teams', {
                resolved: preview.fkResolutionSummary.resolvedTeams,
                unresolved: preview.fkResolutionSummary.unresolvedTeams,
              })}
            </AlertDescription>
          </Alert>
        )}

        {equipmentSheet.unmappedColumns.length > 0 && (
          <Alert variant="default">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('preview.unmappedColumns')}</AlertTitle>
            <AlertDescription>
              <p className="mb-1 text-xs">{t('preview.unmappedColumnsHint')}</p>
              <div className="flex flex-wrap gap-1">
                {equipmentSheet.unmappedColumns.map((col) => (
                  <Badge key={col} variant="outline" className="text-xs">
                    {col}
                  </Badge>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('preview.title')}</CardTitle>
            <CardDescription>{t('preview.description')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <EquipmentSheetTable
              sheet={equipmentSheet}
              options={options}
              selectedRowNumbers={selectedRowNumbers}
              onToggleAll={toggleAll}
              onToggleRow={toggleRow}
            />
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack}>
              {t('preview.backButton')}
            </Button>
            <Button
              variant="outline"
              onClick={() => errorReportMutation.mutate(preview.sessionId)}
              disabled={errorReportMutation.isPending}
            >
              <Download className="mr-2 h-4 w-4" />
              {t('preview.downloadMigrationReport')}
            </Button>
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

  // 멀티 시트 — 탭 레이아웃
  return (
    <div className="space-y-4">
      {/* 전체 요약 바 */}
      <div className="grid grid-cols-3 gap-3">
        {(
          [
            { key: 'total', count: preview.totalRows, className: 'bg-muted' },
            { key: 'valid', count: preview.validRows, className: 'bg-green-50 dark:bg-green-950' },
            { key: 'error', count: preview.errorRows, className: 'bg-red-50 dark:bg-red-950' },
          ] as const
        ).map((item) => (
          <Card key={item.key} className={item.className}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold" data-testid={`summary-${item.key}`}>
                {item.count}
              </p>
              <p className="text-xs text-muted-foreground">{t(`preview.summary.${item.key}`)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FK 해석 요약 */}
      {preview.fkResolutionSummary && (
        <Alert variant="default" className="py-2">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {t('preview.fkResolution.title')}:{' '}
            {t('preview.fkResolution.managers', {
              resolved: preview.fkResolutionSummary.resolvedManagers,
              unresolved: preview.fkResolutionSummary.unresolvedManagers,
            })}
            {' / '}
            {t('preview.fkResolution.deputies', {
              resolved: preview.fkResolutionSummary.resolvedDeputyManagers,
              unresolved: preview.fkResolutionSummary.unresolvedDeputyManagers,
            })}
            {' / '}
            {t('preview.fkResolution.teams', {
              resolved: preview.fkResolutionSummary.resolvedTeams,
              unresolved: preview.fkResolutionSummary.unresolvedTeams,
            })}
          </AlertDescription>
        </Alert>
      )}

      {/* 시트별 탭 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('preview.title')}</CardTitle>
          <CardDescription>{t('preview.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={preview.sheets[0]?.sheetType ?? 'equipment'}>
            <TabsList>
              {preview.sheets.map((sheet) => (
                <TabsTrigger key={sheet.sheetType} value={sheet.sheetType}>
                  {t(`sheets.${sheet.sheetType}`)}
                  {sheet.errorRows > 0 && (
                    <Badge variant="destructive" className="ml-1.5 text-xs px-1.5 py-0">
                      {sheet.errorRows}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {preview.sheets.map((sheet) => (
              <TabsContent key={sheet.sheetType} value={sheet.sheetType}>
                <SheetTabContent
                  sheet={sheet}
                  options={options}
                  selectedRowNumbers={selectedRowNumbers}
                  onToggleAll={toggleAll}
                  onToggleRow={toggleRow}
                />
              </TabsContent>
            ))}
          </Tabs>
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
              onClick={() => errorReportMutation.mutate(preview.sessionId)}
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
