'use client';

import { memo } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import {
  Calendar,
  MapPin,
  Tag,
  Package,
  ArrowRight,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Equipment } from '@/lib/api/equipment-api';
import { SharedEquipmentBadge } from './SharedEquipmentBadge';

/**
 * 장비 상태별 스타일 매핑
 */
const STATUS_STYLES: Record<string, { className: string; label: string; borderColor: string }> = {
  available: {
    className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
    label: '사용 가능',
    borderColor: 'border-l-green-500',
  },
  in_use: {
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    label: '사용 중',
    borderColor: 'border-l-blue-500',
  },
  checked_out: {
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
    label: '반출 중',
    borderColor: 'border-l-orange-500',
  },
  calibration_scheduled: {
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
    label: '교정 예정',
    borderColor: 'border-l-purple-500',
  },
  calibration_overdue: {
    className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    label: '교정 기한 초과',
    borderColor: 'border-l-red-500',
  },
  non_conforming: {
    className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    label: '부적합',
    borderColor: 'border-l-red-600',
  },
  spare: {
    className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    label: '여분',
    borderColor: 'border-l-slate-500',
  },
  retired: {
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    label: '폐기',
    borderColor: 'border-l-gray-500',
  },
  // 레거시 상태값 지원
  AVAILABLE: {
    className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
    label: '사용 가능',
    borderColor: 'border-l-green-500',
  },
  IN_USE: {
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    label: '사용 중',
    borderColor: 'border-l-blue-500',
  },
  MAINTENANCE: {
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
    label: '유지보수 중',
    borderColor: 'border-l-yellow-500',
  },
  CALIBRATION: {
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
    label: '교정 중',
    borderColor: 'border-l-purple-500',
  },
  DISPOSAL: {
    className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    label: '폐기',
    borderColor: 'border-l-red-500',
  },
};

interface EquipmentCardGridProps {
  items: Equipment[];
  isLoading: boolean;
  searchTerm?: string;
}

/**
 * 검색어 하이라이팅 컴포넌트
 */
const HighlightText = memo(function HighlightText({
  text,
  search,
}: {
  text: string;
  search?: string;
}) {
  if (!search || !text) return <>{text}</>;

  const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
});

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
  const status = equipment.status || 'available';
  const style = STATUS_STYLES[status] || {
    className: 'bg-gray-100 text-gray-800',
    label: status,
    borderColor: 'border-l-gray-500',
  };

  const formatDate = (date?: string | Date | null) => {
    if (!date) return '-';
    return dayjs(date).format('YYYY-MM-DD');
  };

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
          <Badge variant="outline" className={`${style.className} border-0 shrink-0`}>
            {style.label}
          </Badge>
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
