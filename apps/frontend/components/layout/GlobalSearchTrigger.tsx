'use client';

/**
 * GlobalSearchTrigger
 *
 * 데스크톱 헤더용 검색 트리거 버튼 (hidden md:flex)
 * - 클릭 또는 ⌘K/Ctrl+K로 GlobalSearchDialog 열기
 * - 모바일에서 숨김 — MobileNav가 공간을 차지
 */

import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { GlobalSearchDialog } from './GlobalSearchDialog';
import { FOCUS_TOKENS, TRANSITION_PRESETS } from '@/lib/design-tokens';
import type { FilteredNavSection } from '@/lib/navigation/nav-config';

interface GlobalSearchTriggerProps {
  filteredSections: FilteredNavSection[];
}

export function GlobalSearchTrigger({ filteredSections }: GlobalSearchTriggerProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('navigation');

  // ⌘K / Ctrl+K 글로벌 단축키
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <button
        className={cn(
          'hidden md:flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5',
          'text-sm text-muted-foreground',
          'hover:bg-accent hover:text-accent-foreground',
          TRANSITION_PRESETS.fastColor,
          FOCUS_TOKENS.classes.brand,
          'min-w-[160px]'
        )}
        onClick={() => setOpen(true)}
        aria-label={t('layout.search')}
        aria-haspopup="dialog"
      >
        <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="flex-1 text-left truncate">{t('layout.searchPlaceholder')}</span>
        <kbd className="ml-auto text-xs text-muted-foreground/70 font-sans pointer-events-none">
          {t('layout.searchShortcut')}
        </kbd>
      </button>

      <GlobalSearchDialog open={open} onOpenChange={setOpen} filteredSections={filteredSections} />
    </>
  );
}
