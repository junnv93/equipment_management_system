'use client';

/**
 * QuickActionBar — 역할 기반 빠른 실행 버튼 바
 *
 * 와이어프레임: "빠른 실행: [■ 장비 등록] [■ 교정 등록] ..." 가로 버튼 형태
 * dashboard-config.ts의 SSOT quickActions를 그대로 렌더링
 */

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { DASHBOARD_QUICK_ACTION_TOKENS as T } from '@/lib/design-tokens';
import type { QuickActionItem } from '@/lib/config/dashboard-config';

interface QuickActionBarProps {
  actions: QuickActionItem[];
  className?: string;
}

export function QuickActionBar({ actions, className }: QuickActionBarProps) {
  const t = useTranslations('dashboard.quickActions');

  if (!actions.length) return null;

  return (
    <nav aria-label={t('ariaLabel')} className={cn(T.container, className)}>
      <span className={T.label}>{t('ariaLabel')}:</span>
      <div className={T.grid}>
        {actions.map((action) => {
          const Icon = action.icon;
          const actionClass = action.priority === 'primary' ? T.actionPrimary : T.action;
          return (
            <Link
              key={action.labelKey}
              href={action.href}
              className={actionClass}
              aria-label={t(action.labelKey as Parameters<typeof t>[0])}
            >
              <Icon className={cn(T.actionIcon, action.iconColorClass)} aria-hidden="true" />
              <span className={T.actionLabel}>{t(action.labelKey as Parameters<typeof t>[0])}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
