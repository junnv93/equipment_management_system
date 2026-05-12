import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';

/**
 * 승인 철회 API — 5분 윈도우 + 사용자 입력 사유 동반 호출.
 *
 * Backend `revokeApprovalSchema` 정합: `{ version, reason }` body 필수.
 *
 * SSOT
 * - endpoint: `API_ENDPOINTS.CHECKOUTS.REVOKE_APPROVAL`
 * - schema: `apps/backend/src/modules/checkouts/dto/revoke-approval.dto.ts` (versionedSchema + reason min/max)
 * - 5분 윈도우: `APPROVAL_REVOCATION_WINDOW_MS` (frontend hook `useRevocationWindow`)
 * - 사유 min/max: `VALIDATION_RULES.REVOCATION_REASON_MIN_LENGTH` / `LONG_TEXT_MAX_LENGTH`
 *
 * 호출 사이트: `CheckoutDetailClient` revokeMutation. 5초 undo 토스트 자동 트리거 경로(`use-undo-toast`)는
 * 정책 결정(system reason vs 별도 endpoint) 대기 — tech-debt SH-8 참조.
 */
export interface RevokeApprovalWithReasonParams {
  version: number;
  reason: string;
}

export async function revokeApprovalWithReason(
  checkoutId: string,
  params: RevokeApprovalWithReasonParams
): Promise<void> {
  await apiClient.post(API_ENDPOINTS.CHECKOUTS.REVOKE_APPROVAL(checkoutId), params);
}
