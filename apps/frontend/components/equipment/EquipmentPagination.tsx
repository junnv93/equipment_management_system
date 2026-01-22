'use client';

import { memo, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EquipmentPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  className?: string;
}

/**
 * 페이지 크기 옵션
 */
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/**
 * 장비 목록 페이지네이션 컴포넌트
 *
 * - 페이지 번호 및 이전/다음 버튼
 * - 페이지당 항목 수 선택
 * - 총 개수 표시
 * - ARIA 속성
 */
function EquipmentPaginationComponent({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  className = '',
}: EquipmentPaginationProps) {
  // 표시할 페이지 번호 계산
  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages + 2) {
      // 전체 페이지가 적으면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 첫 페이지
      pages.push(1);

      // 시작 위치 계산
      let startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

      // 시작 위치 조정
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(2, endPage - maxVisiblePages + 1);
      }

      // 첫 페이지 다음 ellipsis
      if (startPage > 2) {
        pages.push('ellipsis');
      }

      // 중간 페이지들
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // 마지막 페이지 이전 ellipsis
      if (endPage < totalPages - 1) {
        pages.push('ellipsis');
      }

      // 마지막 페이지
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  // 현재 표시 범위 계산
  const displayRange = useMemo(() => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);
    return { start, end };
  }, [currentPage, pageSize, totalItems]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange]);

  const handleFirstPage = useCallback(() => {
    onPageChange(1);
  }, [onPageChange]);

  const handleLastPage = useCallback(() => {
    onPageChange(totalPages);
  }, [totalPages, onPageChange]);

  const handlePageSizeChange = useCallback(
    (value: string) => {
      onPageSizeChange(Number(value));
    },
    [onPageSizeChange]
  );

  if (totalItems === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
      role="navigation"
      aria-label="페이지 탐색"
    >
      {/* 왼쪽: 표시 정보 및 페이지 크기 선택 */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          총 <span className="font-medium text-foreground">{totalItems.toLocaleString()}</span>개 중{' '}
          <span className="font-medium text-foreground">{displayRange.start}</span>-
          <span className="font-medium text-foreground">{displayRange.end}</span>
        </span>

        <div className="flex items-center gap-2">
          <span>페이지당</span>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-[70px] h-8" aria-label="페이지당 항목 수 선택">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>개</span>
        </div>
      </div>

      {/* 오른쪽: 페이지 버튼 */}
      <div className="flex items-center gap-1">
        {/* 첫 페이지로 */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleFirstPage}
          disabled={currentPage === 1}
          type="button"
          aria-label="첫 페이지로"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* 이전 페이지 */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          type="button"
          aria-label="이전 페이지"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* 페이지 번호들 */}
        <div className="flex items-center gap-1" role="group" aria-label="페이지 번호">
          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-muted-foreground"
                  aria-hidden="true"
                >
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;

            return (
              <Button
                key={page}
                variant={isActive ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(page)}
                type="button"
                aria-label={`${page} 페이지로 이동`}
                aria-current={isActive ? 'page' : undefined}
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* 다음 페이지 */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          type="button"
          aria-label="다음 페이지"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* 마지막 페이지로 */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleLastPage}
          disabled={currentPage === totalPages}
          type="button"
          aria-label="마지막 페이지로"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export const EquipmentPagination = memo(EquipmentPaginationComponent);
export default EquipmentPagination;
