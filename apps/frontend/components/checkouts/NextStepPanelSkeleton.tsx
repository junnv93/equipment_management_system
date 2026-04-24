'use client';

import { CHECKOUT_LOADING_SKELETON_TOKENS } from '@/lib/design-tokens';

/**
 * NextStepPanel 로딩 스켈레톤
 * icon + title + button 3-line 세로 구조
 */
export function NextStepPanelSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4" aria-hidden="true">
      <div
        className={`${CHECKOUT_LOADING_SKELETON_TOKENS.base} ${CHECKOUT_LOADING_SKELETON_TOKENS.icon} shrink-0`}
      />
      <div className="flex flex-col gap-2 flex-1">
        <div
          className={`${CHECKOUT_LOADING_SKELETON_TOKENS.base} ${CHECKOUT_LOADING_SKELETON_TOKENS.text.lg}`}
        />
        <div className={`${CHECKOUT_LOADING_SKELETON_TOKENS.base} h-5 w-32`} />
      </div>
    </div>
  );
}
