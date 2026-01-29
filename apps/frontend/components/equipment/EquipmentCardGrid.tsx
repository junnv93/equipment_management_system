'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import {
  Calendar,
  MapPin,
  Tag,
  Package,
  ArrowRight,
  Wrench,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Equipment } from '@/lib/api/equipment-api';
import { SharedEquipmentBadge } from './SharedEquipmentBadge';
import { HighlightText } from '@/components/shared/HighlightText';
import { cn } from '@/lib/utils';
import {
  getEquipmentStatusStyle,
  shouldDisplayCalibrationStatus,
} from '@/lib/constants/equipment-status-styles';

interface EquipmentCardGridProps {
  items: Equipment[];
  isLoading: boolean;
  searchTerm?: string;
}

/**
 * 스켈레톤 카드
 */
const SkeletonCard = memo(function SkeletonCard() {
  return (
    <Card className="border-l-4 border-l-gray-300 dark:border-l-gray-600 animate-pulse">
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
}: {
  equipment: Equipment;
  searchTerm?: string;
}) {
  const style = getEquipmentStatusStyle(equipment.status);

  const formatDate = (date?: string | Date | null) => {
    if (!date) return '-';
    return dayjs(date).format('YYYY-MM-DD');
  };

  /**
   * 교정 상태 계산 (동적)
   * - 폐기(retired), 부적합(non_conforming), 여분(spare) 상태는 표시 안함
   * - 교정 불필요 장비는 표시 안함
   * - 30일 이내 교정 만료 또는 기한 초과 시 D-day 형식으로 표시
   */
  const calibrationStatus = useMemo(() => {
    // 교정 상태 표시가 의미 없는 장비 상태
    if (!shouldDisplayCalibrationStatus(equipment.status)) {
      return null;
    }

    // 교정 불필요 장비
    if (!equipment.calibrationRequired || equipment.calibrationMethod === 'not_applicable') {
      return null;
    }

    const nextCalibrationDate = equipment.nextCalibrationDate
      ? new Date(equipment.nextCalibrationDate)
      : null;

    if (!nextCalibrationDate) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    nextCalibrationDate.setHours(0, 0, 0, 0);

    const diffTime = nextCalibrationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      // 교정 기한 초과
      return {
        type: 'overdue' as const,
        days: Math.abs(diffDays),
        label: `D+${Math.abs(diffDays)}`,
        fullLabel: `교정 기한 ${Math.abs(diffDays)}일 초과`,
        className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
        icon: AlertCircle,
      };
    } else if (diffDays <= 30) {
      // 30일 이내 교정 만료
      const isUrgent = diffDays <= 7;
      return {
        type: 'upcoming' as const,
        days: diffDays,
        label: diffDays === 0 ? 'D-Day' : `D-${diffDays}`,
        fullLabel: diffDays === 0 ? '오늘 교정 만료' : `${diffDays}일 후 교정 만료`,
        className: isUrgent
          ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
        icon: isUrgent ? AlertTriangle : Calendar,
      };
    }

    // 30일 초과 - 정상
    return null;
  }, [equipment.status, equipment.calibrationRequired, equipment.calibrationMethod, equipment.nextCalibrationDate]);

  return (
    <Card
      className={`border-l-4 ${style.borderColor} hover:shadow-md transition-shadow`}
      role="article"
      aria-labelledby={`equipment-${equipment.id}-name`}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle
              id={`equipment-${equipment.id}-name`}
              className="text-base font-semibold truncate flex items-center gap-2"
            >
              <HighlightText text={equipment.name || '이름 없음'} search={searchTerm} />
              {equipment.isShared && (
                <SharedEquipmentBadge sharedSource={equipment.sharedSource} size="sm" />
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              <HighlightText
                text={equipment.managementNumber || '-'}
                search={searchTerm}
              />
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant="outline" className={`${style.className} border-0`}>
              {style.label}
            </Badge>
            {calibrationStatus && (
              <Badge
                variant="outline"
                className={cn(
                  'border-0 text-xs inline-flex items-center gap-1',
                  calibrationStatus.className
                )}
                title={calibrationStatus.fullLabel}
              >
                <calibrationStatus.icon className="h-3 w-3" aria-hidden="true" />
                {calibrationStatus.label}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <dl className="space-y-1.5 text-sm">
          {equipment.modelName && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <dt className="sr-only">모델명</dt>
              <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <dd className="truncate">
                <HighlightText text={equipment.modelName} search={searchTerm} />
              </dd>
            </div>
          )}

          {equipment.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <dt className="sr-only">위치</dt>
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <dd className="truncate">{equipment.location}</dd>
            </div>
          )}

          {equipment.lastCalibrationDate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <dt className="sr-only">마지막 교정일</dt>
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <dd>교정: {formatDate(equipment.lastCalibrationDate)}</dd>
            </div>
          )}

          {equipment.calibrationMethod && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <dt className="sr-only">교정 방법</dt>
              <Wrench className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <dd>
                {equipment.calibrationMethod === 'external_calibration'
                  ? '외부 교정'
                  : equipment.calibrationMethod === 'self_inspection'
                    ? '자체 점검'
                    : '비대상'}
              </dd>
            </div>
          )}
        </dl>
      </CardContent>

      <CardFooter className="pt-2">
        <Button variant="outline" size="sm" className="w-full group" asChild>
          <Link
            href={`/equipment/${equipment.id}`}
            aria-label={`${equipment.name} 상세 보기`}
          >
            상세 보기
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
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
}: EquipmentCardGridProps) {
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        data-testid="equipment-card-grid"
        aria-busy="true"
        aria-live="polite"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12"
        data-testid="equipment-card-grid"
      >
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">표시할 장비가 없습니다</p>
        <p className="text-muted-foreground text-sm mt-1">
          다른 필터를 적용해보세요
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      data-testid="equipment-card-grid"
      role="feed"
      aria-label="장비 목록"
      aria-busy={isLoading}
    >
      {items.map((equipment) => (
        <EquipmentCard
          key={equipment.id || equipment.uuid}
          equipment={equipment}
          searchTerm={searchTerm}
        />
      ))}
    </div>
  );
}

export const EquipmentCardGrid = memo(EquipmentCardGridComponent);
export default EquipmentCardGrid;
