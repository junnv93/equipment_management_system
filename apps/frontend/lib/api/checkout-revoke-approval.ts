import { apiClient } from './api-client';
import { transformSingleResponse } from './utils/response-transformers';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type { RevokeApprovalInput } from '@equipment-management/schemas';
import type { Checkout } from './checkout-api';

/**
 * 승인 철회 API — 단일 진입점.
 *
 * Backend `revokeApprovalSchema` (`packages/schemas/src/revoke-approval.ts`) 정합:
 * `{ version, reason }` body 필수. type 은 zod `z.infer<typeof revokeApprovalSchema>` 단일 SSOT.
 *
 * 반환: backend가 PENDING 상태로 롤백된 updated checkout 반환 — 타입 일관성 유지.
 *
 * 호출 사이트
 * - `CheckoutDetailClient` revokeMutation — 5분 윈도우 + 사용자 입력 사유
 * - `useUndoToast` 5초 자동 트리거 — `SYSTEM_UNDO_REVOCATION_REASON` 시스템 사유 전달
 *
 * SSOT
 * - endpoint: `API_ENDPOINTS.CHECKOUTS.REVOKE_APPROVAL`
 * - schema/type: `@equipment-management/schemas#revokeApprovalSchema` / `RevokeApprovalInput`
 * - 5분 윈도우: `APPROVAL_REVOCATION_WINDOW_MS` (hook `useRevocationWindow`)
 */
export async function revokeApproval(
  checkoutId: string,
  params: RevokeApprovalInput
): Promise<Checkout> {
  const response = await apiClient.post(
    API_ENDPOINTS.CHECKOUTS.REVOKE_APPROVAL(checkoutId),
    params
  );
  return transformSingleResponse<Checkout>(response);
}
