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
    <nav className={cn(tokens.container, className)} aria-label={t('sidebar.ariaLabel')}>
      {/* 단일 tablist — ApprovalMobileCategoryBar와 ARIA 패턴 통일 (AP-04) */}
      <div role="tablist" aria-orientation="vertical">
        {sortedSections.map((section, sectionIndex) => (
          // className="contents": 래퍼 div를 렌더 트리에서 투명하게 처리, tablist 구조 유지
          <div key={section} className="contents">
            {sectionIndex > 0 && <div className={tokens.divider} role="presentation" />}
            <div className={tokens.sectionLabel} role="presentation">
              {t(APPROVAL_SECTIONS[section].labelKey)}
            </div>
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
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onTabChange(tab)}
                  className={cn(
                    tokens.item.base,
                    isActive
                      ? `${tokens.item.active} ${tokens.item.activeBar}`
                      : tokens.item.inactive
                  )}
                >
                  {IconComponent && <IconComponent className={tokens.icon} aria-hidden="true" />}
                  <span className="truncate">{t(`tabMeta.${tab}.label`)}</span>
                  {count > 0 ? (
                    <span
                      className={cn(
                        tokens.badge.base,
                        isActive ? '' : isUrgent ? tokens.badge.urgent : tokens.badge.normal
                      )}
                    >
                      {count}
                    </span>
                  ) : isActive ? (
                    <span className={cn(tokens.badge.base, tokens.badge.completed)}>
                      {t('sidebar.completedHint')}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
