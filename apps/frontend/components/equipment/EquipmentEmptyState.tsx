'use client';

import { Package, SearchX, FilterX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/shared/EmptyState';
import { Permission, FRONTEND_ROUTES } from '@equipment-management/shared-constants';

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
    <EmptyState
      variant="filtered"
      icon={Icon}
      title={searchTerm ? t('list.noSearchResults') : t('list.noFilterResults')}
      description={
        searchTerm
          ? t('list.noSearchResultsDesc', { term: searchTerm })
          : t('list.noFilterResultsDesc')
      }
      secondaryAction={
        hasActiveFilters ? { label: t('list.clearFilters'), onClick: onClearFilters } : undefined
      }
      className="py-16"
    />
  );
}

/**
 * 데이터 없음 빈 상태 (초기 장비 미등록)
 */
export function EquipmentEmptyState() {
  const t = useTranslations('equipment');
  return (
    <EmptyState
      variant="no-data"
      icon={Package}
      title={t('list.empty')}
      description={t('list.emptyDescription')}
      primaryAction={{
        label: t('list.createButton'),
        href: FRONTEND_ROUTES.EQUIPMENT.CREATE,
        permission: Permission.CREATE_EQUIPMENT,
      }}
      className="py-16"
    />
  );
}
