import { redirect } from 'next/navigation';

/**
 * Deprecated: /admin/approvals를 사용하세요.
 *
 * 하위 호환성을 위한 리다이렉트 페이지
 * /checkouts/manage → /admin/approvals?tab=checkout
 *
 * @deprecated Use /admin/approvals?tab=checkout instead
 */
export default function CheckoutManagePage() {
  redirect('/admin/approvals?tab=checkout');
}
