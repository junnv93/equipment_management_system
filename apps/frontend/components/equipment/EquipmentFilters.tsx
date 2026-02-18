'use client';

import { memo, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { X, SlidersHorizontal, RotateCcw, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { EQUIPMENT_FILTER_TOKENS } from '@/lib/design-tokens';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  type Site,
  type EquipmentStatus,
  type CalibrationMethod,
  type Classification,
  EQUIPMENT_STATUS_FILTER_OPTIONS,
  CALIBRATION_METHOD_LABELS,
  CLASSIFICATION_LABELS,
} from '@equipment-management/schemas';
import type {
  EquipmentFilters as FiltersType,
  CalibrationDueFilter,
} from '@/hooks/useEquipmentFilters';
import { useAuth } from '@/hooks/use-auth';
import teamsApi from '@/lib/api/teams-api';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';

/** 사이트 값 배열 (옵션 생성용) */
const SITE_VALUES: Site[] = ['suwon', 'uiwang', 'pyeongtaek'];

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
 * 장비 필터 컴포넌트
 *
 * - 사이트, 상태, 교정방법, 공용장비 필터
 * - 접이식 패널
 * - 활성 필터 뱃지 표시
 * - 필터 초기화 기능
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
  activeFilterCount,
  hasActiveFilters,
  className = '',
}: EquipmentFiltersProps) {
  const t = useTranslations('equipment');
  const { user } = useAuth();

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
        label: t(`filters.siteLabel.${value}` as Parameters<typeof t>[0]),
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

  // ✅ 사이트 필터링: 선택된 사이트의 팀만 조회
  // 사이트 필터가 선택되면 해당 사이트의 팀, 아니면 사용자 소속 사이트의 팀
  const teamQuerySite = filters.site || user?.site;

  // 팀 목록을 API에서 동적으로 가져오기
  const { data: teamsData, isLoading: isLoadingTeams } = useQuery({
    queryKey: queryKeys.teams.filterOptions(teamQuerySite),
    queryFn: () =>
      teamsApi.getTeams({
        site: teamQuerySite, // ✅ 사이트 필터 적용
        pageSize: 100,
      }),
    staleTime: CACHE_TIMES.LONG,
    gcTime: CACHE_TIMES.VERY_LONG,
    enabled: !!teamQuerySite, // 사이트 정보가 있을 때만 조회
  });

  // 팀 옵션 메모이제이션
  const teamOptions = useMemo(() => {
    const teams = teamsData?.data || [];
    return teams.map((team) => ({ value: team.id, label: team.name }));
  }, [teamsData?.data]);

  // 라벨 함수들 (활성 필터 배지용)
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
    [teamOptions]
  );

  return (
    <Collapsible defaultOpen className={className}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="gap-2 p-0 h-auto hover:bg-transparent">
                <SlidersHorizontal className="h-4 w-4" />
                <CardTitle className="text-base">{t('filters.title')}</CardTitle>
                {activeFilterCount > 0 && (
                  <Badge variant="default" className={`ml-2 ${EQUIPMENT_FILTER_TOKENS.count}`}>
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="gap-1 text-muted-foreground hover:text-foreground"
                type="button"
              >
                <RotateCcw className="h-3 w-3" />
                {t('filters.reset')}
              </Button>
            )}
          </div>

          {/* 활성 필터 뱃지 */}
          {hasActiveFilters && (
            <div
              className="flex flex-wrap gap-2 mt-3"
              role="list"
              aria-label={t('filters.appliedFilters')}
            >
              {filters.site && (
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
            </div>
          )}
        </CardHeader>

        <CollapsibleContent>
          <Separator />
          <CardContent className="pt-4">
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              role="group"
              aria-label={t('filters.filterOptions')}
            >
              {/* 사이트 필터 */}
              <div className="space-y-2">
                <Label htmlFor="filter-site">{t('filters.site')}</Label>
                <Select
                  value={filters.site || '_all'}
                  onValueChange={(value) => onSiteChange(value === '_all' ? '' : (value as Site))}
                >
                  <SelectTrigger id="filter-site" aria-label={t('filters.siteFilter')}>
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
              </div>

              {/* 상태 필터 */}
              <div className="space-y-2">
                <Label htmlFor="filter-status">{t('filters.status')}</Label>
                <Select
                  value={filters.status || '_all'}
                  onValueChange={(value) =>
                    onStatusChange(value === '_all' ? '' : (value as EquipmentStatus))
                  }
                >
                  <SelectTrigger id="filter-status" aria-label={t('filters.statusFilter')}>
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
              </div>

              {/* 교정 방법 필터 */}
              <div className="space-y-2">
                <Label htmlFor="filter-calibration">{t('filters.calibrationMethod')}</Label>
                <Select
                  value={filters.calibrationMethod || '_all'}
                  onValueChange={(value) =>
                    onCalibrationMethodChange(value === '_all' ? '' : (value as CalibrationMethod))
                  }
                >
                  <SelectTrigger
                    id="filter-calibration"
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
              </div>

              {/* 장비 분류 필터 */}
              <div className="space-y-2">
                <Label htmlFor="filter-classification">{t('filters.classification')}</Label>
                <Select
                  value={filters.classification || '_all'}
                  onValueChange={(value) =>
                    onClassificationChange(value === '_all' ? '' : (value as Classification))
                  }
                >
                  <SelectTrigger
                    id="filter-classification"
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
              </div>

              {/* 공용장비 필터 */}
              <div className="space-y-2">
                <Label htmlFor="filter-shared">{t('filters.shared')}</Label>
                <Select
                  value={filters.isShared}
                  onValueChange={(value) => onIsSharedChange(value as 'all' | 'shared' | 'normal')}
                >
                  <SelectTrigger id="filter-shared" aria-label={t('filters.sharedFilter')}>
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
              </div>

              {/* 교정 기한 필터 */}
              <div className="space-y-2">
                <Label htmlFor="filter-calibration-due">{t('filters.calibrationDue')}</Label>
                <Select
                  value={filters.calibrationDueFilter}
                  onValueChange={(value) =>
                    onCalibrationDueFilterChange(value as CalibrationDueFilter)
                  }
                >
                  <SelectTrigger
                    id="filter-calibration-due"
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
                            <span className="text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 팀 필터 */}
              <div className="space-y-2">
                <Label htmlFor="filter-team">{t('filters.team')}</Label>
                <Select
                  value={filters.teamId || '_all'}
                  onValueChange={(value) => onTeamIdChange(value === '_all' ? '' : value)}
                  disabled={isLoadingTeams}
                >
                  <SelectTrigger id="filter-team" aria-label={t('filters.teamFilter')}>
                    {isLoadingTeams ? (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
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
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export const EquipmentFilters = memo(EquipmentFiltersComponent);
export default EquipmentFilters;
