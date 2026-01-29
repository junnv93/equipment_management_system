'use client';

import { memo, useCallback, useMemo } from 'react';
import { List, type RowComponentProps } from 'react-window';
import { useInfiniteLoader } from 'react-window-infinite-loader';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import dayjs from 'dayjs';
import { Equipment } from '@/lib/api/equipment-api';
import { Skeleton } from '@/components/ui/skeleton';
import { getEquipmentStatusStyle } from '@/lib/constants/equipment-status-styles';

// 아이템 높이 및 기타 상수 정의
const ITEM_HEIGHT = 64; // 각 행의, 높이
const ITEM_BUFFER = 5; // 얼마나 많은 행을 미리 로드할지

interface VirtualizedEquipmentListProps {
  items: Equipment[];
  isLoading: boolean;
  hasNextPage: boolean;
  loadNextPage: () => void;
  onItemClick?: (item: Equipment) => void;
}

// 각 장비 행을 표시하는 메모이제이션된 컴포넌트
const EquipmentRow = memo(
  ({ equipment, onClick }: { equipment: Equipment; onClick?: (item: Equipment) => void }) => {
    // 상태에 따른 뱃지 스타일 (SSOT: equipment-status-styles.ts)
    const getStatusBadge = (status: string) => {
      const style = getEquipmentStatusStyle(status);
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${style.className}`}
        >
          {style.label}
        </span>
      );
    };

    // 날짜 포맷 함수
    const formatDate = (dateString?: string) => {
      if (!dateString) return '-';
      try {
        return dayjs(dateString).format('YYYY-MM-DD');
      } catch {
        return dateString;
      }
    };

    const _handleClick = useCallback(() => {
      if (onClick) onClick(equipment);
    }, [equipment, onClick]);

    return (
      <TableRow className="dark:border-gray-700 h-16">
        <TableCell className="font-medium">{equipment.managementNumber}</TableCell>
        <TableCell className="max-w-[150px] sm:max-w-none truncate">{equipment.name}</TableCell>
        <TableCell className="hidden sm:table-cell">{equipment.modelName || '-'}</TableCell>
        <TableCell>{getStatusBadge(equipment.status || 'available')}</TableCell>
        <TableCell className="hidden md:table-cell">
          {formatDate(equipment.lastCalibrationDate ? String(equipment.lastCalibrationDate) : undefined)}
        </TableCell>
        <TableCell className="hidden md:table-cell">{equipment.location}</TableCell>
        <TableCell className="text-right">
          <Link href={`/equipment/${equipment.id}`}>
            <Button variant="outline" size="sm">
              상세
            </Button>
          </Link>
        </TableCell>
      </TableRow>
    );
  }
);
EquipmentRow.displayName = 'EquipmentRow';

// 스켈레톤 로딩 컴포넌트
const SkeletonRow = memo(() => (
  <TableRow className="dark:border-gray-700 h-16">
    <TableCell>
      <Skeleton className="h-4 w-16" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-32" />
    </TableCell>
    <TableCell className="hidden sm:table-cell">
      <Skeleton className="h-4 w-20" />
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
      <Skeleton className="h-8 w-16 rounded-md ml-auto" />
    </TableCell>
  </TableRow>
));
SkeletonRow.displayName = 'SkeletonRow';

// 행 Props 타입
interface RowProps {
  items: Equipment[];
  isRowLoaded: (index: number) => boolean;
  onItemClick?: (item: Equipment) => void;
}

// 행 렌더링 컴포넌트 (v2 API)
function RowComponent({ index, style, items, isRowLoaded, onItemClick }: RowComponentProps<RowProps>) {
  if (!isRowLoaded(index)) {
    return (
      <div style={style} className="w-full">
        <SkeletonRow />
      </div>
    );
  }

  const equipment = items[index];
  return (
    <div style={style} className="w-full">
      <EquipmentRow equipment={equipment} onClick={onItemClick} />
    </div>
  );
}

// 메인 컴포넌트
const VirtualizedEquipmentList = ({
  items,
  isLoading,
  hasNextPage,
  loadNextPage,
  onItemClick,
}: VirtualizedEquipmentListProps) => {
  // 무한 스크롤 설정
  const rowCount = useMemo(() => {
    return hasNextPage ? items.length + 1 : items.length;
  }, [hasNextPage, items.length]);

  // 행 로드 상태 확인 (v2 API: isRowLoaded)
  const isRowLoaded = useCallback(
    (index: number) => {
      return !hasNextPage || index < items.length;
    },
    [hasNextPage, items.length]
  );

  // 행 로드 함수 (v2 API: loadMoreRows)
  const loadMoreRows = useCallback(
    async (_startIndex: number, _stopIndex: number): Promise<void> => {
      if (!isLoading) {
        loadNextPage();
      }
    },
    [isLoading, loadNextPage]
  );

  // useInfiniteLoader 훅 사용 (v2 API)
  const onRowsRendered = useInfiniteLoader({
    isRowLoaded,
    loadMoreRows,
    rowCount,
    threshold: ITEM_BUFFER,
  });

  // rowProps for v2 API
  const rowProps: RowProps = useMemo(() => ({
    items,
    isRowLoaded,
    onItemClick,
  }), [items, isRowLoaded, onItemClick]);

  return (
    <div className="border rounded-lg overflow-hidden dark:border-gray-700 h-[600px]">
      <Table>
        <TableHeader>
          <TableRow className="dark:border-gray-700">
            <TableHead className="w-[100px] md:w-auto">관리번호</TableHead>
            <TableHead>장비명</TableHead>
            <TableHead className="hidden sm:table-cell">분류</TableHead>
            <TableHead>상태</TableHead>
            <TableHead className="hidden md:table-cell">마지막 교정일</TableHead>
            <TableHead className="hidden md:table-cell">위치</TableHead>
            <TableHead className="text-right">상세</TableHead>
          </TableRow>
        </TableHeader>
      </Table>

      <div className="h-[calc(600px-48px)]">
        {/* 테이블 헤더 높이(48px) 제외 */}
        <List
          style={{ height: '100%', width: '100%' }}
          rowComponent={RowComponent}
          rowCount={rowCount}
          rowHeight={ITEM_HEIGHT}
          rowProps={rowProps}
          onRowsRendered={onRowsRendered}
        />
      </div>

      {isLoading && items.length === 0 && (
        <div className="p-4 text-center">데이터를 로딩 중입니다...</div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="p-4 text-center">검색 결과가 없습니다</div>
      )}
    </div>
  );
};

export default memo(VirtualizedEquipmentList);
