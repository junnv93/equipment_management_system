'use client';

import Link from 'next/link';
import { Package, SearchX, FilterX, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EQUIPMENT_EMPTY_STATE_TOKENS } from '@/lib/design-tokens';

/**
 * 검색/필터 결과 없음 빈 상태
 */
export function EmptySearchResults({
  hasActiveFilters,
  searchTerm,
  onClearFilters,
}: {
  hasActiveFilters: boolean;
  searchTerm?: string;
  onClearFilters: () => void;
}) {
  const t = useTranslations('equipment');
  const Icon = searchTerm ? SearchX : FilterX;

  return (
    <div className={`${EQUIPMENT_EMPTY_STATE_TOKENS.container} py-16`}>
      <Icon className={EQUIPMENT_EMPTY_STATE_TOKENS.icon} aria-hidden="true" />
      <h3 className={EQUIPMENT_EMPTY_STATE_TOKENS.title}>
        {searchTerm ? t('list.noSearchResults') : t('list.noFilterResults')}
      </h3>
      <p className={`${EQUIPMENT_EMPTY_STATE_TOKENS.description} max-w-md mx-auto`}>
        {searchTerm
          ? t('list.noSearchResultsDesc', { term: searchTerm })
          : t('list.noFilterResultsDesc')}
      </p>
      {hasActiveFilters && (
        <Button variant="outline" className="mt-4" onClick={onClearFilters} type="button">
          <FilterX className="h-4 w-4 mr-1.5" aria-hidden="true" />
          {t('list.clearFilters')}
        </Button>
      )}
    </div>
  );
}

/**
 * 데이터 없음 빈 상태 (초기 장비 미등록)
 */
export function EquipmentEmptyState() {
  const t = useTranslations('equipment');
  return (
    <div className={`${EQUIPMENT_EMPTY_STATE_TOKENS.container} py-16`}>
      <Package className={EQUIPMENT_EMPTY_STATE_TOKENS.icon} aria-hidden="true" />
      <h3 className={EQUIPMENT_EMPTY_STATE_TOKENS.title}>{t('list.empty')}</h3>
      <p className={`${EQUIPMENT_EMPTY_STATE_TOKENS.description} max-w-md mx-auto`}>
        {t('list.emptyDescription')}
      </p>
      <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild>
          <Link href="/equipment/create">
            <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
            {t('list.createButton')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
