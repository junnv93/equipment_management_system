'use client';

import { CHECKOUT_LOADING_SKELETON_TOKENS } from '@/lib/design-tokens';

interface HeroKPISkeletonProps {
  /**
   * overdue > 0 일 때 hero 카드(col-span-2)가 있는 6칸 그리드 표시.
   * false(기본): overdue = 0 상태와 동일한 5칸 균등 그리드.
   * OutboundCheckoutsTab에서 summary.overdue를 기반으로 전달.
   */
  hasHero?: boolean;
}

/**
 * HeroKPI stats 영역 로딩 스켈레톤.
 * OutboundCheckoutsTab의 renderStats() 그리드 구조를 정확히 미러링.
 *
 * hasHero=true : grid-cols-4 sm:grid-cols-6  — hero col-span-2 + secondary 4
 * hasHero=false: grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 — secondary 5 (균등)
 */
export function HeroKPISkeleton({ hasHero = false }: HeroKPISkeletonProps) {
  if (hasHero) {
    return (
      <div className="grid gap-3 grid-cols-4 sm:grid-cols-6 lg:grid-cols-6 mb-5" aria-hidden="true">
        <div className={`col-span-2 ${CHECKOUT_LOADING_SKELETON_TOKENS.base} h-32 rounded-lg`} />
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={`${CHECKOUT_LOADING_SKELETON_TOKENS.base} ${CHECKOUT_LOADING_SKELETON_TOKENS.card}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-5" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={`${CHECKOUT_LOADING_SKELETON_TOKENS.base} ${CHECKOUT_LOADING_SKELETON_TOKENS.card}`}
        />
      ))}
    </div>
  );
}
