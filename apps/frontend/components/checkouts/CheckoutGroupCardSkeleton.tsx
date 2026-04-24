'use client';

import { CHECKOUT_LOADING_SKELETON_TOKENS } from '@/lib/design-tokens';

/**
 * CheckoutGroupCard 로딩 스켈레톤
 * 그룹 헤더 + row 3개 (badge + text.md + text.sm)
 */
export function CheckoutGroupCardSkeleton({ rowCount = 3 }: { rowCount?: number }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {/* 그룹 헤더 */}
      <div
        className={`${CHECKOUT_LOADING_SKELETON_TOKENS.base} ${CHECKOUT_LOADING_SKELETON_TOKENS.text.md} w-full`}
      />
      {/* rows */}
      {Array.from({ length: rowCount }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-1 py-1.5">
          <div
            className={`${CHECKOUT_LOADING_SKELETON_TOKENS.base} ${CHECKOUT_LOADING_SKELETON_TOKENS.badge} shrink-0`}
          />
          <div
            className={`${CHECKOUT_LOADING_SKELETON_TOKENS.base} ${CHECKOUT_LOADING_SKELETON_TOKENS.text.md}`}
          />
          <div
            className={`${CHECKOUT_LOADING_SKELETON_TOKENS.base} ${CHECKOUT_LOADING_SKELETON_TOKENS.text.sm} ml-auto`}
          />
        </div>
      ))}
    </div>
  );
}
