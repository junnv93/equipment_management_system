'use client';

import { ReactNode, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
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

  const getCellValue = (item: T, column: Column<T>): ReactNode => {
    if (column.render) {
      return column.render(item);
    }
    const value = item[column.key as keyof T];
    return value as ReactNode;
  };

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
                'transition-shadow',
                onRowClick && 'cursor-pointer hover:shadow-md'
              )}
              onClick={() => onRowClick?.(item)}
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onRowClick(item);
                }
              }}
            >
              <CardContent className="p-4">
                {mobileCardRender(item)}
              </CardContent>
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
        <TableHeader className={stickyHeader ? 'sticky top-0 bg-white z-10' : ''}>
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
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-muted/50'
                )}
                onClick={() => onRowClick?.(item)}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onRowClick(item);
                  }
                }}
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
