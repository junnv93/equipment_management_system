'use client';

import { CHECKOUT_LOADING_SKELETON_TOKENS } from '@/lib/design-tokens';

/**
 * HeroKPI 로딩 스켈레톤
 * OutboundCheckoutsTab의 5-카드 통계 그리드 구조를 미러링
 * hero(col-span-2) 1개 + secondary 4개
 */
export function HeroKPISkeleton() {
  return (
    <div className="grid gap-3 grid-cols-4 sm:grid-cols-6 lg:grid-cols-6 mb-5" aria-hidden="true">
      {/* Hero 카드: col-span-2 */}
      <div className={`col-span-2 ${CHECKOUT_LOADING_SKELETON_TOKENS.base} h-32 rounded-lg`} />
      {/* Secondary 카드 4개 */}
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className={`${CHECKOUT_LOADING_SKELETON_TOKENS.base} ${CHECKOUT_LOADING_SKELETON_TOKENS.card}`}
        />
      ))}
    </div>
  );
}
