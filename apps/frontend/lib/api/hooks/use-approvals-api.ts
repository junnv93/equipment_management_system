/**
 * Approvals API Hook (Best Practice)
 *
 * useAuthenticatedClient를 사용하여 인증된 API 호출
 * - 세션 준비 타이밍 이슈 해결
 * - 매 요청마다 getSession() 호출 불필요
 * - 토큰 갱신 시 자동 반영
 */

import { useCallback } from 'react';
import { useAuthenticatedClient } from '../authenticated-client-provider';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type { UserRole } from '@equipment-management/schemas';
import type {
  ApprovalCategory,
  ApprovalItem,
  PendingCountsByCategory,
  BulkActionResult,
} from '../approvals-api';

export function useApprovalsApi() {
  const client = useAuthenticatedClient();

  /**
   * 카테고리별 승인 대기 개수 조회
   */
  const getPendingCounts = useCallback(
    async (_role?: UserRole): Promise<PendingCountsByCategory> => {
      try {
        const response = await client.get<PendingCountsByCategory>(API_ENDPOINTS.APPROVALS.COUNTS);
        return (
          response.data || {
            outgoing: 0,
            incoming: 0,
            equipment: 0,
            calibration: 0,
            inspection: 0,
            nonconformity: 0,
            disposal_review: 0,
            disposal_final: 0,
            plan_review: 0,
            plan_final: 0,
            software: 0,
          }
        );
      } catch (error) {
        console.error('Failed to fetch approval counts:', error);
        return {
          outgoing: 0,
          incoming: 0,
          equipment: 0,
          calibration: 0,
          inspection: 0,
          nonconformity: 0,
          disposal_review: 0,
          disposal_final: 0,
          plan_review: 0,
          plan_final: 0,
          software: 0,
        };
      }
    },
    [client]
  );

  /**
   * 카테고리별 승인 대기 목록 조회
   */
  const getPendingItems = useCallback(
    async (category: ApprovalCategory, userTeamId?: string): Promise<ApprovalItem[]> => {
      try {
        const params = userTeamId ? { teamId: userTeamId } : {};
        const response = await client.get<ApprovalItem[]>(`/api/approvals/${category}/pending`, {
          params,
        });
        return response.data || [];
      } catch (error) {
        console.error(`Failed to fetch pending items for ${category}:`, error);
        return [];
      }
    },
    [client]
  );

  /**
   * 승인 처리
   */
  const approve = useCallback(
    async (
      category: ApprovalCategory,
      id: string,
      userId: string,
      reason?: string,
      equipmentId?: string
    ): Promise<void> => {
      const payload: Record<string, unknown> = { approverId: userId };
      if (reason) payload.reason = reason;
      if (equipmentId) payload.equipmentId = equipmentId;

      await client.post(`/api/approvals/${category}/${id}/approve`, payload);
    },
    [client]
  );

  /**
   * 반려 처리
   */
  const reject = useCallback(
    async (
      category: ApprovalCategory,
      id: string,
      userId: string,
      reason: string,
      equipmentId?: string
    ): Promise<void> => {
      const payload: Record<string, unknown> = { rejectorId: userId, reason };
      if (equipmentId) payload.equipmentId = equipmentId;

      await client.post(`/api/approvals/${category}/${id}/reject`, payload);
    },
    [client]
  );

  /**
   * 일괄 승인 처리
   */
  const bulkApprove = useCallback(
    async (
      category: ApprovalCategory,
      ids: string[],
      userId: string
    ): Promise<BulkActionResult> => {
      try {
        const response = await client.post<BulkActionResult>(
          `/api/approvals/${category}/bulk-approve`,
          { ids, approverId: userId }
        );
        return response.data || { success: [], failed: [] };
      } catch (error) {
        console.error('Bulk approve failed:', error);
        return { success: [], failed: ids };
      }
    },
    [client]
  );

  /**
   * 일괄 반려 처리
   */
  const bulkReject = useCallback(
    async (
      category: ApprovalCategory,
      ids: string[],
      userId: string,
      reason: string
    ): Promise<BulkActionResult> => {
      try {
        const response = await client.post<BulkActionResult>(
          `/api/approvals/${category}/bulk-reject`,
          { ids, rejectorId: userId, reason }
        );
        return response.data || { success: [], failed: [] };
      } catch (error) {
        console.error('Bulk reject failed:', error);
        return { success: [], failed: ids };
      }
    },
    [client]
  );

  return {
    getPendingCounts,
    getPendingItems,
    approve,
    reject,
    bulkApprove,
    bulkReject,
  };
}
