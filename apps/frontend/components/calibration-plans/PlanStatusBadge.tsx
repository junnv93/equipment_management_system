import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { CALIBRATION_PLAN_STATUS_BADGE_COLORS } from '@/lib/design-tokens';
import {
  type CalibrationPlanStatus,
  CalibrationPlanStatusValues as CPVal,
} from '@equipment-management/schemas';
import { cn } from '@/lib/utils';

interface PlanStatusBadgeProps {
  status: CalibrationPlanStatus;
}

const STATUS_STEP_INDEX: Record<CalibrationPlanStatus, number> = {
  draft: 0,
  pending_review: 1,
  pending_approval: 2,
  approved: 3,
  rejected: 2,
};

export function PlanStatusBadge({ status }: PlanStatusBadgeProps) {
  const t = useTranslations('calibration');
  const activeIndex = STATUS_STEP_INDEX[status];
  const isRejected = status === CPVal.REJECTED;

  return (
    <Badge
      className={cn(
        'inline-flex items-center gap-1.5',
        CALIBRATION_PLAN_STATUS_BADGE_COLORS[status]
      )}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {[0, 1, 2, 3].map((step) => (
          <span
            key={step}
            className={cn(
              'h-1.5 w-1.5 rounded-full bg-current opacity-30',
              step < activeIndex && 'opacity-70',
              step === activeIndex && 'opacity-100',
              isRejected && step === activeIndex && 'ring-1 ring-current ring-offset-1'
            )}
          />
        ))}
      </span>
      <span>{t(`planStatus.${status}` as Parameters<typeof t>[0])}</span>
    </Badge>
  );
}
