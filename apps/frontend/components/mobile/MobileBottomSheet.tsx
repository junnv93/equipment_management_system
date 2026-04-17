'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface MobileBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * 시트 제목 (접근성 필수 — Radix Dialog는 aria-labelledby 자동 연결).
   * 시각적으로 숨기려면 `hideTitle`을 true로 지정(스크린 리더에만 노출).
   */
  title: string;
  hideTitle?: boolean;
  description?: string;
  hideDescription?: boolean;
  /**
   * drag handle(작은 수평 바)을 상단에 노출 — 모바일에서 시각적 "끌어내리기" 어포던스.
   */
  showHandle?: boolean;
  /**
   * 시트 최대 높이 (vh 단위). 기본 85vh — 상단 safe-area/콘텐츠 공간 확보.
   */
  maxHeight?: string;
  children: React.ReactNode;
  contentClassName?: string;
}

/**
 * 모바일 하단 시트 — Radix Sheet(bottom variant) 얇은 래퍼.
 *
 * `components/ui/sheet.tsx`를 재사용하며 모바일 특화 기본값만 주입:
 * - iOS safe-area-inset-bottom 하단 패딩 (`.safe-area-bottom`)
 * - drag handle (어포던스)
 * - max-height 제한 (화면 밖으로 밀리지 않음)
 * - `role="dialog"` + focus trap은 Radix Dialog가 자동 처리
 *
 * Radix 재구현 금지 — 이 파일은 조립만.
 */
export function MobileBottomSheet({
  open,
  onOpenChange,
  title,
  hideTitle,
  description,
  hideDescription,
  showHandle = true,
  maxHeight = '85vh',
  children,
  contentClassName,
}: MobileBottomSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn('flex flex-col rounded-t-xl p-0 safe-area-bottom', contentClassName)}
        style={{ maxHeight }}
        hideClose
      >
        {showHandle && (
          <div className="flex justify-center pt-2 pb-1" aria-hidden="true">
            <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          </div>
        )}

        <SheetHeader className={cn('px-4 pb-2', hideTitle && 'sr-only')}>
          <SheetTitle>{title}</SheetTitle>
          {description && (
            <SheetDescription className={cn(hideDescription && 'sr-only')}>
              {description}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
