'use client';

import { HelpCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  CHECKOUT_STATUS_BADGE_TOKENS,
  RENTAL_IMPORT_STATUS_BADGE_TOKENS,
  DEFAULT_CHECKOUT_BADGE,
} from '@/lib/design-tokens';
import type { CheckoutStatus, EquipmentImportStatus } from '@equipment-management/schemas';

// ============================================================================
// Component
// ============================================================================

interface CheckoutStatusBadgeProps {
  /** 상태 값 */
  status: CheckoutStatus | EquipmentImportStatus;
  /** 'checkout'(기본) 또는 'rental' */
  type?: 'checkout' | 'rental';
  /** 추가 className */
  className?: string;
  /** aria-describedby 연결용 id — checkout type에서만 tooltip id로 사용 */
  id?: string;
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
  id,
}: CheckoutStatusBadgeProps) {
  const t = useTranslations('checkouts');
  const tEquipment = useTranslations('equipment');
  const isRental = type === 'rental';

  const label = isRental ? tEquipment(`importStatus.${status}`) : t(`status.${status}`);

  const styleMap = isRental ? RENTAL_IMPORT_STATUS_BADGE_TOKENS : CHECKOUT_STATUS_BADGE_TOKENS;
  const style = styleMap[status as keyof typeof styleMap] || DEFAULT_CHECKOUT_BADGE;

  const badge = (
    <Badge
      variant="outline"
      className={`text-xs ${style} ${className}`.trim()}
      aria-describedby={!isRental && id ? `status-help-${id}` : undefined}
    >
      {label}
    </Badge>
  );

  // rental 타입은 help.status 매핑 없음 → tooltip 미렌더
  if (isRental) {
    return badge;
  }

  const tooltipId = id ? `status-help-${id}` : undefined;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="group inline-flex items-center gap-1">
            {badge}
            <HelpCircle
              className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              aria-hidden="true"
            />
          </span>
        </TooltipTrigger>
        <TooltipContent id={tooltipId} className="max-w-[200px] text-xs">
          {t(`help.status.${status}.description`)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
