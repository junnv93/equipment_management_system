'use client';

import { useRef, type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { CHECKOUT_TAB_BADGE_TOKENS } from '@/lib/design-tokens';
import type { CheckoutSubTab } from '@/lib/utils/checkout-filter-utils';

interface CheckoutListTabsProps {
  currentSubTab: CheckoutSubTab;
  onSubTabChange: (tab: CheckoutSubTab) => void;
  /** 현재 탭의 반출 총 건수 (페이지네이션 total) */
  currentCount?: number;
  /** 현재 탭의 장비 총 대수 (equipment 배열 합산) */
  currentEquipmentCount?: number;
}

const SUB_TABS: CheckoutSubTab[] = ['inProgress', 'completed'];

/**
 * 반출 목록 서브탭 (진행 중 / 완료)
 *
 * - URL이 유일한 진실의 소스: subTab 기본값(inProgress)은 URL에서 생략
 * - WCAG 2.1 Tab Pattern: role="tablist", aria-selected, ←/→ 키보드 내비게이션
 * - 카운트 배지: 현재 활성 탭의 총 건수만 표시 (비활성 탭은 생략 — SHOULD S1)
 */
export default function CheckoutListTabs({
  currentSubTab,
  onSubTabChange,
  currentCount,
  currentEquipmentCount,
}: CheckoutListTabsProps) {
  const t = useTranslations('checkouts');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (index + 1) % SUB_TABS.length;
      tabRefs.current[next]?.focus();
      onSubTabChange(SUB_TABS[next]);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (index - 1 + SUB_TABS.length) % SUB_TABS.length;
      tabRefs.current[prev]?.focus();
      onSubTabChange(SUB_TABS[prev]);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={t('list.subtab.ariaLabel')}
      className="flex gap-1 border-b border-border"
    >
      {SUB_TABS.map((tab, index) => {
        const isActive = currentSubTab === tab;
        const showCount = isActive && currentCount !== undefined && currentCount > 0;

        return (
          <button
            key={tab}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`subtab-panel-${tab}`}
            id={`subtab-trigger-${tab}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSubTabChange(tab)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={[
              'relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              'rounded-t-sm',
              isActive
                ? 'text-foreground border-b-2 border-primary -mb-px'
                : 'text-muted-foreground hover:text-foreground',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {t(`list.subtab.${tab}`)}
            {showCount && (
              <span
                className={`${CHECKOUT_TAB_BADGE_TOKENS.base} ${CHECKOUT_TAB_BADGE_TOKENS.active}`}
                aria-label={`${t('list.count.checkouts', { count: currentCount })}${t('list.count.separator')}${t('list.count.equipment', { count: currentEquipmentCount ?? 0 })}`}
              >
                {t('list.count.checkouts', { count: currentCount })}
                {t('list.count.separator')}
                {t('list.count.equipment', { count: currentEquipmentCount ?? 0 })}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
