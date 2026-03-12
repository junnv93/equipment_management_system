import { apiClient } from './api-client';
import { transformSingleResponse } from './utils/response-transformers';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type { DisposalRequest, DisposalReason } from '@equipment-management/schemas';

// Request disposal (with FormData for file uploads)
export async function requestDisposal(
  equipmentId: string,
  data: { reason: DisposalReason; reasonDetail: string; attachments?: File[] }
): Promise<DisposalRequest> {
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
    return transformSingleResponse<DisposalRequest>(response);
  }

  const response = await apiClient.post(
    API_ENDPOINTS.EQUIPMENT.DISPOSAL.REQUEST(equipmentId),
    { reason: data.reason, reasonDetail: data.reasonDetail },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  return transformSingleResponse<DisposalRequest>(response);
}

// Review disposal (technical manager)
export async function reviewDisposal(
  equipmentId: string,
  data: { version: number; decision: 'approve' | 'reject'; opinion: string }
): Promise<DisposalRequest> {
  const response = await apiClient.post(API_ENDPOINTS.EQUIPMENT.DISPOSAL.REVIEW(equipmentId), data);
  return transformSingleResponse<DisposalRequest>(response);
}

// Approve disposal (lab manager)
export async function approveDisposal(
  equipmentId: string,
  data: { version: number; decision: 'approve' | 'reject'; comment?: string }
): Promise<DisposalRequest> {
  const response = await apiClient.post(
    API_ENDPOINTS.EQUIPMENT.DISPOSAL.APPROVE(equipmentId),
    data
  );
  return transformSingleResponse<DisposalRequest>(response);
}

// Cancel disposal request
export async function cancelDisposalRequest(
  equipmentId: string
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete(API_ENDPOINTS.EQUIPMENT.DISPOSAL.CANCEL(equipmentId));
  return transformSingleResponse<{ success: boolean; message: string }>(response);
}

// Get current disposal request
export async function getCurrentDisposalRequest(
  equipmentId: string
): Promise<DisposalRequest | null> {
  try {
    const response = await apiClient.get(API_ENDPOINTS.EQUIPMENT.DISPOSAL.CURRENT(equipmentId));
    return transformSingleResponse<DisposalRequest | null>(response);
  } catch (error: unknown) {
    // 404 is expected when there's no disposal request - return null
    if ((error as { response?: { status?: number } }).response?.status === 404) {
      return null;
    }
    throw error;
  }
}

const disposalApi = {
  requestDisposal,
  reviewDisposal,
  approveDisposal,
  cancelDisposalRequest,
  getCurrentDisposalRequest,
};

export default disposalApi;
