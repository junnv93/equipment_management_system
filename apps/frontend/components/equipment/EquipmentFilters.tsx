'use client';

import { memo, useCallback } from 'react';
import { Filter, X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Site, EquipmentStatus, CalibrationMethod } from '@equipment-management/schemas';
import type { EquipmentFilters as FiltersType, CalibrationDueFilter } from '@/hooks/useEquipmentFilters';
import { useAuth } from '@/hooks/use-auth';

/**
 * 장비 상태 옵션
 */
const STATUS_OPTIONS: { value: EquipmentStatus | ''; label: string }[] = [
  { value: '', label: '모든 상태' },
  { value: 'available', label: '사용 가능' },
  { value: 'in_use', label: '사용 중' },
  { value: 'checked_out', label: '반출 중' },
  { value: 'calibration_scheduled', label: '교정 예정' },
  { value: 'calibration_overdue', label: '교정 기한 초과' },
  { value: 'non_conforming', label: '부적합' },
  { value: 'spare', label: '여분' },
  { value: 'retired', label: '폐기' },
];

/**
 * 사이트 옵션
 */
const SITE_OPTIONS: { value: Site | ''; label: string }[] = [
  { value: '', label: '모든 사이트' },
  { value: 'suwon', label: '수원랩' },
  { value: 'uiwang', label: '의왕랩' },
];

/**
 * 교정 방법 옵션
 */
const CALIBRATION_METHOD_OPTIONS: { value: CalibrationMethod | ''; label: string }[] = [
  { value: '', label: '모든 교정 방법' },
  { value: 'external_calibration', label: '외부 교정' },
  { value: 'self_inspection', label: '자체 점검' },
  { value: 'not_applicable', label: '비대상' },
];

/**
 * 공용장비 옵션
 */
const SHARED_OPTIONS: { value: 'all' | 'shared' | 'normal'; label: string }[] = [
  { value: 'all', label: '모든 장비' },
  { value: 'shared', label: '공용장비' },
  { value: 'normal', label: '일반장비' },
];

/**
 * 교정 기한 필터 옵션
 */
const CALIBRATION_DUE_OPTIONS: { value: CalibrationDueFilter; label: string; description: string }[] = [
  { value: 'all', label: '전체', description: '모든 장비' },
  { value: 'due_soon', label: '교정 임박', description: '30일 이내 교정 예정' },
  { value: 'overdue', label: '기한 초과', description: '교정 기한이 지남' },
  { value: 'normal', label: '정상', description: '교정 기한 여유' },
];

/**
 * 팀 옵션
 * TODO: 추후 API로 동적으로 가져오도록 개선
 */
const TEAM_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '모든 팀' },
  { value: 'rf', label: 'RF팀' },
  { value: 'sar', label: 'SAR팀' },
  { value: 'emc', label: 'EMC팀' },
  { value: 'auto', label: 'Automotive팀' },
];

interface EquipmentFiltersProps {
  filters: FiltersType;
  onSiteChange: (site: Site | '') => void;
  onStatusChange: (status: EquipmentStatus | '') => void;
  onCalibrationMethodChange: (method: CalibrationMethod | '') => void;
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
  return (
    <Badge variant="secondary" className="gap-1 pl-2 pr-1">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
        aria-label={`${label} 필터 제거`}
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
  onIsSharedChange,
  onCalibrationDueFilterChange,
  onTeamIdChange,
  onClearFilters,
  activeFilterCount,
  hasActiveFilters,
  className = '',
}: EquipmentFiltersProps) {
  const { isManager, isAdmin } = useAuth();
  const canViewAllSites = isManager() || isAdmin();

  // 상태 라벨 가져오기
  const getStatusLabel = useCallback((status: EquipmentStatus) => {
    return STATUS_OPTIONS.find((opt) => opt.value === status)?.label || status;
  }, []);

  const getSiteLabel = useCallback((site: Site) => {
    return SITE_OPTIONS.find((opt) => opt.value === site)?.label || site;
  }, []);

  const getCalibrationMethodLabel = useCallback((method: CalibrationMethod) => {
    return CALIBRATION_METHOD_OPTIONS.find((opt) => opt.value === method)?.label || method;
  }, []);

  const getSharedLabel = useCallback((isShared: 'all' | 'shared' | 'normal') => {
    return SHARED_OPTIONS.find((opt) => opt.value === isShared)?.label || isShared;
  }, []);

  const getCalibrationDueLabel = useCallback((filter: CalibrationDueFilter) => {
    return CALIBRATION_DUE_OPTIONS.find((opt) => opt.value === filter)?.label || filter;
  }, []);

  const getTeamLabel = useCallback((teamId: string) => {
    return TEAM_OPTIONS.find((opt) => opt.value === teamId)?.label || '알 수 없는 팀';
  }, []);

  return (
    <Collapsible defaultOpen className={className}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="gap-2 p-0 h-auto hover:bg-transparent">
                <SlidersHorizontal className="h-4 w-4" />
                <CardTitle className="text-base">필터</CardTitle>
                {activeFilterCount > 0 && (
                  <Badge variant="default" className="ml-2">
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
                초기화
              </Button>
            )}
          </div>

          {/* 활성 필터 뱃지 */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3" role="list" aria-label="적용된 필터">
              {filters.site && (
                <ActiveFilterBadge
                  label={`사이트: ${getSiteLabel(filters.site)}`}
                  onRemove={() => onSiteChange('')}
                />
              )}
              {filters.status && (
                <ActiveFilterBadge
                  label={`상태: ${getStatusLabel(filters.status)}`}
                  onRemove={() => onStatusChange('')}
                />
              )}
              {filters.calibrationMethod && (
                <ActiveFilterBadge
                  label={`교정: ${getCalibrationMethodLabel(filters.calibrationMethod)}`}
                  onRemove={() => onCalibrationMethodChange('')}
                />
              )}
              {filters.isShared !== 'all' && (
                <ActiveFilterBadge
                  label={`구분: ${getSharedLabel(filters.isShared)}`}
                  onRemove={() => onIsSharedChange('all')}
                />
              )}
              {filters.calibrationDueFilter !== 'all' && (
                <ActiveFilterBadge
                  label={`교정기한: ${getCalibrationDueLabel(filters.calibrationDueFilter)}`}
                  onRemove={() => onCalibrationDueFilterChange('all')}
                />
              )}
              {filters.teamId && (
                <ActiveFilterBadge
                  label={`팀: ${getTeamLabel(filters.teamId)}`}
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
              aria-label="장비 필터 옵션"
            >
              {/* 사이트 필터 */}
              {canViewAllSites && (
                <div className="space-y-2">
                  <Label htmlFor="filter-site">사이트</Label>
                  <Select
                    value={filters.site || 'all'}
                    onValueChange={(value) => onSiteChange(value === 'all' ? '' : (value as Site))}
                  >
                    <SelectTrigger id="filter-site" aria-label="사이트 필터 선택">
                      <SelectValue placeholder="모든 사이트" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 사이트</SelectItem>
                      {SITE_OPTIONS.filter((opt) => opt.value).map((option) => (
                        <SelectItem key={option.value} value={option.value || 'all'}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 상태 필터 */}
              <div className="space-y-2">
                <Label htmlFor="filter-status">상태</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => onStatusChange(value === 'all' ? '' : (value as EquipmentStatus))}
                >
                  <SelectTrigger id="filter-status" aria-label="장비 상태 필터 선택">
                    <SelectValue placeholder="모든 상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 상태</SelectItem>
                    {STATUS_OPTIONS.filter((opt) => opt.value).map((option) => (
                      <SelectItem key={option.value} value={option.value || 'all'}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 교정 방법 필터 */}
              <div className="space-y-2">
                <Label htmlFor="filter-calibration">교정 방법</Label>
                <Select
                  value={filters.calibrationMethod || 'all'}
                  onValueChange={(value) =>
                    onCalibrationMethodChange(value === 'all' ? '' : (value as CalibrationMethod))
                  }
                >
                  <SelectTrigger id="filter-calibration" aria-label="교정 방법 필터 선택">
                    <SelectValue placeholder="모든 교정 방법" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 교정 방법</SelectItem>
                    {CALIBRATION_METHOD_OPTIONS.filter((opt) => opt.value).map((option) => (
                      <SelectItem key={option.value} value={option.value || 'all'}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 공용장비 필터 */}
              <div className="space-y-2">
                <Label htmlFor="filter-shared">장비 구분</Label>
                <Select
                  value={filters.isShared}
                  onValueChange={(value) => onIsSharedChange(value as 'all' | 'shared' | 'normal')}
                >
                  <SelectTrigger id="filter-shared" aria-label="장비 구분 필터 선택">
                    <SelectValue placeholder="모든 장비" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHARED_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 교정 기한 필터 */}
              <div className="space-y-2">
                <Label htmlFor="filter-calibration-due">교정 기한</Label>
                <Select
                  value={filters.calibrationDueFilter}
                  onValueChange={(value) => onCalibrationDueFilterChange(value as CalibrationDueFilter)}
                >
                  <SelectTrigger id="filter-calibration-due" aria-label="교정 기한 필터 선택">
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    {CALIBRATION_DUE_OPTIONS.map((option) => (
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
              </div>

              {/* 팀 필터 */}
              <div className="space-y-2">
                <Label htmlFor="filter-team">팀</Label>
                <Select
                  value={filters.teamId || 'all'}
                  onValueChange={(value) => onTeamIdChange(value === 'all' ? '' : value)}
                >
                  <SelectTrigger id="filter-team" aria-label="팀 필터 선택">
                    <SelectValue placeholder="모든 팀" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_OPTIONS.map((option) => (
                      <SelectItem key={option.value || 'all'} value={option.value || 'all'}>
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
