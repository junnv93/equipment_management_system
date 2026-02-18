'use client';

import { useTranslations } from 'next-intl';
import type { EquipmentByTeam } from '@/lib/api/dashboard-api';
import { DASHBOARD_MOTION } from '@/lib/design-tokens';

// Named export for simple inline usage in dashboard
export function TeamEquipmentStatsItem({
  team,
  selected = false,
  onClick,
}: {
  team: EquipmentByTeam;
  selected?: boolean;
  onClick?: () => void;
}) {
  const t = useTranslations('dashboard.equipmentTab');
  return (
    <div
      className={`flex items-center justify-between p-2.5 bg-card rounded-lg border hover:bg-muted/50 ${DASHBOARD_MOTION.listItem} motion-reduce:transition-none cursor-pointer ${
        selected ? 'bg-primary/10 border-primary' : ''
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <span className="font-medium text-sm">{team.name}</span>
      <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded tabular-nums">
        {t('countUnit', { count: team.count })}
      </span>
    </div>
  );
}

// Re-export with alias for backwards compatibility
export { TeamEquipmentStatsItem as TeamEquipmentStats };
