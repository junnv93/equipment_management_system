'use client';

import React, { memo, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, SlidersHorizontal, RotateCcw, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EQUIPMENT_FILTER_TOKENS } from '@/lib/design-tokens';
import { useFilterSelect } from '@/lib/utils/filter-select-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type Site,
  type EquipmentStatus,
  type CalibrationMethod,
  type Classification,
  SITE_VALUES,
  EQUIPMENT_STATUS_FILTER_OPTIONS,
  CALIBRATION_METHOD_LABELS,
  CLASSIFICATION_LABELS,
} from '@equipment-management/schemas';
import {
  EQUIPMENT_DATA_SCOPE,
  resolveDataScope,
  SELECTOR_PAGE_SIZE,
  type UserRole,
} from '@equipment-management/shared-constants';
import type {
  EquipmentFilters as FiltersType,
  CalibrationDueFilter,
} from '@/hooks/useEquipmentFilters';
import { useAuth } from '@/hooks/use-auth';
import teamsApi from '@/lib/api/teams-api';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';

interface EquipmentFiltersProps {
  filters: FiltersType;
  onSiteChange: (site: Site | '') => void;
  onStatusChange: (status: EquipmentStatus | '') => void;
  onCalibrationMethodChange: (method: CalibrationMethod | '') => void;
  onClassificationChange: (classification: Classification | '') => void;
  onIsSharedChange: (isShared: 'all' | 'shared' | 'normal') => void;
  onCalibrationDueFilterChange: (filter: CalibrationDueFilter) => void;
  onTeamIdChange: (teamId: string) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
  hasActiveFilters: boolean;
  className?: string;
  /** Primary 필터 행 앞에 렌더링할 슬롯 (SearchBar 등) */
  slotBefore?: React.ReactNode;
  /** Primary 필터 행 끝에 렌더링할 슬롯 (ViewToggle 등) */
  slotAfter?: React.ReactNode;
}

/**
 * 활성 필터 배지
 */
const ActiveFilterBadge = memo(function ActiveFilterBadge({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  const t = useTranslations('equipment');
  return (
    <Badge variant="secondary" className={`gap-1 pl-2 pr-1 ${EQUIPMENT_FILTER_TOKENS.activeBadge}`}>
      {label}
      <button
        type="button"
        onClick={onRemove}
        className={`ml-1 rounded-full p-0.5 ${EQUIPMENT_FILTER_TOKENS.removeButton}`}
        aria-label={t('filters.removeFilter', { label })}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
});

/**
 * 장비 필터 컴포넌트 (컴팩트 인라인 바)
 *
 * - 1차 필터(Site, Status, CalibrationDue) + "추가 필터" 확장 버튼
 * - 2차 필터(CalibrationMethod, Classification, IsShared, Team) — 확장 시 표시
 * - 활성 필터 배지 (하단 행)
 */
function EquipmentFiltersComponent({
  filters,
  onSiteChange,
  onStatusChange,
  onCalibrationMethodChange,
  onClassificationChange,
  onIsSharedChange,
  onCalibrationDueFilterChange,
  onTeamIdChange,
  onClearFilters,
  hasActiveFilters,
  className = '',
  slotBefore,
  slotAfter,
}: EquipmentFiltersProps) {
  const t = useTranslations('equipment');
  const { user } = useAuth();

  // ✅ Select spurious onValueChange guard (SSOT: useFilterSelect)
  const siteSelect = useFilterSelect(filters.site, onSiteChange);
  const statusSelect = useFilterSelect(filters.status, onStatusChange);
  const calibMethodSelect = useFilterSelect(filters.calibrationMethod, onCalibrationMethodChange);
  const classificationSelect = useFilterSelect(filters.classification, onClassificationChange);
  const teamFilterSelect = useFilterSelect(filters.teamId, onTeamIdChange);

  // UI-only 상태 (서버 상태 아님 → useState 허용)
  const [isExpanded, setIsExpanded] = useState(false);

  // 역할 기반 사이트 필터 고정 여부
  const isSiteFixed = user?.role
    ? resolveDataScope({ role: user.role as UserRole, site: user.site }, EQUIPMENT_DATA_SCOPE)
        .type === 'site'
    : false;

  // i18n 옵션 생성
  const statusOptions = useMemo(
    () =>
      EQUIPMENT_STATUS_FILTER_OPTIONS.map((value) => ({
        value,
        label: t(`status.${value}` as Parameters<typeof t>[0]),
      })),
    [t]
  );

  const siteOptions = useMemo(
    () =>
      SITE_VALUES.map((value) => ({
        value,
        label: t(`siteLabel.${value}` as Parameters<typeof t>[0]),
      })),
    [t]
  );

  const calibrationMethodOptions = useMemo(
    () =>
      (Object.keys(CALIBRATION_METHOD_LABELS) as CalibrationMethod[]).map((value) => ({
        value,
        label: t(`filters.calibrationMethodLabel.${value}` as Parameters<typeof t>[0]),
      })),
    [t]
  );

  const classificationOptions = useMemo(
    () =>
      (Object.entries(CLASSIFICATION_LABELS) as [Classification, string][]).map(
        ([value, label]) => ({
          value,
          label,
        })
      ),
    []
  );

  const sharedOptions = useMemo<{ value: 'all' | 'shared' | 'normal'; label: string }[]>(
    () => [
      { value: 'all', label: t('filters.allEquipment') },
      { value: 'shared', label: t('filters.sharedEquipment') },
      { value: 'normal', label: t('filters.normalEquipment') },
    ],
    [t]
  );

  const calibrationDueOptions = useMemo<
    { value: CalibrationDueFilter; label: string; description: string }[]
  >(
    () => [
      {
        value: 'all',
        label: t('filters.calibrationDueAll'),
        description: t('filters.allDescription'),
      },
      {
        value: 'due_soon',
        label: t('filters.calibrationDueSoon'),
        description: t('filters.calibrationDueSoonDesc'),
      },
      {
        value: 'overdue',
        label: t('filters.calibrationOverdue'),
        description: t('filters.calibrationOverdueDesc'),
      },
      {
        value: 'normal',
        label: t('filters.calibrationNormal'),
        description: t('filters.calibrationNormalDesc'),
      },
    ],
    [t]
  );

  const teamQuerySite = filters.site || user?.site;

  const { data: teamsData, isLoading: isLoadingTeams } = useQuery({
    queryKey: queryKeys.teams.filterOptions(teamQuerySite),
    queryFn: () =>
      teamsApi.getTeams({
        site: teamQuerySite,
        pageSize: SELECTOR_PAGE_SIZE,
      }),
    staleTime: CACHE_TIMES.LONG,
    gcTime: CACHE_TIMES.VERY_LONG,
    enabled: !!teamQuerySite,
  });

  const teamOptions = useMemo(() => {
    const teams = teamsData?.data || [];
    return teams.map((team) => ({ value: team.id, label: team.name }));
  }, [teamsData?.data]);

  // 2차 필터 활성 개수 (추가 필터 버튼 배지용)
  const additionalFilterCount = useMemo(() => {
    let count = 0;
    if (filters.calibrationMethod) count++;
    if (filters.classification) count++;
    if (filters.isShared !== 'all') count++;
    if (filters.teamId) count++;
    return count;
  }, [filters.calibrationMethod, filters.classification, filters.isShared, filters.teamId]);

  // 활성 필터 배지 라벨 함수들
  const getStatusLabel = useCallback(
    (status: EquipmentStatus) => {
      return statusOptions.find((opt) => opt.value === status)?.label || status;
    },
    [statusOptions]
  );

  const getSiteLabel = useCallback(
    (site: Site) => {
      return siteOptions.find((opt) => opt.value === site)?.label || site;
    },
    [siteOptions]
  );

  const getCalibrationMethodLabel = useCallback(
    (method: CalibrationMethod) => {
      return calibrationMethodOptions.find((opt) => opt.value === method)?.label || method;
    },
    [calibrationMethodOptions]
  );

  const getClassificationLabel = useCallback(
    (classification: Classification) => {
      return (
        classificationOptions.find((opt) => opt.value === classification)?.label || classification
      );
    },
    [classificationOptions]
  );

  const getSharedLabel = useCallback(
    (isShared: 'all' | 'shared' | 'normal') => {
      return sharedOptions.find((opt) => opt.value === isShared)?.label || isShared;
    },
    [sharedOptions]
  );

  const getCalibrationDueLabel = useCallback(
    (filter: CalibrationDueFilter) => {
      return calibrationDueOptions.find((opt) => opt.value === filter)?.label || filter;
    },
    [calibrationDueOptions]
  );

  const getTeamLabel = useCallback(
    (teamId: string) => {
      return teamOptions.find((opt) => opt.value === teamId)?.label || t('filters.unknownTeam');
    },
    [teamOptions, t]
  );

  return (
    <div
      className={`${EQUIPMENT_FILTER_TOKENS.layout.root} ${className}`}
      role="group"
      aria-label={t('filters.filterOptions')}
    >
      {/* 1차 필터: slotBefore + Site, Status, CalibrationDue + 추가 필터 버튼 + slotAfter */}
      <div className={EQUIPMENT_FILTER_TOKENS.layout.primaryRow}>
        {slotBefore}
        {/* 사이트 필터 */}
        <Select {...siteSelect} disabled={isSiteFixed}>
          <SelectTrigger
            className={`h-9 w-[120px] text-sm ${isSiteFixed ? 'cursor-not-allowed opacity-60' : ''}`}
            aria-label={t('filters.siteFilter')}
          >
            <SelectValue placeholder={t('filters.allSites')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">{t('filters.allSites')}</SelectItem>
            {siteOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 상태 필터 */}
        <Select {...statusSelect}>
          <SelectTrigger className="h-9 w-[130px] text-sm" aria-label={t('filters.statusFilter')}>
            <SelectValue placeholder={t('filters.allStatuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">{t('filters.allStatuses')}</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 교정 기한 필터 */}
        <Select
          value={filters.calibrationDueFilter}
          onValueChange={(value) => onCalibrationDueFilterChange(value as CalibrationDueFilter)}
        >
          <SelectTrigger
            className="h-9 w-[130px] text-sm"
            aria-label={t('filters.calibrationDueFilter')}
          >
            <SelectValue placeholder={t('filters.calibrationDueAll')} />
          </SelectTrigger>
          <SelectContent>
            {calibrationDueOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  {option.description && (
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 추가 필터 버튼 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-9 gap-1.5"
          type="button"
          aria-expanded={isExpanded}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {additionalFilterCount > 0
            ? t('filters.moreFiltersCount', { count: additionalFilterCount })
            : t('filters.moreFilters')}
        </Button>

        {slotAfter && <div className="ml-auto flex items-center gap-2 shrink-0">{slotAfter}</div>}
      </div>

      {/* 2차 필터 (CSS-only grid-rows 트랜지션) */}
      <div
        className={`grid ${EQUIPMENT_FILTER_TOKENS.expandTransition} ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className={EQUIPMENT_FILTER_TOKENS.layout.secondaryRow}>
            {/* 교정 방법 필터 */}
            <Select {...calibMethodSelect}>
              <SelectTrigger
                className="h-9 w-[150px] text-sm"
                aria-label={t('filters.calibrationFilter')}
              >
                <SelectValue placeholder={t('filters.allCalibrationMethods')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">{t('filters.allCalibrationMethods')}</SelectItem>
                {calibrationMethodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 장비 분류 필터 */}
            <Select {...classificationSelect}>
              <SelectTrigger
                className="h-9 w-[130px]"
                aria-label={t('filters.classificationFilter')}
              >
                <SelectValue placeholder={t('filters.allClassifications')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">{t('filters.allClassifications')}</SelectItem>
                {classificationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 공용장비 필터 */}
            <Select
              value={filters.isShared}
              onValueChange={(value) => onIsSharedChange(value as 'all' | 'shared' | 'normal')}
            >
              <SelectTrigger className="h-9 w-[130px]" aria-label={t('filters.sharedFilter')}>
                <SelectValue placeholder={t('filters.allEquipment')} />
              </SelectTrigger>
              <SelectContent>
                {sharedOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 팀 필터 */}
            <Select {...teamFilterSelect} disabled={isLoadingTeams}>
              <SelectTrigger className="h-9 w-[150px] text-sm" aria-label={t('filters.teamFilter')}>
                {isLoadingTeams ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
                    {t('filters.loading')}
                  </span>
                ) : (
                  <SelectValue placeholder={t('filters.allTeams')} />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">{t('filters.allTeams')}</SelectItem>
                {teamOptions
                  .filter((opt) => opt.value)
                  .map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 활성 필터 배지 + 초기화 버튼 */}
      {hasActiveFilters && (
        <div
          className="flex flex-wrap items-center gap-1"
          role="list"
          aria-label={t('filters.appliedFilters')}
        >
          {filters.site && !isSiteFixed && (
            <ActiveFilterBadge
              label={t('filters.badgeSite', { label: getSiteLabel(filters.site) })}
              onRemove={() => onSiteChange('')}
            />
          )}
          {filters.status && (
            <ActiveFilterBadge
              label={t('filters.badgeStatus', { label: getStatusLabel(filters.status) })}
              onRemove={() => onStatusChange('')}
            />
          )}
          {filters.calibrationMethod && (
            <ActiveFilterBadge
              label={t('filters.badgeCalibration', {
                label: getCalibrationMethodLabel(filters.calibrationMethod),
              })}
              onRemove={() => onCalibrationMethodChange('')}
            />
          )}
          {filters.classification && (
            <ActiveFilterBadge
              label={t('filters.badgeClassification', {
                label: getClassificationLabel(filters.classification),
              })}
              onRemove={() => onClassificationChange('')}
            />
          )}
          {filters.isShared !== 'all' && (
            <ActiveFilterBadge
              label={t('filters.badgeShared', { label: getSharedLabel(filters.isShared) })}
              onRemove={() => onIsSharedChange('all')}
            />
          )}
          {filters.calibrationDueFilter !== 'all' && (
            <ActiveFilterBadge
              label={t('filters.badgeCalibrationDue', {
                label: getCalibrationDueLabel(filters.calibrationDueFilter),
              })}
              onRemove={() => onCalibrationDueFilterChange('all')}
            />
          )}
          {filters.teamId && (
            <ActiveFilterBadge
              label={t('filters.badgeTeam', { label: getTeamLabel(filters.teamId) })}
              onRemove={() => onTeamIdChange('')}
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground ml-1"
            type="button"
          >
            <RotateCcw className="h-3 w-3" />
            {t('filters.reset')}
          </Button>
        </div>
      )}
    </div>
  );
}

export const EquipmentFilters = memo(EquipmentFiltersComponent);
export default EquipmentFilters;
