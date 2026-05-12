'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';

import { useRejectionPresets } from '@/hooks/use-rejection-presets';
import { type RejectionPreset } from '@/lib/api/checkout-api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { RejectionPresetRow } from './RejectionPresetRow';
import { RejectionPresetFormDialog } from './RejectionPresetFormDialog';
import { RejectionPresetDeleteDialog } from './RejectionPresetDeleteDialog';

type DialogState =
  | { mode: 'idle' }
  | { mode: 'create' }
  | { mode: 'edit'; preset: RejectionPreset }
  | { mode: 'delete'; preset: RejectionPreset };

/**
 * Admin 반려 사유 프리셋 CRUD 통합 client (S-4).
 *
 * - 테이블 + 추가 버튼 + 행별 편집/삭제 + sortOrder ↑↓
 * - 드래그 정렬은 Storybook 미설치 차단 (S-9) — sortOrder 버튼으로 대체
 */
export function RejectionPresetsAdminClient() {
  const t = useTranslations('admin.rejectionPresets');
  const { data: presets, isLoading, isError } = useRejectionPresets();
  const [dialog, setDialog] = useState<DialogState>({ mode: 'idle' });

  const closeDialog = () => setDialog({ mode: 'idle' });

  if (isLoading) {
    return (
      <div className="space-y-2" aria-label={t('aria.loading')}>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {t('errors.loadFailed')}
      </p>
    );
  }

  const rows = presets ?? [];

  return (
    <div className="space-y-4" data-testid="rejection-presets-admin">
      <div className="flex justify-end">
        <Button
          onClick={() => setDialog({ mode: 'create' })}
          aria-label={t('aria.addBtn')}
          data-testid="rejection-preset-add"
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          {t('addBtn')}
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center" role="status">
          {t('empty')}
        </p>
      ) : (
        <div className="rounded-md border">
          <Table aria-label={t('aria.table')}>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">{t('columns.sortOrder')}</TableHead>
                <TableHead>{t('columns.label')}</TableHead>
                <TableHead>{t('columns.template')}</TableHead>
                <TableHead className="w-[100px]">{t('columns.flags')}</TableHead>
                <TableHead className="w-[180px] text-right">{t('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((preset, index) => (
                <RejectionPresetRow
                  key={preset.id}
                  preset={preset}
                  index={index}
                  total={rows.length}
                  rows={rows}
                  onEdit={() => setDialog({ mode: 'edit', preset })}
                  onDelete={() => setDialog({ mode: 'delete', preset })}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {(dialog.mode === 'create' || dialog.mode === 'edit') && (
        <RejectionPresetFormDialog
          open={true}
          mode={dialog.mode}
          preset={dialog.mode === 'edit' ? dialog.preset : undefined}
          onClose={closeDialog}
        />
      )}

      {dialog.mode === 'delete' && (
        <RejectionPresetDeleteDialog open={true} preset={dialog.preset} onClose={closeDialog} />
      )}
    </div>
  );
}
