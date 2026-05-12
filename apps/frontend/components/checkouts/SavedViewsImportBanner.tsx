'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSavedViews } from '@/hooks/use-saved-views';
import { readLocalStorageBackup } from '@/lib/checkouts/saved-views';

/**
 * localStorage 백업 → 서버 일괄 import 안내 배너.
 *
 * 표시 조건 (read-only — silent no-op when no backup):
 *   - 서버 view 목록 0개 AND localStorage 백업 ≥ 1개
 *   - 사용자가 명시적으로 "가져오기" 클릭하면 bulkImport → localStorage clear → toast.
 *   - "다음에 하기" 클릭 시 현재 세션 한정 hide (다음 렌더에서 다시 노출 — 명시 import 정책).
 *
 * Rule: 자동 sync 금지 (`feedback_no_fabricate_domain_data.md` + Phase 0 결정).
 */
export function SavedViewsImportBanner() {
  const t = useTranslations('checkouts.savedViews');
  const { hasLocalBackup, importFromLocalStorage } = useSavedViews();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !hasLocalBackup) return null;

  const backupCount = readLocalStorageBackup().length;
  if (backupCount === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-4 py-2 text-sm"
    >
      <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <Upload className="h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-medium text-foreground">{t('importTitle')}</p>
          <p className="text-xs">{t('importDescription', { count: backupCount })}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button size="sm" onClick={() => importFromLocalStorage()}>
          {t('importButton')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissed(true)}
          aria-label={t('importDismiss')}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
