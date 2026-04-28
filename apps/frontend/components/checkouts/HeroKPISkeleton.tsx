'use client';

import {
  CHECKOUT_LOADING_SKELETON_TOKENS,
  CHECKOUT_STATS_VARIANTS,
  getStatsGridClass,
} from '@/lib/design-tokens';

interface HeroKPISkeletonProps {
  /**
   * overdue > 0 일 때 hero 카드가 있는 6칸 그리드 표시.
   * false(기본): overdue = 0 상태와 동일한 5칸 균등 그리드.
   * OutboundCheckoutsTab에서 summary.overdue를 기반으로 전달.
   */
  hasHero?: boolean;
}

/**
 * HeroKPI stats 영역 로딩 스켈레톤.
 * OutboundCheckoutsTab의 renderStats() 그리드 구조를 정확히 미러링.
 *
 * Phase 4 (P1-1) — host와 동일한 grid 토큰(getStatsGridClass) +
 * hero containerInGrid 토큰을 공유하여 host 변경 시 자동 따라감 (CLS 회피).
 */
export function HeroKPISkeleton({ hasHero = false }: HeroKPISkeletonProps) {
  if (hasHero) {
    return (
      <div className={`${getStatsGridClass(true)} mb-5`} aria-hidden="true">
        <div
          className={`${CHECKOUT_STATS_VARIANTS.hero.containerInGrid} ${CHECKOUT_LOADING_SKELETON_TOKENS.base} h-32 rounded-lg`}
        />
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
    <div className={`${getStatsGridClass(false)} mb-5`} aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={`${CHECKOUT_LOADING_SKELETON_TOKENS.base} ${CHECKOUT_LOADING_SKELETON_TOKENS.card}`}
        />
      ))}
    </div>
  );
}
