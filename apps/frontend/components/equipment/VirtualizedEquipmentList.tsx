'use client';

import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import dayjs from 'dayjs';
import { Equipment } from '@/lib/api/equipment-api';
import { Skeleton } from '@/components/ui/skeleton';
import AutoSizer from 'react-virtualized-auto-sizer';

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
    // 상태에 따른 뱃지 스타일 정의
    const getStatusBadge = (status: string) => {
      const statusConfig: Record<string, { class: string; darkClass: string; label: string }> = {
        AVAILABLE: {
          class: 'bg-green-100 text-green-800',
          darkClass: 'dark:bg-green-950 dark:text-green-300',
          label: '사용 가능',
        },
        IN_USE: {
          class: 'bg-blue-100 text-blue-800',
          darkClass: 'dark:bg-blue-950 dark:text-blue-300',
          label: '사용 중',
        },
        MAINTENANCE: {
          class: 'bg-yellow-100 text-yellow-800',
          darkClass: 'dark:bg-yellow-950 dark:text-yellow-300',
          label: '유지보수 중',
        },
        CALIBRATION: {
          class: 'bg-purple-100 text-purple-800',
          darkClass: 'dark:bg-purple-950 dark:text-purple-300',
          label: '교정 중',
        },
        DISPOSAL: {
          class: 'bg-red-100 text-red-800',
          darkClass: 'dark:bg-red-950 dark:text-red-300',
          label: '폐기',
        },
      };

      const config = statusConfig[status] || {
        class: 'bg-gray-100 text-gray-800',
        darkClass: 'dark:bg-gray-800 dark:text-gray-300',
        label: '알 수 없음',
      };

      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${config.class} ${config.darkClass}`}
        >
          {config.label}
        </span>
      );
    };

    // 날짜 포맷 함수
    const formatDate = (dateString?: string) => {
      if (!dateString) return '-';
      try {
        return dayjs(dateString).format('YYYY-MM-DD');
      } catch (error) {
        return dateString;
      }
    };

    const handleClick = useCallback(() => {
      if (onClick) onClick(equipment);
    }, [equipment, onClick]);

    return (
      <TableRow className="dark:border-gray-700 h-16">
        <TableCell className="font-medium">{equipment.managementNumber}</TableCell>
        <TableCell className="max-w-[150px] sm:max-w-none truncate">{equipment.name}</TableCell>
        <TableCell className="hidden sm:table-cell">{equipment.category}</TableCell>
        <TableCell>{getStatusBadge(equipment.status)}</TableCell>
        <TableCell className="hidden md:table-cell">
          {formatDate(equipment.lastCalibrationDate)}
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

// 메인 컴포넌트
const VirtualizedEquipmentList = ({
  items,
  isLoading,
  hasNextPage,
  loadNextPage,
  onItemClick,
}: VirtualizedEquipmentListProps) => {
  const infiniteLoaderRef = useRef<any>(null);

  // 무한 스크롤 설정
  const itemCount = useMemo(() => {
    return hasNextPage ? items.length + 1 : items.length;
  }, [hasNextPage, items.length]);

  // 아이템 로드 상태 확인
  const isItemLoaded = useCallback(
    (index: number) => {
      return !hasNextPage || index < items.length;
    },
    [hasNextPage, items.length]
  );

  // 아이템 로드 함수
  const loadMoreItems = useCallback(() => {
    if (!isLoading) {
      return loadNextPage();
    }
    return Promise.resolve();
  }, [isLoading, loadNextPage]);

  // 행 렌더링 함수
  const rowRenderer = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      if (!isItemLoaded(index)) {
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
    },
    [items, isItemLoaded, onItemClick]
  );

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
        {' '}
        {/* 테이블 헤더 높이(48px) 제외 */}
        <AutoSizer>
          {({ height, width }: { height: number; width: number }) => (
            <InfiniteLoader
              ref={infiniteLoaderRef}
              isItemLoaded={isItemLoaded}
              itemCount={itemCount}
              loadMoreItems={loadMoreItems}
              threshold={ITEM_BUFFER}
            >
              {({ onItemsRendered, ref }) => (
                <List
                  ref={ref}
                  height={height}
                  width={width}
                  itemCount={itemCount}
                  itemSize={ITEM_HEIGHT}
                  onItemsRendered={onItemsRendered}
                >
                  {rowRenderer}
                </List>
              )}
            </InfiniteLoader>
          )}
        </AutoSizer>
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
