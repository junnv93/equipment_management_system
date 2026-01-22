'use client';

import { memo } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ViewType } from '@/hooks/useEquipmentFilters';

interface ViewToggleProps {
  view: ViewType;
  onChange: (view: ViewType) => void;
  className?: string;
}

/**
 * 뷰 전환 토글 컴포넌트
 *
 * - 테이블 뷰 / 카드 뷰 전환
 * - 현재 뷰 상태 표시
 * - 툴팁 지원
 */
function ViewToggleComponent({ view, onChange, className = '' }: ViewToggleProps) {
  return (
    <TooltipProvider>
      <div
        className={`inline-flex items-center rounded-lg border bg-background p-1 ${className}`}
        role="radiogroup"
        aria-label="보기 방식 선택"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={view === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => onChange('table')}
              type="button"
              role="radio"
              aria-checked={view === 'table'}
              aria-label="테이블 뷰"
            >
              <List className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-2">테이블</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>테이블 뷰로 보기</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={view === 'card' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => onChange('card')}
              type="button"
              role="radio"
              aria-checked={view === 'card'}
              aria-label="카드 뷰"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-2">카드</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>카드 뷰로 보기</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export const ViewToggle = memo(ViewToggleComponent);
export default ViewToggle;
