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

/**
 * 장비 상태별 스타일 매핑
 */
const STATUS_STYLES: Record<string, { className: string; label: string }> = {
  available: {
    className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
    label: '사용 가능',
  },
  in_use: {
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    label: '사용 중',
  },
  checked_out: {
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
    label: '반출 중',
  },
  calibration_scheduled: {
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
    label: '교정 예정',
  },
  calibration_overdue: {
    className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    label: '교정 기한 초과',
  },
  non_conforming: {
    className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    label: '부적합',
  },
  spare: {
    className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    label: '여분',
  },
  retired: {
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    label: '폐기',
  },
  // 레거시 상태값 지원
  AVAILABLE: {
    className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
    label: '사용 가능',
  },
  IN_USE: {
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    label: '사용 중',
  },
  MAINTENANCE: {
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
    label: '유지보수 중',
  },
  CALIBRATION: {
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
    label: '교정 중',
  },
  DISPOSAL: {
    className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    label: '폐기',
  },
};

/**
 * 테이블 열 정의
 */
type SortableColumn = 'managementNumber' | 'name' | 'status' | 'lastCalibrationDate' | 'createdAt';

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
  { key: 'lastCalibrationDate', label: '마지막 교정일', sortable: true, hideOnMobile: true },
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
  const style = STATUS_STYLES[status] || {
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    label: status,
  };

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
        {formatDate(equipment.lastCalibrationDate)}
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
