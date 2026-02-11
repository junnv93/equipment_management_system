import { apiClient } from './api-client';
import { transformSingleResponse } from './utils/response-transformers';
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
      `/api/equipment/${equipmentId}/disposal/request`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return transformSingleResponse<DisposalRequest>(response);
  }

  const response = await apiClient.post(
    `/api/equipment/${equipmentId}/disposal/request`,
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
  const response = await apiClient.post(`/api/equipment/${equipmentId}/disposal/review`, data);
  return transformSingleResponse<DisposalRequest>(response);
}

// Approve disposal (lab manager)
export async function approveDisposal(
  equipmentId: string,
  data: { version: number; decision: 'approve' | 'reject'; comment?: string }
): Promise<DisposalRequest> {
  const response = await apiClient.post(`/api/equipment/${equipmentId}/disposal/approve`, data);
  return transformSingleResponse<DisposalRequest>(response);
}

// Cancel disposal request
export async function cancelDisposalRequest(
  equipmentId: string
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete(`/api/equipment/${equipmentId}/disposal/request`);
  return transformSingleResponse<{ success: boolean; message: string }>(response);
}

// Get current disposal request
export async function getCurrentDisposalRequest(
  equipmentId: string
): Promise<DisposalRequest | null> {
  try {
    const response = await apiClient.get(`/api/equipment/${equipmentId}/disposal/current`);
    return transformSingleResponse<DisposalRequest | null>(response);
  } catch (error: any) {
    // 404 is expected when there's no disposal request - return null
    if (error.response?.status === 404) {
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
