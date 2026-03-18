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
import { GlobalSearchDialog } from './GlobalSearchDialog';
import { HEADER_SEARCH_TOKENS } from '@/lib/design-tokens';
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
        className={HEADER_SEARCH_TOKENS.container}
        onClick={() => setOpen(true)}
        aria-label={t('layout.search')}
        aria-haspopup="dialog"
      >
        <Search className={HEADER_SEARCH_TOKENS.icon} aria-hidden="true" />
        <span className={HEADER_SEARCH_TOKENS.placeholder}>{t('layout.searchPlaceholder')}</span>
        <kbd className={HEADER_SEARCH_TOKENS.kbd}>{t('layout.searchShortcut')}</kbd>
      </button>

      <GlobalSearchDialog open={open} onOpenChange={setOpen} filteredSections={filteredSections} />
    </>
  );
}
