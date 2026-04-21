'use client';

import { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { Calendar, MapPin, Tag, Package, ArrowRight, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Equipment } from '@/lib/api/equipment-api';
import type { RowSelectionAPI } from '@/hooks/use-bulk-selection';
import { Checkbox } from '@/components/ui/checkbox';
import { SharedEquipmentBadge } from './SharedEquipmentBadge';
import { UsagePeriodBadge } from './UsagePeriodBadge';
import { HighlightText } from '@/components/shared/HighlightText';
import { cn } from '@/lib/utils';
import {
  EQUIPMENT_STATUS_TOKENS,
  DEFAULT_STATUS_CONFIG,
  CALIBRATION_BADGE_TOKENS,
  EQUIPMENT_CARD_PERFORMANCE_CLASSES,
  EQUIPMENT_CARD_GRID_TOKENS,
  getEquipmentCardClasses,
  EQUIPMENT_EMPTY_STATE_TOKENS,
  getStaggerDelay,
  getManagementNumberClasses,
  getEquipmentStatusTokenStyle,
  getTransitionClasses,
} from '@/lib/design-tokens';
import { getDisplayStatus } from '@/lib/constants/equipment-status-styles';
import { calculateCalibrationStatus } from '@/lib/utils/calibration-status';
import { EquipmentStatusEnum, EquipmentStatusValues } from '@equipment-management/schemas';
import type { ManagementMethod, EquipmentStatus } from '@equipment-management/schemas';

interface EquipmentCardGridProps {
  items: Equipment[];
  isLoading: boolean;
  searchTerm?: string;
  selection?: RowSelectionAPI<Equipment>;
}

/**
 * 스켈레톤 카드
 */
const SkeletonCard = memo(function SkeletonCard() {
  return (
    <Card className="border-l-4 border-l-brand-border-default motion-safe:animate-pulse">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Skeleton className="h-9 w-full rounded-md" />
      </CardFooter>
    </Card>
  );
});

/**
 * 장비 카드 컴포넌트
 */
const EquipmentCard = memo(function EquipmentCard({
  equipment,
  searchTerm,
  isSelected,
  toggle,
}: {
  equipment: Equipment;
  searchTerm?: string;
  /** 선택 모드가 활성일 때만 전달 — boolean primitive로 해당 카드만 리렌더 */
  isSelected?: boolean;
  /** stable useCallback ref (useRowSelection.toggle) */
  toggle?: (id: string, item: Equipment) => void;
}) {
  const t = useTranslations('equipment');
  const tCommon = useTranslations('common');
  const tCal = useTranslations('calibration');
  const { fmtDate } = useDateFormatter();
  const handleToggle = useCallback(() => {
    toggle?.(equipment.id, equipment);
  }, [toggle, equipment]);
  // design token SSOT: 실시간 교정기한 초과 체크 포함
  const style = getEquipmentStatusTokenStyle(equipment.status, equipment.nextCalibrationDate);

  // Design Token: 상태별 카드 border 스타일
  const statusToken =
    EQUIPMENT_STATUS_TOKENS[equipment.status || 'available'] || DEFAULT_STATUS_CONFIG;

  // SSOT: calculateCalibrationStatus로 교정 상태 계산 통합
  const calibrationStatus = useMemo(
    () =>
      calculateCalibrationStatus(
        equipment.status,
        !!equipment.calibrationRequired,
        equipment.managementMethod as ManagementMethod | undefined,
        equipment.nextCalibrationDate
      ),
    [
      equipment.status,
      equipment.calibrationRequired,
      equipment.managementMethod,
      equipment.nextCalibrationDate,
    ]
  );

  return (
    <Card
      className={cn(
        getEquipmentCardClasses(statusToken.card.borderColor),
        'hover:border-brand-border-strong hover:shadow-sm',
        getTransitionClasses('fast', ['border-color', 'box-shadow'])
      )}
      role="article"
      aria-labelledby={`equipment-${equipment.id}-name`}
      data-testid="equipment-card"
    >
      <CardHeader className="pb-2">
        {/* 관리번호 1차 식별자 위계 */}
        <div className="flex justify-between items-start gap-2">
          {/* per-row 체크박스 (카드 좌측 상단) */}
          {toggle !== undefined && (
            <Checkbox
              checked={isSelected ?? false}
              onCheckedChange={handleToggle}
              disabled={equipment.status === EquipmentStatusEnum.enum.disposed}
              aria-label={tCommon('bulk.selectRow', {
                name: equipment.name || equipment.managementNumber || equipment.id,
              })}
              className="mt-0.5 shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <p
              className={`text-xs ${getManagementNumberClasses()} tracking-wider`}
              data-testid="management-number"
            >
              <HighlightText text={equipment.managementNumber || '-'} search={searchTerm} />
            </p>
            <CardTitle
              id={`equipment-${equipment.id}-name`}
              className="text-base font-semibold truncate flex items-center gap-2 mt-0.5"
              data-testid="equipment-name"
            >
              <HighlightText text={equipment.name || t('card.noName')} search={searchTerm} />
              {equipment.isShared && (
                <SharedEquipmentBadge sharedSource={equipment.sharedSource} size="sm" />
              )}
            </CardTitle>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge
              variant="outline"
              className={`${style.className} border-0`}
              data-testid="status-badge"
            >
              {t(
                `status.${getDisplayStatus((equipment.status || 'available') as EquipmentStatus)}` as Parameters<
                  typeof t
                >[0]
              )}
            </Badge>
            {calibrationStatus && (
              <Badge
                variant="outline"
                className={cn(
                  'border-0 text-xs inline-flex items-center gap-1',
                  CALIBRATION_BADGE_TOKENS[calibrationStatus.severity].card
                )}
                title={
                  calibrationStatus.fullLabelKey
                    ? tCal(
                        calibrationStatus.fullLabelKey as Parameters<typeof tCal>[0],
                        calibrationStatus.fullLabelParams
                      )
                    : calibrationStatus.fullLabel
                }
              >
                <calibrationStatus.icon className="h-3 w-3" aria-hidden="true" />
                {calibrationStatus.label}
              </Badge>
            )}
            {/* 임시등록 장비 사용 기간 표시 */}
            {equipment.status === EquipmentStatusValues.TEMPORARY &&
              equipment.usagePeriodStart &&
              equipment.usagePeriodEnd && (
                <UsagePeriodBadge
                  startDate={equipment.usagePeriodStart}
                  endDate={equipment.usagePeriodEnd}
                  className="text-xs"
                />
              )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <dl className="space-y-1 text-sm">
          {equipment.modelName && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <dt className="sr-only">{t('card.modelSrOnly')}</dt>
              <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <dd className="line-clamp-1">
                <HighlightText text={equipment.modelName} search={searchTerm} />
              </dd>
            </div>
          )}

          {equipment.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <dt className="sr-only">{t('card.locationSrOnly')}</dt>
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <dd className="line-clamp-1">{equipment.location}</dd>
            </div>
          )}

          {/* 소유처 원본 번호 (공용/렌탈 장비) */}
          {equipment.isShared && equipment.externalIdentifier && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <dt className="sr-only">{t('card.ownerNumberSrOnly')}</dt>
              <Package className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <dd
                className="truncate"
                title={t('card.ownerNumberTitle', { number: equipment.externalIdentifier })}
              >
                {equipment.externalIdentifier}
              </dd>
            </div>
          )}

          {equipment.lastCalibrationDate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <dt className="sr-only">{t('card.lastCalibrationSrOnly')}</dt>
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <dd>
                {t('card.calibrationPrefix')}
                {fmtDate(equipment.lastCalibrationDate)}
              </dd>
            </div>
          )}

          {equipment.managementMethod && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <dt className="sr-only">{t('card.managementMethodSrOnly')}</dt>
              <Wrench className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <dd>
                {t(
                  `filters.managementMethodLabel.${equipment.managementMethod as ManagementMethod}` as Parameters<
                    typeof t
                  >[0]
                )}
              </dd>
            </div>
          )}
        </dl>
      </CardContent>

      <CardFooter className="pt-2 justify-end">
        <Link
          href={`/equipment/${equipment.id}`}
          aria-label={t('card.viewDetailAriaLabel', { name: equipment.name || '' })}
          className={cn(
            'inline-flex items-center gap-1 text-sm text-brand-text-secondary hover:text-brand-text-primary',
            getTransitionClasses('fast', ['color'])
          )}
        >
          {t('detail.viewDetail')}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </CardFooter>
    </Card>
  );
});

/**
 * 장비 카드 그리드 컴포넌트
 *
 * - 반응형 그리드 레이아웃
 * - 상태별 색상 뱃지 및 테두리
 * - 검색어 하이라이팅
 * - 스켈레톤 로딩
 */
function EquipmentCardGridComponent({
  items,
  isLoading,
  searchTerm,
  selection,
}: EquipmentCardGridProps) {
  const t = useTranslations('equipment');
  // stable ref 추출 — selection 객체 전체 전달 시 선택 변경마다 전체 카드 리렌더되므로 분해
  const toggleFn = selection?.toggle;
  const isSelectedFn = selection?.isSelected;
  if (isLoading) {
    return (
      <div
        className={EQUIPMENT_CARD_GRID_TOKENS.grid}
        data-testid="equipment-card-grid"
        aria-busy="true"
        aria-live="polite"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ animationDelay: getStaggerDelay(i, 'grid') }}>
            <SkeletonCard />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={EQUIPMENT_EMPTY_STATE_TOKENS.container} data-testid="equipment-card-grid">
        <Package
          className={cn(EQUIPMENT_EMPTY_STATE_TOKENS.icon, 'motion-safe:animate-gentle-bounce')}
          aria-hidden="true"
        />
        <p className={EQUIPMENT_EMPTY_STATE_TOKENS.title}>{t('list.noItems')}</p>
        <p className={EQUIPMENT_EMPTY_STATE_TOKENS.description}>{t('list.tryOtherFilters')}</p>
      </div>
    );
  }

  return (
    <div
      className={EQUIPMENT_CARD_GRID_TOKENS.grid}
      data-testid="equipment-card-grid"
      role="feed"
      aria-label={t('card.gridAriaLabel')}
      aria-busy={isLoading}
    >
      {items.map((equipment) => (
        <div key={equipment.id} className={EQUIPMENT_CARD_PERFORMANCE_CLASSES}>
          <EquipmentCard
            equipment={equipment}
            searchTerm={searchTerm}
            isSelected={isSelectedFn?.(equipment.id)}
            toggle={toggleFn}
          />
        </div>
      ))}
    </div>
  );
}

export const EquipmentCardGrid = memo(EquipmentCardGridComponent);
export default EquipmentCardGrid;
