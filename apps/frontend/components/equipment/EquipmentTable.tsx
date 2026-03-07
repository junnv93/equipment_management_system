'use client';

import { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ArrowUpDown, ArrowUp, ArrowDown, Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toDate, formatDate } from '@/lib/utils/date';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Equipment } from '@/lib/api/equipment-api';
import type { EquipmentFilters } from '@/hooks/useEquipmentFilters';
import { SharedEquipmentBadge } from './SharedEquipmentBadge';
import { HighlightText } from '@/components/shared/HighlightText';
import {
  CALIBRATION_BADGE_TOKENS,
  EQUIPMENT_TABLE_TOKENS,
  EQUIPMENT_STATUS_TOKENS,
  DEFAULT_STATUS_CONFIG,
  getManagementNumberClasses,
  getEquipmentStatusTokenStyle,
} from '@/lib/design-tokens';
import { calculateCalibrationStatus } from '@/lib/utils/calibration-status';
import type { CalibrationMethod } from '@equipment-management/schemas';

/**
 * 테이블 열 정의
 */
type SortableColumn =
  | 'managementNumber'
  | 'name'
  | 'status'
  | 'lastCalibrationDate'
  | 'nextCalibrationDate'
  | 'createdAt';

interface ColumnDef {
  key: SortableColumn | 'statusBar' | 'location' | 'actions';
  label: string;
  sortable: boolean;
  className?: string;
  hideOnMobile?: boolean;
}

const COLUMNS: ColumnDef[] = [
  { key: 'statusBar', label: '', sortable: false, className: 'w-1 p-0' },
  { key: 'managementNumber', label: 'table.managementNumber', sortable: true },
  { key: 'name', label: 'table.name', sortable: true },
  { key: 'location', label: 'table.location', sortable: false, hideOnMobile: true },
  { key: 'nextCalibrationDate', label: 'table.calibrationDue', sortable: true, hideOnMobile: true },
  { key: 'status', label: 'table.status', sortable: true },
  { key: 'actions', label: 'table.actions', sortable: false, className: 'text-right' },
];

interface EquipmentTableProps {
  items: Equipment[];
  isLoading: boolean;
  sortBy: EquipmentFilters['sortBy'];
  sortOrder: 'asc' | 'desc';
  onSort: (column: EquipmentFilters['sortBy'], order: 'asc' | 'desc') => void;
  searchTerm?: string;
}

/**
 * 상태 뱃지 컴포넌트 (테이블형)
 */
const StatusBadge = memo(function StatusBadge({
  status,
  nextCalibrationDate,
}: {
  status: string;
  nextCalibrationDate?: string | Date | null;
}) {
  const style = getEquipmentStatusTokenStyle(status, nextCalibrationDate);

  return (
    <Badge variant="outline" className={`${style.className} ${EQUIPMENT_TABLE_TOKENS.statusBadge}`}>
      {style.label}
    </Badge>
  );
});

/**
 * 정렬 가능한 테이블 헤더 컴포넌트
 */
const SortableHeader = memo(function SortableHeader({
  column,
  label,
  currentSortBy,
  currentSortOrder,
  onSort,
  className = '',
}: {
  column: SortableColumn;
  label: string;
  currentSortBy: string;
  currentSortOrder: 'asc' | 'desc';
  onSort: (column: EquipmentFilters['sortBy'], order: 'asc' | 'desc') => void;
  className?: string;
}) {
  const t = useTranslations('equipment');
  const isActive = currentSortBy === column;

  const handleClick = useCallback(() => {
    if (isActive) {
      onSort(column as EquipmentFilters['sortBy'], currentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(column as EquipmentFilters['sortBy'], 'asc');
    }
  }, [column, isActive, currentSortOrder, onSort]);

  return (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={handleClick}
        type="button"
        aria-label={`${t('sort.ariaLabel', { label })}${isActive ? (currentSortOrder === 'asc' ? t('sort.changeToDesc') : t('sort.changeToAsc')) : ''}`}
      >
        {label}
        {isActive ? (
          currentSortOrder === 'asc' ? (
            <ArrowUp className="ml-1 h-4 w-4" />
          ) : (
            <ArrowDown className="ml-1 h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
        )}
      </Button>
    </TableHead>
  );
});

/**
 * 스켈레톤 로딩 행
 */
const SkeletonRow = memo(function SkeletonRow() {
  return (
    <TableRow className="motion-safe:animate-pulse">
      <TableCell className="w-1 p-0">
        <div className="block w-1 min-h-[2.5rem] bg-muted" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-[4.5rem] rounded-full" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-16 ml-auto rounded-md" />
      </TableCell>
    </TableRow>
  );
});

/**
 * 장비 테이블 행 컴포넌트
 */
const EquipmentRow = memo(function EquipmentRow({
  equipment,
  searchTerm,
}: {
  equipment: Equipment;
  searchTerm?: string;
}) {
  const t = useTranslations('equipment');
  const calStatus = useMemo(
    () =>
      calculateCalibrationStatus(
        equipment.status,
        !!equipment.calibrationRequired,
        equipment.calibrationMethod as CalibrationMethod | undefined,
        equipment.nextCalibrationDate
      ),
    [
      equipment.status,
      equipment.calibrationRequired,
      equipment.calibrationMethod,
      equipment.nextCalibrationDate,
    ]
  );

  // 상태 바 색상 (design token SSOT)
  const statusToken =
    EQUIPMENT_STATUS_TOKENS[equipment.status || 'available'] || DEFAULT_STATUS_CONFIG;

  /**
   * 교정 기한 표시 (D-day 형식)
   */
  const renderCalibrationDue = () => {
    if (!equipment.nextCalibrationDate) return '-';

    const dueDate = toDate(equipment.nextCalibrationDate);
    if (!dueDate) return '-';

    if (!calStatus) {
      return (
        <span className={EQUIPMENT_TABLE_TOKENS.numericColumn}>
          {formatDate(dueDate, 'yyyy-MM-dd')}
        </span>
      );
    }

    const badgeStyle = CALIBRATION_BADGE_TOKENS[calStatus.severity].table;
    const suffixLabel =
      calStatus.type === 'overdue'
        ? t('table.overdueLabel')
        : calStatus.severity === 'urgent'
          ? t('table.urgentLabel')
          : '';

    return (
      <div className="flex flex-col gap-0.5">
        <span className={`font-semibold text-sm ${EQUIPMENT_TABLE_TOKENS.numericColumn}`}>
          {formatDate(dueDate, 'yyyy-MM-dd')}
        </span>
        <span className={`text-xs ${badgeStyle} px-1.5 py-0.5 rounded w-fit font-medium`}>
          {calStatus.label}
          {suffixLabel}
        </span>
      </div>
    );
  };

  return (
    <TableRow
      className={`${EQUIPMENT_TABLE_TOKENS.rowHover} focus-within:ring-1 focus-within:ring-inset focus-within:ring-primary/20`}
      role="row"
      aria-selected={false}
      data-testid="equipment-row"
    >
      {/* 4px 상태 세로 바 */}
      <TableCell className={EQUIPMENT_TABLE_TOKENS.statusBar.cell} aria-hidden="true">
        <div
          className={`${EQUIPMENT_TABLE_TOKENS.statusBar.indicator} ${statusToken.card.statusBarColor}`}
        />
      </TableCell>

      {/* 관리번호 */}
      <TableCell role="gridcell">
        <span className={getManagementNumberClasses()}>
          <HighlightText text={equipment.managementNumber || '-'} search={searchTerm} />
        </span>
      </TableCell>

      {/* 장비명 + 모델명 */}
      <TableCell role="gridcell">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate max-w-[200px]">
              <HighlightText text={equipment.name || '-'} search={searchTerm} />
            </span>
            {equipment.isShared && <SharedEquipmentBadge sharedSource={equipment.sharedSource} />}
          </div>
          {equipment.modelName && (
            <div className={EQUIPMENT_TABLE_TOKENS.secondaryText}>
              <HighlightText text={equipment.modelName} search={searchTerm} />
            </div>
          )}
        </div>
      </TableCell>

      {/* 위치 */}
      <TableCell role="gridcell" className="hidden md:table-cell">
        {equipment.location || '-'}
      </TableCell>

      {/* 교정 기한 */}
      <TableCell role="gridcell" className="hidden md:table-cell">
        {renderCalibrationDue()}
      </TableCell>

      {/* 상태 배지 */}
      <TableCell role="gridcell">
        <StatusBadge
          status={equipment.status || 'available'}
          nextCalibrationDate={equipment.nextCalibrationDate}
        />
      </TableCell>

      {/* 상세보기 */}
      <TableCell role="gridcell" className="text-right">
        <Button variant="outline" size="sm" asChild data-testid="equipment-item">
          <Link
            href={`/equipment/${equipment.id}`}
            aria-label={t('card.viewDetailAriaLabel', { name: equipment.name || '' })}
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">{t('detail.viewDetailShort')}</span>
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
});

/**
 * 장비 테이블 컴포넌트
 *
 * - 정렬 가능한 헤더
 * - 4px 상태 세로 바 (산업 레지스트리 미학)
 * - 관리번호: font-mono + tracking-wider
 * - 장비명 + 모델명 통합 셀
 * - 상태 배지: 고정폭 텍스트 전용
 * - 검색어 하이라이팅
 * - 스켈레톤 로딩
 */
function EquipmentTableComponent({
  items,
  isLoading,
  sortBy,
  sortOrder,
  onSort,
  searchTerm,
}: EquipmentTableProps) {
  const t = useTranslations('equipment');

  return (
    <div className="border border-brand-border-subtle bg-brand-bg-surface rounded-lg overflow-hidden">
      <Table role="grid" aria-label={t('table.ariaLabel')} className="[&_td]:py-2 [&_td]:px-3">
        <TableHeader>
          <TableRow
            role="row"
            className="bg-brand-bg-elevated/80 border-b-2 border-brand-border-default"
          >
            {COLUMNS.map((col) => {
              // 상태 바 헤더: 빈 셀
              if (col.key === 'statusBar') {
                return <TableHead key="statusBar" className="w-1 p-0" aria-hidden="true" />;
              }

              if (col.sortable) {
                return (
                  <SortableHeader
                    key={col.key}
                    column={col.key as SortableColumn}
                    label={t(col.label as Parameters<typeof t>[0])}
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={onSort}
                    className={`${col.className || ''} ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                  />
                );
              }

              return (
                <TableHead
                  key={col.key}
                  role="columnheader"
                  scope="col"
                  className={`${col.className || ''} ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                >
                  {t(col.label as Parameters<typeof t>[0])}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COLUMNS.length} className="h-24 text-center">
                <p className="text-muted-foreground">{t('list.noItems')}</p>
              </TableCell>
            </TableRow>
          ) : (
            items.map((equipment) => (
              <EquipmentRow
                key={equipment.id || equipment.uuid}
                equipment={equipment}
                searchTerm={searchTerm}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export const EquipmentTable = memo(EquipmentTableComponent);
export default EquipmentTable;
