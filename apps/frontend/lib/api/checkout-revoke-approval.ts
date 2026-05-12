import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type { RevokeApprovalInput } from '@equipment-management/schemas';

/**
 * 승인 철회 API — 단일 진입점.
 *
 * Backend `revokeApprovalSchema` (`packages/schemas/src/revoke-approval.ts`) 정합:
 * `{ version, reason }` body 필수. type 은 zod `z.infer<typeof revokeApprovalSchema>` 단일 SSOT.
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
): Promise<void> {
  await apiClient.post(API_ENDPOINTS.CHECKOUTS.REVOKE_APPROVAL(checkoutId), params);
}
