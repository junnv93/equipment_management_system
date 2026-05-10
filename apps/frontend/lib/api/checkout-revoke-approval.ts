import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';

/**
 * 승인 철회 API
 *
 * 5분 이내에 이미 처리된 승인을 철회합니다.
 * SSOT: API_ENDPOINTS.CHECKOUTS.REVOKE_APPROVAL
 */
export async function revokeApproval(checkoutId: string): Promise<void> {
  await apiClient.post(API_ENDPOINTS.CHECKOUTS.REVOKE_APPROVAL(checkoutId));
}
