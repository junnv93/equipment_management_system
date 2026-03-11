'use client';

import { cn } from '@/lib/utils';
import {
  type ApprovalCategory,
  type PendingCountsByCategory,
  TAB_META,
  APPROVAL_SECTIONS,
  type ApprovalSection,
} from '@/lib/api/approvals-api';
import { APPROVAL_MOBILE_CATEGORY_BAR_TOKENS } from '@/lib/design-tokens';
import { APPROVAL_ICONS } from './approval-icons';
import { useTranslations } from 'next-intl';

interface ApprovalMobileCategoryBarProps {
  availableTabs: ApprovalCategory[];
  activeTab: ApprovalCategory;
  pendingCounts?: PendingCountsByCategory;
  onTabChange: (tab: string) => void;
  className?: string;
}

/**
 * 모바일 카테고리 가로 스크롤 pill bar (<lg)
 *
 * 섹션 구분: 얇은 세로 디바이더
 */
export function ApprovalMobileCategoryBar({
  availableTabs,
  activeTab,
  pendingCounts,
  onTabChange,
  className,
}: ApprovalMobileCategoryBarProps) {
  const t = useTranslations('approvals');
  const tokens = APPROVAL_MOBILE_CATEGORY_BAR_TOKENS;

  // 섹션별 탭 그룹핑
  const sectionGroups = availableTabs.reduce<Record<ApprovalSection, ApprovalCategory[]>>(
    (acc, tab) => {
      const section = TAB_META[tab].section;
      if (!acc[section]) acc[section] = [];
      acc[section].push(tab);
      return acc;
    },
    {} as Record<ApprovalSection, ApprovalCategory[]>
  );

  const sortedSections = (Object.keys(sectionGroups) as ApprovalSection[]).sort(
    (a, b) => APPROVAL_SECTIONS[a].order - APPROVAL_SECTIONS[b].order
  );

  return (
    <div
      className={cn(tokens.container, className)}
      role="tablist"
      aria-label={t('mobileBar.ariaLabel')}
    >
      {sortedSections.map((section, sectionIndex) => (
        <div key={section} className="contents">
          {sectionIndex > 0 && <div className={tokens.sectionDivider} />}
          {sectionGroups[section].map((tab) => {
            const meta = TAB_META[tab];
            const count = pendingCounts?.[tab] ?? 0;
            const isActive = activeTab === tab;
            const IconComponent = APPROVAL_ICONS[meta.icon];

            return (
              <button
                key={tab}
                type="button"
                role="tab"
                onClick={() => onTabChange(tab)}
                className={cn(
                  tokens.pill.base,
                  isActive ? tokens.pill.active : tokens.pill.inactive
                )}
                aria-selected={isActive}
              >
                {IconComponent && <IconComponent className="h-3.5 w-3.5" aria-hidden="true" />}
                <span>{t(`tabMeta.${tab}.label`)}</span>
                {count > 0 && <span className={tokens.badge}>{count}</span>}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
