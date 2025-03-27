import { 
  Reservation, 
  CreateReservationData, 
  UpdateReservationData 
} from '@/lib/types/reservation';
import apiClient from '@/lib/api/client/api-client';

const API_PATH = '/api/v1/reservations';

/**
 * 예약 목록을 조회합니다.
 */
export async function getReservations(params?: Record<string, any>): Promise<Reservation[]> {
  const queryParams = params ? new URLSearchParams(params as any).toString() : '';
  const url = `${API_PATH}${queryParams ? `?${queryParams}` : ''}`;
  
  try {
    const response = await apiClient.get(url);
    return response.data?.data || [];
  } catch (error) {
    console.error('Failed to fetch reservations:', error);
    throw error;
  }
}

/**
 * 특정 ID의 예약을 조회합니다.
 */
export async function getReservation(id: string): Promise<Reservation> {
  try {
    const response = await apiClient.get(`${API_PATH}/${id}`);
    return response.data?.data;
  } catch (error) {
    console.error(`Failed to fetch reservation with id ${id}:`, error);
    throw error;
  }
}

/**
 * 새 예약을 생성합니다.
 */
export async function createReservation(data: CreateReservationData): Promise<Reservation> {
  try {
    const response = await apiClient.post(API_PATH, data);
    return response.data?.data;
  } catch (error) {
    console.error('Failed to create reservation:', error);
    throw error;
  }
}

/**
 * 기존 예약을 수정합니다.
 */
export async function updateReservation(id: string, data: UpdateReservationData): Promise<Reservation> {
  try {
    const response = await apiClient.patch(`${API_PATH}/${id}`, data);
    return response.data?.data;
  } catch (error) {
    console.error(`Failed to update reservation with id ${id}:`, error);
    throw error;
  }
}

/**
 * 예약을 삭제합니다.
 */
export async function deleteReservation(id: string): Promise<void> {
  try {
    await apiClient.delete(`${API_PATH}/${id}`);
  } catch (error) {
    console.error(`Failed to delete reservation with id ${id}:`, error);
    throw error;
  }
}

/**
 * 예약을 승인합니다.
 */
export async function approveReservation(id: string, notes?: string): Promise<Reservation> {
  try {
    const response = await apiClient.post(`${API_PATH}/${id}/approve`, { notes });
    return response.data?.data;
  } catch (error) {
    console.error(`Failed to approve reservation with id ${id}:`, error);
    throw error;
  }
}

/**
 * 예약을 거부합니다.
 */
export async function rejectReservation(id: string, notes: string): Promise<Reservation> {
  try {
    const response = await apiClient.post(`${API_PATH}/${id}/reject`, { notes });
    return response.data?.data;
  } catch (error) {
    console.error(`Failed to reject reservation with id ${id}:`, error);
    throw error;
  }
}

/**
 * 예약을 취소합니다.
 */
export async function cancelReservation(id: string): Promise<Reservation> {
  try {
    const response = await apiClient.post(`${API_PATH}/${id}/cancel`);
    return response.data?.data;
  } catch (error) {
    console.error(`Failed to cancel reservation with id ${id}:`, error);
    throw error;
  }
}

/**
 * 예약을 완료하고 장비를 반납합니다.
 */
export async function completeReservation(id: string): Promise<Reservation> {
  try {
    const response = await apiClient.post(`${API_PATH}/${id}/complete`);
    return response.data?.data;
  } catch (error) {
    console.error(`Failed to complete reservation with id ${id}:`, error);
    throw error;
  }
} 