/**
 * Approvals API Hook (Best Practice)
 *
 * ✅ HYBRID 접근: 중요한 메서드는 AuthenticatedClient 사용
 * - getPendingCounts, getPendingItems: useAuthenticatedClient 사용 (타이밍 안전)
 * - approve, reject, bulk*: approvalsApi 위임 (복잡한 로직 재사용)
 *
 * 이유:
 * - approvalsApi 클래스가 내부적으로 apiClient 사용 (getSession 타이밍 이슈)
 * - 조회(GET) 메서드는 authenticated client로 직접 호출
 * - 액션(POST/PATCH) 메서드는 기존 로직 재사용 (점진적 마이그레이션)
 */

import { useCallback } from 'react';
import { useAuthenticatedClient } from '../authenticated-client-provider';
import approvalsApi from '../approvals-api';
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
   * ✅ AuthenticatedClient 사용: 세션 타이밍 안전
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
   * ✅ approvalsApi 위임: 복잡한 카테고리별 엔드포인트 매핑 로직 재사용
   */
  const getPendingItems = useCallback(
    async (category: ApprovalCategory, userTeamId?: string): Promise<ApprovalItem[]> => {
      return approvalsApi.getPendingItems(category, userTeamId);
    },
    []
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
      equipmentId?: string,
      originalData?: unknown
    ): Promise<void> => {
      return approvalsApi.approve(category, id, userId, reason, equipmentId, originalData);
    },
    []
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
      equipmentId?: string,
      originalData?: unknown
    ): Promise<void> => {
      return approvalsApi.reject(category, id, userId, reason, equipmentId, originalData);
    },
    []
  );

  /**
   * 일괄 승인 처리
   */
  const bulkApprove = useCallback(
    async (
      category: ApprovalCategory,
      ids: string[],
      userId: string,
      comment?: string
    ): Promise<BulkActionResult> => {
      return approvalsApi.bulkApprove(category, ids, userId, comment);
    },
    []
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
      return approvalsApi.bulkReject(category, ids, userId, reason);
    },
    []
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
