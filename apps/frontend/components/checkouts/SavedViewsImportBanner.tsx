'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSavedViews } from '@/hooks/use-saved-views';

/**
 * localStorage 백업 → 서버 일괄 import 안내 배너.
 *
 * 표시 조건:
 *   - 서버 view 목록 0개 AND localStorage 백업 ≥ 1개
 *   - 사용자가 명시 "가져오기" 클릭 시 bulkImport → localStorage clear → toast.
 *   - "다음에 하기" 클릭 시 dismiss flag 를 localStorage 에 영속 저장 (G-3 closure)
 *     → 페이지 리로드 / 탭 이동 후에도 재노출 안 됨. 다른 PC 첫 진입 시에만 재노출.
 *
 * Rule: 자동 sync 금지 (`feedback_no_fabricate_domain_data.md` + Phase 0 결정).
 */
const DISMISS_FLAG_KEY = 'saved_views_import_banner_dismissed';

export function SavedViewsImportBanner() {
  const t = useTranslations('checkouts.savedViews');
  const { hasLocalBackup, localBackupCount, importFromLocalStorage } = useSavedViews();
  const [dismissed, setDismissed] = useState(false);

  // SSR safe — hydration mismatch 회피를 위해 effect 안에서 localStorage 조회.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (window.localStorage.getItem(DISMISS_FLAG_KEY) === '1') {
        setDismissed(true);
      }
    } catch {
      // SecurityError 무시 — 배너는 hide rather than crash.
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(DISMISS_FLAG_KEY, '1');
    } catch {
      // SecurityError 무시
    }
  };

  if (dismissed || !hasLocalBackup) return null;

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
          <p className="text-xs">{t('importDescription', { count: localBackupCount })}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button size="sm" onClick={() => importFromLocalStorage()}>
          {t('importButton')}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDismiss} aria-label={t('importDismiss')}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
