import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { CALIBRATION_PLAN_STATUS_BADGE_COLORS } from '@/lib/design-tokens';
import type { CalibrationPlanStatus } from '@equipment-management/schemas';

interface PlanStatusBadgeProps {
  status: CalibrationPlanStatus;
}

export function PlanStatusBadge({ status }: PlanStatusBadgeProps) {
  const t = useTranslations('calibration');
  return (
    <Badge className={CALIBRATION_PLAN_STATUS_BADGE_COLORS[status]}>
      {t(`planStatus.${status}` as Parameters<typeof t>[0])}
    </Badge>
  );
}
