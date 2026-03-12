/**
 * ============================================================================
 * Disposal API - Server Component 버전
 * ============================================================================
 *
 * ⚠️ IMPORTANT: Server Component 전용
 *
 * 이 파일은 Next.js Server Components에서만 사용됩니다.
 * - getServerSession()을 통한 인증
 * - async/await 직접 사용 가능
 * - React Query 불필요
 * - React.cache()로 동일 요청 내 중복 fetch 방지
 *
 * 사용 예시:
 *   // app/equipment/[id]/page.tsx
 *   import * as disposalApi from '@/lib/api/disposal-api-server';
 *
 *   export default async function Page(props: PageProps) {
 *     const { id } = await props.params;
 *     const disposalRequest = await disposalApi.getCurrentDisposalRequest(id);
 *     return <EquipmentDetailClient disposalRequest={disposalRequest} />;
 *   }
 *
 * Client Component에서는 기존 disposal-api.ts를 사용하세요.
 * ============================================================================
 */

import { cache } from 'react';
import { createServerApiClient } from './server-api-client';
import { transformSingleResponse } from './utils/response-transformers';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type { DisposalRequest, DisposalReason } from '@equipment-management/schemas';

// Re-export types for convenience
export type { DisposalRequest, DisposalReason } from '@equipment-management/schemas';

/**
 * Server Component용 Disposal API 메서드들
 *
 * 각 함수 호출 시 새로운 apiClient를 생성하여 세션을 가져옵니다.
 * 이는 Server Component에서 매 요청마다 새로운 세션을 사용해야 하기 때문입니다.
 */

// ========== Cached Internal Functions ==========

/**
 * 현재 폐기 요청 조회 (React.cache 적용)
 */
const getCurrentDisposalRequestCached = cache(async (equipmentId: string) => {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get(API_ENDPOINTS.EQUIPMENT.DISPOSAL.CURRENT(equipmentId));
  return transformSingleResponse<DisposalRequest | null>(response);
});

// ========== Public API Methods ==========

/**
 * 현재 폐기 요청 조회 (Server Component용)
 *
 * ✅ 인증된 사용자만 조회 가능 (Permission.VIEW_EQUIPMENT 필요)
 * ✅ React.cache로 동일 요청 내 중복 fetch 방지
 *
 * @param equipmentId - 장비 UUID
 * @returns Promise<DisposalRequest | null> - 진행 중인 폐기 요청 또는 null
 */
export async function getCurrentDisposalRequest(
  equipmentId: string
): Promise<DisposalRequest | null> {
  return getCurrentDisposalRequestCached(equipmentId);
}

/**
 * 폐기 요청 생성 (Server Component용)
 *
 * @param equipmentId - 장비 UUID
 * @param data - 폐기 사유 및 상세 정보
 * @returns Promise<{ success: boolean; disposalRequest: DisposalRequest }>
 */
export async function requestDisposal(
  equipmentId: string,
  data: { reason: DisposalReason; reasonDetail: string; attachments?: File[] }
): Promise<{ success: boolean; disposalRequest: DisposalRequest }> {
  const apiClient = await createServerApiClient();

  if (data.attachments && data.attachments.length > 0) {
    const formData = new FormData();
    formData.append('reason', data.reason);
    formData.append('reasonDetail', data.reasonDetail);
    data.attachments.forEach((file) => formData.append('attachments', file));

    const response = await apiClient.post(
      API_ENDPOINTS.EQUIPMENT.DISPOSAL.REQUEST(equipmentId),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  }

  const response = await apiClient.post(API_ENDPOINTS.EQUIPMENT.DISPOSAL.REQUEST(equipmentId), {
    reason: data.reason,
    reasonDetail: data.reasonDetail,
  });
  return response.data;
}

/**
 * 폐기 검토 (기술책임자)
 */
export async function reviewDisposal(
  equipmentId: string,
  data: { decision: 'approve' | 'reject'; opinion: string }
): Promise<{ success: boolean }> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.post(API_ENDPOINTS.EQUIPMENT.DISPOSAL.REVIEW(equipmentId), data);
  return response.data;
}

/**
 * 폐기 최종 승인 (시험소장)
 */
export async function approveDisposal(
  equipmentId: string,
  data: { decision: 'approve' | 'reject'; comment?: string }
): Promise<{ success: boolean }> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.post(
    API_ENDPOINTS.EQUIPMENT.DISPOSAL.APPROVE(equipmentId),
    data
  );
  return response.data;
}

/**
 * 폐기 요청 취소
 */
export async function cancelDisposalRequest(equipmentId: string): Promise<{ success: boolean }> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.delete(API_ENDPOINTS.EQUIPMENT.DISPOSAL.CANCEL(equipmentId));
  return response.data;
}

const disposalApiServer = {
  getCurrentDisposalRequest,
  requestDisposal,
  reviewDisposal,
  approveDisposal,
  cancelDisposalRequest,
};

export default disposalApiServer;
