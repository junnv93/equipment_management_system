'use client';

import { memo, useCallback } from 'react';
import Link from 'next/link';
import { ArrowUpDown, ArrowUp, ArrowDown, Eye } from 'lucide-react';
import dayjs from 'dayjs';
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
import {
  getEquipmentStatusStyle,
  shouldDisplayCalibrationStatus,
} from '@/lib/constants/equipment-status-styles';

/**
 * 테이블 열 정의
 */
type SortableColumn = 'managementNumber' | 'name' | 'status' | 'lastCalibrationDate' | 'nextCalibrationDate' | 'createdAt';

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
 * 상태 뱃지 컴포넌트
 */
const StatusBadge = memo(function StatusBadge({ status }: { status: string }) {
  const style = getEquipmentStatusStyle(status);

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
    <TableRow className="animate-pulse">
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
  const formatDate = (date?: string | Date | null) => {
    if (!date) return '-';
    return dayjs(date).format('YYYY-MM-DD');
  };

  /**
   * 교정 기한 표시 (D-day 형식)
   *
   * 폐기/부적합/여분 장비는 D-day 표시 안함:
   * - 폐기: 더 이상 사용하지 않음
   * - 부적합: 수리/보수 후 필수적으로 재교정 필요
   * - 여분: 실제 사용 전에 교정 상태 재확인 필요
   *
   * 그 외 장비:
   * - 기한 초과: 빨간색으로 "D+N"
   * - 7일 이내: 주황색으로 "D-N" (긴급)
   * - 30일 이내: 노란색으로 "D-N" (경고)
   * - 정상: 기본 날짜 표시
   */
  const formatCalibrationDue = (date?: string | Date | null, status?: string) => {
    if (!date) return '-';

    // 폐기/부적합/여분 장비는 D-day 표시 안함 (SSOT: equipment-status-styles.ts)
    if (!shouldDisplayCalibrationStatus(status)) {
      return <span className="text-muted-foreground">-</span>;
    }

    const dueDate = dayjs(date);
    const today = dayjs();
    const diff = dueDate.diff(today, 'day');

    if (diff < 0) {
      // 기한 초과
      return (
        <span className="text-red-600 dark:text-red-400 font-semibold">
          {dueDate.format('YYYY-MM-DD')}
          <span className="ml-1 text-xs bg-red-100 dark:bg-red-900/50 px-1.5 py-0.5 rounded">
            D+{Math.abs(diff)}
          </span>
        </span>
      );
    }
    if (diff <= 7) {
      // 7일 이내 (긴급)
      return (
        <span className="text-orange-600 dark:text-orange-400 font-semibold">
          {dueDate.format('YYYY-MM-DD')}
          <span className="ml-1 text-xs bg-orange-100 dark:bg-orange-900/50 px-1.5 py-0.5 rounded">
            D-{diff}
          </span>
        </span>
      );
    }
    if (diff <= 30) {
      // 30일 이내 (경고)
      return (
        <span className="text-yellow-600 dark:text-yellow-400 font-medium">
          {dueDate.format('YYYY-MM-DD')}
          <span className="ml-1 text-xs bg-yellow-100 dark:bg-yellow-900/50 px-1.5 py-0.5 rounded">
            D-{diff}
          </span>
        </span>
      );
    }
    return dueDate.format('YYYY-MM-DD');
  };

  return (
    <TableRow
      className="hover:bg-muted/50 transition-colors"
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
        <StatusBadge status={equipment.status || 'available'} />
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
  const getSortDirection = (column: string): 'ascending' | 'descending' | 'none' => {
    if (sortBy === column) {
      return sortOrder === 'asc' ? 'ascending' : 'descending';
    }
    return 'none';
  };

  return (
    <div className="border rounded-lg overflow-hidden dark:border-gray-700">
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
