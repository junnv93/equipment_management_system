'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import {
  EQUIPMENT_IMPORT_STATUS_LABELS,
  type EquipmentImportStatus,
} from '@equipment-management/schemas';
import {
  CHECKOUT_STATUS_BADGE_TOKENS,
  RENTAL_IMPORT_STATUS_BADGE_TOKENS,
  DEFAULT_CHECKOUT_BADGE,
} from '@/lib/design-tokens';

// ============================================================================
// Component
// ============================================================================

interface CheckoutStatusBadgeProps {
  /** 상태 값 */
  status: string;
  /** 'checkout'(기본) 또는 'rental' */
  type?: 'checkout' | 'rental';
  /** 추가 className */
  className?: string;
}

/**
 * 반출입 상태 배지 (SSOT)
 *
 * 모든 Checkout/Rental 상태 표시에 이 컴포넌트를 사용합니다.
 * - Checkout: `<CheckoutStatusBadge status="pending" />`
 * - Rental:  `<CheckoutStatusBadge status="received" type="rental" />`
 */
export function CheckoutStatusBadge({
  status,
  type = 'checkout',
  className = '',
}: CheckoutStatusBadgeProps) {
  const t = useTranslations('checkouts');
  const isRental = type === 'rental';

  const label = isRental
    ? EQUIPMENT_IMPORT_STATUS_LABELS[status as EquipmentImportStatus] || status
    : t(`status.${status}`);

  const styleMap = isRental ? RENTAL_IMPORT_STATUS_BADGE_TOKENS : CHECKOUT_STATUS_BADGE_TOKENS;
  const style = styleMap[status as keyof typeof styleMap] || DEFAULT_CHECKOUT_BADGE;

  return (
    <Badge variant="outline" className={`${style} ${className}`.trim()}>
      {label}
    </Badge>
  );
}
