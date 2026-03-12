'use client';

/**
 * ResponsiveTable (Client Component)
 *
 * 반응형 테이블 컴포넌트
 * - 데스크톱: 일반 테이블 뷰
 * - 모바일: 카드 뷰 또는 수평 스크롤
 *
 * 접근성 (WCAG 2.1 AA):
 * - 키보드 네비게이션 지원
 * - 적절한 ARIA 속성
 * - prefers-reduced-motion 존중
 *
 * 성능 최적화 (vercel-react-best-practices):
 * - React.memo로 불필요한 리렌더 방지
 * - useCallback으로 이벤트 핸들러 안정화
 */
import { ReactNode, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { TRANSITION_PRESETS } from '@/lib/design-tokens';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  className?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  mobileCardRender?: (item: T) => ReactNode;
  stickyHeader?: boolean;
  className?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = '데이터가 없습니다.',
  onRowClick,
  mobileCardRender,
  stickyHeader = false,
  className,
}: ResponsiveTableProps<T>) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // getCellValue를 useCallback으로 최적화 (rerender-functional-setstate)
  const getCellValue = useCallback((item: T, column: Column<T>): ReactNode => {
    if (column.render) {
      return column.render(item);
    }
    const value = item[column.key as keyof T];
    return value as ReactNode;
  }, []);

  // 키보드 이벤트 핸들러 (rerender-functional-setstate)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, item: T) => {
      if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onRowClick(item);
      }
    },
    [onRowClick]
  );

  // 모바일에서 카드 뷰로 표시
  if (isMobile && mobileCardRender) {
    return (
      <div className={cn('space-y-3', className)} data-testid="responsive-table-mobile">
        {data.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {emptyMessage}
            </CardContent>
          </Card>
        ) : (
          data.map((item) => (
            <Card
              key={keyExtractor(item)}
              className={cn(
                // prefers-reduced-motion 지원
                TRANSITION_PRESETS.fastShadow,
                onRowClick && 'cursor-pointer hover:shadow-md',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              )}
              onClick={() => onRowClick?.(item)}
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={(e) => handleKeyDown(e, item)}
            >
              <CardContent className="p-4">{mobileCardRender(item)}</CardContent>
            </Card>
          ))
        )}
      </div>
    );
  }

  // 테이블 뷰 (스크롤 가능)
  return (
    <div
      className={cn('relative overflow-x-auto rounded-lg border', className)}
      data-testid="responsive-table"
    >
      <Table>
        <TableHeader className={cn(stickyHeader && 'sticky top-0 bg-background z-10')}>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={String(column.key)}
                className={cn(
                  column.className,
                  column.hideOnMobile && 'hidden sm:table-cell',
                  column.hideOnTablet && 'hidden md:table-cell'
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow
                key={keyExtractor(item)}
                className={cn(
                  // prefers-reduced-motion 지원
                  TRANSITION_PRESETS.fastColor,
                  onRowClick && 'cursor-pointer hover:bg-muted/50',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                )}
                onClick={() => onRowClick?.(item)}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => handleKeyDown(e, item)}
              >
                {columns.map((column) => (
                  <TableCell
                    key={String(column.key)}
                    className={cn(
                      column.className,
                      column.hideOnMobile && 'hidden sm:table-cell',
                      column.hideOnTablet && 'hidden md:table-cell'
                    )}
                  >
                    {getCellValue(item, column)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
