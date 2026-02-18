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
import { getEquipmentStatusStyle } from '@/lib/constants/equipment-status-styles';
import { CALIBRATION_BADGE_TOKENS, EQUIPMENT_TABLE_TOKENS } from '@/lib/design-tokens';
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
  key: SortableColumn | 'modelName' | 'location' | 'actions';
  label: string;
  sortable: boolean;
  className?: string;
  hideOnMobile?: boolean;
}

const COLUMNS: ColumnDef[] = [
  { key: 'managementNumber', label: 'table.managementNumber', sortable: true },
  { key: 'name', label: 'table.name', sortable: true },
  { key: 'modelName', label: 'table.modelName', sortable: false, hideOnMobile: true },
  { key: 'status', label: 'table.status', sortable: true },
  { key: 'nextCalibrationDate', label: 'table.calibrationDue', sortable: true, hideOnMobile: true },
  { key: 'location', label: 'table.location', sortable: false, hideOnMobile: true },
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
 * 상태 뱃지 컴포넌트 (테이블형 - 상태만 표시)
 *
 * @param status - 장비 상태
 * @param nextCalibrationDate - 차기 교정일 (실시간 교정기한 초과 체크용)
 */
const StatusBadge = memo(function StatusBadge({
  status,
  nextCalibrationDate,
}: {
  status: string;
  nextCalibrationDate?: string | Date | null;
}) {
  const style = getEquipmentStatusStyle(status, nextCalibrationDate);

  return (
    <Badge variant="outline" className={`${style.className} border-0`}>
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
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-16 rounded-full" />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Skeleton className="h-4 w-20" />
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
  // SSOT: calculateCalibrationStatus로 교정 상태 계산 통합
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

  /**
   * 교정 기한 표시 (D-day 형식) - 테이블형 전용
   * calculateCalibrationStatus SSOT로 통합된 결과를 렌더링
   */
  const renderCalibrationDue = () => {
    if (!equipment.nextCalibrationDate) return '-';

    const dueDate = toDate(equipment.nextCalibrationDate);
    if (!dueDate) return '-';

    if (!calStatus) {
      // 정상 또는 비표시 상태
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
      className={`${EQUIPMENT_TABLE_TOKENS.rowHover} focus-within:bg-accent/50`}
      role="row"
      aria-selected={false}
      data-testid="equipment-row"
    >
      <TableCell role="gridcell" className="font-medium">
        <HighlightText text={equipment.managementNumber || '-'} search={searchTerm} />
      </TableCell>
      <TableCell role="gridcell">
        <div className="flex items-center gap-2">
          <span className="truncate max-w-[200px]">
            <HighlightText text={equipment.name || '-'} search={searchTerm} />
          </span>
          {equipment.isShared && <SharedEquipmentBadge sharedSource={equipment.sharedSource} />}
        </div>
      </TableCell>
      <TableCell role="gridcell" className="hidden sm:table-cell">
        <HighlightText text={equipment.modelName || '-'} search={searchTerm} />
      </TableCell>
      <TableCell role="gridcell">
        <StatusBadge
          status={equipment.status || 'available'}
          nextCalibrationDate={equipment.nextCalibrationDate}
        />
      </TableCell>
      <TableCell role="gridcell" className="hidden md:table-cell">
        {renderCalibrationDue()}
      </TableCell>
      <TableCell role="gridcell" className="hidden md:table-cell">
        {equipment.location || '-'}
      </TableCell>
      <TableCell role="gridcell" className="text-right">
        <Button variant="outline" size="sm" asChild data-testid="equipment-item">
          <Link
            href={`/equipment/${equipment.id}`}
            aria-label={t('card.viewDetailAriaLabel', { name: equipment.name || '' })}
          >
            <Eye className="h-4 w-4 mr-1" />
            {t('detail.viewDetailShort')}
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
 * - 상태별 뱃지
 * - 검색어 하이라이팅
 * - 스켈레톤 로딩
 * - ARIA 속성
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
  const _getSortDirection = (column: string): 'ascending' | 'descending' | 'none' => {
    if (sortBy === column) {
      return sortOrder === 'asc' ? 'ascending' : 'descending';
    }
    return 'none';
  };

  return (
    <div className="border rounded-lg overflow-hidden border-border">
      <Table role="grid" aria-label={t('table.ariaLabel')}>
        <TableHeader>
          <TableRow role="row" className="bg-muted/50">
            {COLUMNS.map((col) => {
              if (col.sortable) {
                return (
                  <SortableHeader
                    key={col.key}
                    column={col.key as SortableColumn}
                    label={t(col.label)}
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
                  className={`${col.className || ''} ${col.hideOnMobile ? 'hidden md:table-cell' : col.key === 'modelName' ? 'hidden sm:table-cell' : ''}`}
                >
                  {t(col.label)}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // 스켈레톤 로딩
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          ) : items.length === 0 ? (
            // 빈 상태
            <TableRow>
              <TableCell colSpan={COLUMNS.length} className="h-24 text-center">
                <p className="text-muted-foreground">{t('list.noItems')}</p>
              </TableCell>
            </TableRow>
          ) : (
            // 데이터 행
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
