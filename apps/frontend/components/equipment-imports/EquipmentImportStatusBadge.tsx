'use client';

import type { EquipmentImportStatus } from '@equipment-management/schemas';
import { CheckoutStatusBadge } from '@/components/checkouts/CheckoutStatusBadge';

interface EquipmentImportStatusBadgeProps {
  status: EquipmentImportStatus;
  className?: string;
}

/**
 * Equipment Import Status Badge - Unified for rental and internal shared
 *
 * Uses CheckoutStatusBadge as the underlying component for consistency.
 * EquipmentImportStatus values are compatible with CheckoutStatus.
 */
export function EquipmentImportStatusBadge({ status, className }: EquipmentImportStatusBadgeProps) {
  return <CheckoutStatusBadge status={status} type="rental" className={className} />;
}
