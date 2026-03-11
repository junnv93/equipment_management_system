'use client';

import { cn } from '@/lib/utils';
import {
  type ApprovalCategory,
  type PendingCountsByCategory,
  TAB_META,
  APPROVAL_SECTIONS,
  type ApprovalSection,
} from '@/lib/api/approvals-api';
import { APPROVAL_CATEGORY_SIDEBAR_TOKENS, getCountBasedUrgency } from '@/lib/design-tokens';
import { APPROVAL_ICONS } from './approval-icons';
import { useTranslations } from 'next-intl';

interface ApprovalCategorySidebarProps {
  availableTabs: ApprovalCategory[];
  activeTab: ApprovalCategory;
  pendingCounts?: PendingCountsByCategory;
  onTabChange: (tab: string) => void;
  className?: string;
}

/**
 * 승인 카테고리 사이드바 — lg: 이상에서 표시 (220px, sticky)
 *
 * TAB_META[tab].section으로 섹션 그룹핑 → APPROVAL_SECTIONS 순서로 렌더
 */
export function ApprovalCategorySidebar({
  availableTabs,
  activeTab,
  pendingCounts,
  onTabChange,
  className,
}: ApprovalCategorySidebarProps) {
  const t = useTranslations('approvals');
  const tokens = APPROVAL_CATEGORY_SIDEBAR_TOKENS;

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

  // APPROVAL_SECTIONS.order로 정렬
  const sortedSections = (Object.keys(sectionGroups) as ApprovalSection[]).sort(
    (a, b) => APPROVAL_SECTIONS[a].order - APPROVAL_SECTIONS[b].order
  );

  return (
    <nav
      className={cn(tokens.container, className)}
      role="navigation"
      aria-label={t('sidebar.ariaLabel')}
    >
      {sortedSections.map((section, sectionIndex) => (
        <div key={section}>
          {sectionIndex > 0 && <div className={tokens.divider} />}
          <div className={tokens.sectionLabel}>{t(APPROVAL_SECTIONS[section].labelKey)}</div>
          {sectionGroups[section].map((tab) => {
            const meta = TAB_META[tab];
            const count = pendingCounts?.[tab] ?? 0;
            const isActive = activeTab === tab;
            const urgency = getCountBasedUrgency(count);
            const isUrgent = urgency === 'critical' || urgency === 'emergency';
            const IconComponent = APPROVAL_ICONS[meta.icon];

            return (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={cn(
                  tokens.item.base,
                  isActive ? tokens.item.active : tokens.item.inactive
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {IconComponent && <IconComponent className={tokens.icon} aria-hidden="true" />}
                <span className="truncate">{t(`tabMeta.${tab}.label`)}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      tokens.badge.base,
                      isActive
                        ? '' // active 상태에서는 primary-foreground 색상 상속
                        : isUrgent
                          ? tokens.badge.urgent
                          : tokens.badge.normal
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
