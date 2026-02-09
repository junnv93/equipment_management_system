'use client';

import { Badge } from '@/components/ui/badge';
import {
  CHECKOUT_STATUS_LABELS,
  RENTAL_IMPORT_STATUS_LABELS,
  type CheckoutStatus,
  type RentalImportStatus,
} from '@equipment-management/schemas';

// ============================================================================
// Semantic Color Families — 같은 의미의 상태는 Checkout/Rental 무관하게 같은 색상
// ============================================================================

/** Checkout 상태 → 스타일 매핑 (WCAG AA 색상 대비 보장: 4.5:1+) */
export const CHECKOUT_STATUS_STYLES: Record<CheckoutStatus, string> = {
  // 대기 (amber) - text-800 for better contrast
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  // 승인 (blue) - text-800 for better contrast
  approved: 'bg-blue-50 text-blue-800 border-blue-200',
  // 진행 중 (indigo → teal) - text-800 for better contrast
  checked_out: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  lender_checked: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  borrower_received: 'bg-teal-50 text-teal-800 border-teal-200',
  // 사용 중 (violet) - text-800 for better contrast
  in_use: 'bg-violet-50 text-violet-800 border-violet-200',
  // 반환 진행 (emerald/lime) - text-800 for better contrast
  borrower_returned: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  lender_received: 'bg-lime-50 text-lime-800 border-lime-200',
  // 완료 (green) - text-800 for better contrast
  returned: 'bg-green-50 text-green-800 border-green-200',
  return_approved: 'bg-green-100 text-green-800 border-green-200',
  // 거절 (red) - text-800 for better contrast
  rejected: 'bg-red-50 text-red-800 border-red-200',
  // 기한 초과 (red 강조)
  overdue: 'bg-red-100 text-red-900 border-red-300',
  // 취소 (gray) - text-600 for better contrast
  canceled: 'bg-gray-50 text-gray-600 border-gray-200',
};

/** Rental import 상태 → 스타일 매핑 (WCAG AA 색상 대비 보장: 4.5:1+) */
export const RENTAL_STATUS_STYLES: Record<RentalImportStatus, string> = {
  // 대기 (amber) - text-800 for better contrast
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  // 승인 (blue) - text-800 for better contrast
  approved: 'bg-blue-50 text-blue-800 border-blue-200',
  // 거절 (red) - text-800 for better contrast
  rejected: 'bg-red-50 text-red-800 border-red-200',
  // 수령 완료 (green) - text-800 for better contrast
  received: 'bg-green-50 text-green-800 border-green-200',
  // 반납 진행 중 (orange) - text-800 for better contrast
  return_requested: 'bg-orange-50 text-orange-800 border-orange-200',
  // 반납 완료 (green 강조)
  returned: 'bg-green-100 text-green-800 border-green-200',
  // 취소 (gray) - text-600 for better contrast
  canceled: 'bg-gray-50 text-gray-600 border-gray-200',
};

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
  const isRental = type === 'rental';

  const label = isRental
    ? RENTAL_IMPORT_STATUS_LABELS[status as RentalImportStatus] || status
    : CHECKOUT_STATUS_LABELS[status as CheckoutStatus] || status;

  const styleMap = isRental ? RENTAL_STATUS_STYLES : CHECKOUT_STATUS_STYLES;
  const style = styleMap[status as keyof typeof styleMap] || 'bg-gray-100 text-gray-800';

  return (
    <Badge variant="outline" className={`${style} ${className}`.trim()}>
      {label}
    </Badge>
  );
}
