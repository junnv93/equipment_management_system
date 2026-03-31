'use client';

import { Badge } from '@/components/ui/badge';
import {
  CALIBRATION_RESULT_BADGE,
  DEFAULT_CALIBRATION_RESULT_BADGE,
  CALIBRATION_APPROVAL_BADGE,
  DEFAULT_CALIBRATION_APPROVAL_BADGE,
} from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

interface CalibrationResultBadgeProps {
  type: 'result' | 'approval';
  value: string;
}

/**
 * 교정 결과/승인 상태 배지 (design token SSOT)
 *
 * - type='result': pass/fail/conditional → t('result.{value}') + CALIBRATION_RESULT_BADGE
 * - type='approval': pending_approval/approved/rejected → t('status.{value}') + CALIBRATION_APPROVAL_BADGE
 */
export function CalibrationResultBadge({ type, value }: CalibrationResultBadgeProps) {
  const t = useTranslations('calibration');

  if (type === 'result') {
    const label = t(`result.${value}`);
    const className = CALIBRATION_RESULT_BADGE[value] ?? DEFAULT_CALIBRATION_RESULT_BADGE;
    return (
      <Badge variant="outline" className={className}>
        {label}
      </Badge>
    );
  }

  const label = t(`status.${value}`);
  const className = CALIBRATION_APPROVAL_BADGE[value] ?? DEFAULT_CALIBRATION_APPROVAL_BADGE;
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
