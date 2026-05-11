'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * 반응형 리스트 fallback wrapper SSOT.
 *
 * **DESIGN_REVIEW.md P1-1 해결**: 데스크톱 N-컬럼 테이블이 모바일에서 가로 스크롤 발생.
 * `md` breakpoint 기준 desktop slot ↔ mobile slot 자동 전환.
 *
 * **breakpoint SSOT**: Tailwind `md` (768px) — `hidden md:block` / `md:hidden`.
 * 두 slot 모두 DOM에 렌더되되 CSS로 한쪽만 표시. Hydration 일관성 확보 + JS 없이 동작.
 *
 * **사용 패턴**:
 * ```tsx
 * <ResponsiveListFallback
 *   desktop={<TableComponent items={items} />}
 *   mobile={<MobileCardList items={items} />}
 * />
 * ```
 *
 * **확장성**: software 도메인에서 시작했지만 checkouts/equipment 등 다른 list 페이지에도 점진 적용 가능.
 */

export interface ResponsiveListFallbackProps {
  /** 데스크톱(`md` 이상) 슬롯 — 일반적으로 `<Table>` */
  readonly desktop: ReactNode;
  /** 모바일(`md` 미만) 슬롯 — 일반적으로 카드 리스트 */
  readonly mobile: ReactNode;
  /** 외부에서 추가 클래스 (양쪽 wrapper에 공통 적용) */
  readonly className?: string;
}

export function ResponsiveListFallback({
  desktop,
  mobile,
  className,
}: ResponsiveListFallbackProps) {
  return (
    <>
      <div className={cn('hidden md:block', className)} data-responsive-slot="desktop">
        {desktop}
      </div>
      <div className={cn('md:hidden', className)} data-responsive-slot="mobile">
        {mobile}
      </div>
    </>
  );
}
