'use client';

import { memo, useCallback } from 'react';
import Link from 'next/link';
import { ArrowUpDown, ArrowUp, ArrowDown, Eye } from 'lucide-react';
import { differenceInDays } from 'date-fns';
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
  getEquipmentStatusStyle,
  shouldDisplayCalibrationStatus,
} from '@/lib/constants/equipment-status-styles';

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
  { key: 'managementNumber', label: '관리번호', sortable: true },
  { key: 'name', label: '장비명', sortable: true },
  { key: 'modelName', label: '모델명', sortable: false, hideOnMobile: true },
  { key: 'status', label: '상태', sortable: true },
  { key: 'nextCalibrationDate', label: '교정 기한', sortable: true, hideOnMobile: true },
  { key: 'location', label: '위치', sortable: false, hideOnMobile: true },
  { key: 'actions', label: '상세', sortable: false, className: 'text-right' },
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
        aria-label={`${label}로 정렬${isActive ? (currentSortOrder === 'asc' ? ', 내림차순으로 변경' : ', 오름차순으로 변경') : ''}`}
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
  /**
   * 교정 기한 표시 (D-day 형식) - 테이블형 전용
   *
   * 모든 장비의 차기 교정일을 표시하되, 색상과 D-day 배지로 상태 구분:
   * - 기한 초과: 빨간색 + "D+N" 배지
   * - 7일 이내: 주황색 + "D-N" 배지 (긴급)
   * - 30일 이내: 노란색 + "D-N" 배지 (경고)
   * - 정상: 기본 날짜 표시
   *
   * 예외 상태 (교정 불필요):
   * - 폐기(retired), 여분(spare), 비활성 등: "-" 표시
   */
  const formatCalibrationDue = (date?: string | Date | null, status?: string) => {
    if (!date) return '-';

    // 교정 상태 표시가 의미 없는 장비 (폐기, 여분 등)
    // calibration_overdue는 항상 D+N 형식으로 표시해야 함
    if (!shouldDisplayCalibrationStatus(status)) {
      return <span className="text-muted-foreground">-</span>;
    }

    const dueDate = toDate(date);
    if (!dueDate) return '-';
    const today = new Date();
    const diff = differenceInDays(dueDate, today);

    if (diff < 0) {
      // 기한 초과 - 빨간색 강조
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-red-700 dark:text-red-400 font-semibold text-sm">
            {formatDate(dueDate, 'yyyy-MM-dd')}
          </span>
          <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 px-1.5 py-0.5 rounded w-fit font-semibold">
            D+{Math.abs(diff)} (초과)
          </span>
        </div>
      );
    }
    if (diff <= 7) {
      // 7일 이내 (긴급) - 주황색 강조
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-orange-700 dark:text-orange-400 font-semibold text-sm">
            {formatDate(dueDate, 'yyyy-MM-dd')}
          </span>
          <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 px-1.5 py-0.5 rounded w-fit font-medium">
            D-{diff} (긴급)
          </span>
        </div>
      );
    }
    if (diff <= 30) {
      // 30일 이내 (경고) - 노란색 강조
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-yellow-700 dark:text-yellow-400 font-medium text-sm">
            {formatDate(dueDate, 'yyyy-MM-dd')}
          </span>
          <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 px-1.5 py-0.5 rounded w-fit">
            D-{diff}
          </span>
        </div>
      );
    }
    // 정상 (30일 초과)
    return <span className="text-sm">{formatDate(dueDate, 'yyyy-MM-dd')}</span>;
  };

  return (
    <TableRow
      className="hover:bg-muted/50 motion-safe:transition-colors motion-reduce:transition-none"
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
        {formatCalibrationDue(equipment.nextCalibrationDate, equipment.status)}
      </TableCell>
      <TableCell role="gridcell" className="hidden md:table-cell">
        {equipment.location || '-'}
      </TableCell>
      <TableCell role="gridcell" className="text-right">
        <Button variant="outline" size="sm" asChild data-testid="equipment-item">
          <Link href={`/equipment/${equipment.id}`} aria-label={`${equipment.name} 상세 보기`}>
            <Eye className="h-4 w-4 mr-1" />
            상세
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
  const _getSortDirection = (column: string): 'ascending' | 'descending' | 'none' => {
    if (sortBy === column) {
      return sortOrder === 'asc' ? 'ascending' : 'descending';
    }
    return 'none';
  };

  return (
    <div className="border rounded-lg overflow-hidden border-border">
      <Table role="grid" aria-label="장비 목록">
        <TableHeader>
          <TableRow role="row" className="bg-muted/50">
            {COLUMNS.map((col) => {
              if (col.sortable) {
                return (
                  <SortableHeader
                    key={col.key}
                    column={col.key as SortableColumn}
                    label={col.label}
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
                  {col.label}
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
                <p className="text-muted-foreground">표시할 장비가 없습니다</p>
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
