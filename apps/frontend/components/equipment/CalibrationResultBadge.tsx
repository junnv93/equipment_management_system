'use client';

import { Badge } from '@/components/ui/badge';
import {
  CALIBRATION_RESULT_BADGE,
  DEFAULT_CALIBRATION_RESULT_BADGE,
  CALIBRATION_APPROVAL_BADGE,
  DEFAULT_CALIBRATION_APPROVAL_BADGE,
} from '@/lib/design-tokens';
import {
  CALIBRATION_RESULT_LABELS,
  CALIBRATION_APPROVAL_STATUS_LABELS,
  type CalibrationResult,
  type CalibrationApprovalStatus,
} from '@equipment-management/schemas';

interface CalibrationResultBadgeProps {
  type: 'result' | 'approval';
  value: string;
}

/**
 * 교정 결과/승인 상태 배지 (design token SSOT)
 *
 * - type='result': pass/fail/conditional → CALIBRATION_RESULT_LABELS + CALIBRATION_RESULT_BADGE
 * - type='approval': pending_approval/approved/rejected → CALIBRATION_APPROVAL_STATUS_LABELS + CALIBRATION_APPROVAL_BADGE
 */
export function CalibrationResultBadge({ type, value }: CalibrationResultBadgeProps) {
  if (type === 'result') {
    const label = CALIBRATION_RESULT_LABELS[value as CalibrationResult] ?? value;
    const className = CALIBRATION_RESULT_BADGE[value] ?? DEFAULT_CALIBRATION_RESULT_BADGE;
    return (
      <Badge variant="outline" className={className}>
        {label}
      </Badge>
    );
  }

  const label = CALIBRATION_APPROVAL_STATUS_LABELS[value as CalibrationApprovalStatus] ?? value;
  const className = CALIBRATION_APPROVAL_BADGE[value] ?? DEFAULT_CALIBRATION_APPROVAL_BADGE;
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
