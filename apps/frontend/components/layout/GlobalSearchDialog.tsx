'use client';

/**
 * GlobalSearchDialog
 *
 * ⌘K / Ctrl+K 전역 검색 다이얼로그
 * - 메뉴 탐색: nav-config.ts NAV_SECTIONS 기반 (i18n 라벨 검색)
 * - 최근 페이지: localStorage 기반 최근 5개
 * - 키보드 내비게이션: ↑↓ 이동, Enter 선택, Escape 닫기
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { LucideIcon } from 'lucide-react';
import { Search, Clock, LayoutGrid } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { FilteredNavSection } from '@/lib/navigation/nav-config';

const RECENT_PAGES_KEY = 'recent-pages';
const MAX_RECENT = 5;

interface RecentPage {
  href: string;
  label: string;
}

interface SearchResult {
  href: string;
  label: string;
  type: 'menu' | 'recent';
  icon?: LucideIcon;
}

function getRecentPages(): RecentPage[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_PAGES_KEY);
    return stored ? (JSON.parse(stored) as RecentPage[]) : [];
  } catch {
    return [];
  }
}

export function saveRecentPage(href: string, label: string) {
  if (typeof window === 'undefined') return;
  try {
    const pages = getRecentPages().filter((p) => p.href !== href);
    pages.unshift({ href, label });
    localStorage.setItem(RECENT_PAGES_KEY, JSON.stringify(pages.slice(0, MAX_RECENT)));
  } catch {
    // storage 오류 무시
  }
}

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Permission 필터링이 적용된 섹션 — DashboardShell의 filteredSections */
  filteredSections: FilteredNavSection[];
}

export function GlobalSearchDialog({
  open,
  onOpenChange,
  filteredSections,
}: GlobalSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const t = useTranslations('navigation');
  const inputRef = useRef<HTMLInputElement>(null);

  // 다이얼로그 열릴 때 입력창 포커스, 상태 초기화
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // 메뉴 검색 — filteredSections (Permission 필터링 적용됨)
  const menuResults: SearchResult[] = filteredSections
    .flatMap((section) =>
      section.items.map((item) => ({
        href: item.href,
        label: item.label,
        type: 'menu' as const,
        icon: item.icon,
      }))
    )
    .filter((item) => (query ? item.label.toLowerCase().includes(query.toLowerCase()) : true));

  // 최근 페이지
  const recentResults: SearchResult[] = getRecentPages()
    .filter((p) => (query ? p.label.toLowerCase().includes(query.toLowerCase()) : true))
    .map((p) => ({ href: p.href, label: p.label, type: 'recent' as const }));

  // 전체 결과: query 없을 때 최근 > 메뉴, query 있을 때 메뉴 > 최근
  const allResults = useMemo<SearchResult[]>(
    () => (query ? [...menuResults, ...recentResults] : [...recentResults, ...menuResults]),
    [query, menuResults, recentResults]
  );

  const safeSelectedIndex = Math.min(selectedIndex, Math.max(0, allResults.length - 1));

  const handleSelect = useCallback(
    (result: SearchResult) => {
      saveRecentPage(result.href, result.label);
      router.push(result.href);
      onOpenChange(false);
    },
    [router, onOpenChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          if (allResults[safeSelectedIndex]) {
            handleSelect(allResults[safeSelectedIndex]);
          }
          break;
        case 'Escape':
          onOpenChange(false);
          break;
      }
    },
    [allResults, safeSelectedIndex, handleSelect, onOpenChange]
  );

  const showRecentSection = !query && recentResults.length > 0;
  const showMenuSection = menuResults.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-md overflow-hidden" onKeyDown={handleKeyDown}>
        <DialogHeader className="sr-only">
          <DialogTitle>{t('layout.search')}</DialogTitle>
        </DialogHeader>

        {/* 검색 입력 */}
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={t('layout.searchPlaceholder')}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label={t('layout.search')}
            role="combobox"
            aria-expanded={allResults.length > 0}
            aria-haspopup="listbox"
          />
        </div>

        {/* 결과 영역 */}
        <div className="max-h-[320px] overflow-y-auto p-1" role="listbox">
          {allResults.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t('layout.noResults')}
            </p>
          )}

          {/* 최근 페이지 섹션 */}
          {showRecentSection && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                {t('layout.recentPages')}
              </p>
              {recentResults.map((result, idx) => (
                <SearchResultItem
                  key={`${result.href}-recent`}
                  result={result}
                  isSelected={idx === safeSelectedIndex}
                  onClick={() => handleSelect(result)}
                />
              ))}
            </div>
          )}

          {/* 메뉴 섹션 */}
          {showMenuSection && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                {t('layout.menus')}
              </p>
              {menuResults.map((result, idx) => {
                const globalIdx = showRecentSection ? recentResults.length + idx : idx;
                return (
                  <SearchResultItem
                    key={`${result.href}-menu`}
                    result={result}
                    isSelected={globalIdx === safeSelectedIndex}
                    onClick={() => handleSelect(result)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SearchResultItem({
  result,
  isSelected,
  onClick,
}: {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
}) {
  // 메뉴 아이템: 실제 메뉴 아이콘 표시 / 최근 페이지: Clock / fallback: LayoutGrid
  const Icon = result.type === 'recent' ? Clock : (result.icon ?? LayoutGrid);
  return (
    <button
      className={cn(
        'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left',
        'motion-safe:transition-colors motion-reduce:transition-none',
        isSelected ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/50'
      )}
      onClick={onClick}
      role="option"
      aria-selected={isSelected}
    >
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
      <span className="truncate">{result.label}</span>
    </button>
  );
}
