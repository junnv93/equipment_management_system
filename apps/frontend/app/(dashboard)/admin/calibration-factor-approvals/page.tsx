import { redirect } from 'next/navigation';
import { getApprovalPageUrl } from '@equipment-management/shared-constants';
import { ApprovalCategoryValues as AC } from '@equipment-management/schemas';

/**
 * @deprecated 통합 승인 페이지(/admin/approvals)로 리다이렉트
 */
export default function CalibrationFactorApprovalsPage() {
  redirect(getApprovalPageUrl(AC.INSPECTION));
}
