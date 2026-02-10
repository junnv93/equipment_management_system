/**
 * Approvals API Hook (Best Practice)
 *
 * ✅ SSOT 준수: approvalsApi 클래스의 래퍼로 동작
 * - 기존 approvalsApi 클래스가 올바른 엔드포인트 호출 로직 보유
 * - 이 hook은 React 컴포넌트에서 사용하기 위한 인터페이스만 제공
 * - 실제 API 호출은 approvalsApi에 위임 (DRY 원칙)
 *
 * ⚠️ Note: 기존 코드와 달리 authenticated client를 사용하지 않음
 * - approvalsApi 클래스가 이미 apiClient 사용 (api-client.ts에서 세션 처리)
 * - 중복 인증 레이어 제거
 */

import { useCallback } from 'react';
import approvalsApi from '../approvals-api';
import type { UserRole } from '@equipment-management/schemas';
import type {
  ApprovalCategory,
  ApprovalItem,
  PendingCountsByCategory,
  BulkActionResult,
} from '../approvals-api';

export function useApprovalsApi() {
  /**
   * 카테고리별 승인 대기 개수 조회
   */
  const getPendingCounts = useCallback(
    async (role?: UserRole): Promise<PendingCountsByCategory> => {
      return approvalsApi.getPendingCounts(role);
    },
    []
  );

  /**
   * 카테고리별 승인 대기 목록 조회
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
      equipmentId?: string
    ): Promise<void> => {
      return approvalsApi.approve(category, id, userId, reason, equipmentId);
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
      equipmentId?: string
    ): Promise<void> => {
      return approvalsApi.reject(category, id, userId, reason, equipmentId);
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
      userId: string
    ): Promise<BulkActionResult> => {
      return approvalsApi.bulkApprove(category, ids, userId);
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
