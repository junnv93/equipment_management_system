'use client';

import { Badge } from '@/components/ui/badge';
import {
  CHECKOUT_STATUS_LABELS,
  EQUIPMENT_IMPORT_STATUS_LABELS,
  type CheckoutStatus,
  type EquipmentImportStatus,
} from '@equipment-management/schemas';

// ============================================================================
// Semantic Color Families — 같은 의미의 상태는 Checkout/Rental 무관하게 같은 색상
// ============================================================================

/** Checkout 상태 → 스타일 매핑 (WCAG AA 색상 대비 보장: 4.5:1+, light + dark) */
export const CHECKOUT_STATUS_STYLES: Record<CheckoutStatus, string> = {
  // 대기 (amber)
  pending:
    'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  // 승인 (blue)
  approved:
    'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  // 진행 중 (indigo → teal)
  checked_out:
    'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
  lender_checked:
    'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800',
  borrower_received:
    'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800',
  // 사용 중 (violet)
  in_use:
    'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800',
  // 반환 진행 (emerald/lime)
  borrower_returned:
    'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
  lender_received:
    'bg-lime-50 text-lime-800 border-lime-200 dark:bg-lime-900/20 dark:text-lime-300 dark:border-lime-800',
  // 완료 (green)
  returned:
    'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
  return_approved:
    'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  // 거절 (red)
  rejected:
    'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  // 기한 초과 (red 강조)
  overdue:
    'bg-red-100 text-red-900 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  // 취소 (gray)
  canceled:
    'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700',
};

/** Rental import 상태 → 스타일 매핑 (WCAG AA 색상 대비 보장: 4.5:1+, light + dark) */
export const RENTAL_STATUS_STYLES: Record<EquipmentImportStatus, string> = {
  // 대기 (amber)
  pending:
    'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  // 승인 (blue)
  approved:
    'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  // 거절 (red)
  rejected:
    'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  // 수령 완료 (green)
  received:
    'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
  // 반납 진행 중 (orange)
  return_requested:
    'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
  // 반납 완료 (green 강조)
  returned:
    'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  // 취소 (gray)
  canceled:
    'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700',
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
    ? EQUIPMENT_IMPORT_STATUS_LABELS[status as EquipmentImportStatus] || status
    : CHECKOUT_STATUS_LABELS[status as CheckoutStatus] || status;

  const styleMap = isRental ? RENTAL_STATUS_STYLES : CHECKOUT_STATUS_STYLES;
  const style = styleMap[status as keyof typeof styleMap] || 'bg-gray-100 text-gray-800';

  return (
    <Badge variant="outline" className={`${style} ${className}`.trim()}>
      {label}
    </Badge>
  );
}
