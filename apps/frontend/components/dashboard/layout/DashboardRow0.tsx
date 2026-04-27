'use client';

import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { QuickActionBar } from '@/components/dashboard/QuickActionBar';
import { DASHBOARD_ENTRANCE as E } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import type { QuickActionItem } from '@/lib/config/dashboard-config';

export interface DashboardRow0Props {
  showQuickActionBar: boolean;
  quickActions: QuickActionItem[];
}

export function DashboardRow0({ showQuickActionBar, quickActions }: DashboardRow0Props) {
  return (
    <div
      className={cn(
        'flex flex-col xl:flex-row xl:items-end xl:justify-between gap-3',
        E.stagger.welcome,
        E.stagger.welcomeDelay
      )}
    >
      <header className="flex-1 min-w-0">
        <WelcomeHeader />
      </header>
      {showQuickActionBar && quickActions.length > 0 && (
        <div className="xl:flex-shrink-0">
          <QuickActionBar actions={quickActions} />
        </div>
      )}
    </div>
  );
}
