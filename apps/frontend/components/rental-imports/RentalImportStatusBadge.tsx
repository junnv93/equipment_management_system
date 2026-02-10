'use client';

import type { RentalImportStatus } from '@equipment-management/schemas';
import { CheckoutStatusBadge } from '@/components/checkouts/CheckoutStatusBadge';

interface RentalImportStatusBadgeProps {
  status: RentalImportStatus;
  className?: string;
}

/**
 * 렌탈 반입 상태 배지 — CheckoutStatusBadge thin wrapper
 *
 * 기존 import 호환성을 유지하면서 중앙 컴포넌트로 위임합니다.
 */
export function RentalImportStatusBadge({ status, className }: RentalImportStatusBadgeProps) {
  return <CheckoutStatusBadge status={status} type="rental" className={className} />;
}
