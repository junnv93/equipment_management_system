import axios from 'axios';
import type { SingleResourceResponse } from '@equipment-management/schemas';
import { transformPaginatedResponse, transformSingleResponse } from './utils/response-transformers';
import type { PaginatedResponse } from './types';

// 스키마 타입을 직접 정의
export interface Reservation {
  id: string;
  equipmentId: string;
  equipment?: {
    id: string;
    name: string;
    managementNumber: string;
    status: string;
  };
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
  startDate: string;
  endDate: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  notes?: string;
  approvedById?: string;
  approvedBy?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ExpandedReservation extends Reservation {
  equipment: {
    id: string;
    name: string;
    managementNumber: string;
    status: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
}

export interface CreateReservationDto {
  equipmentId: string;
  startDate: string;
  endDate: string;
  purpose: string;
  notes?: string;
}

export interface UpdateReservationDto {
  startDate?: string;
  endDate?: string;
  purpose?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  notes?: string;
}

export interface ReservationQuery {
  page?: number;
  limit?: number;
  status?: string;
  equipmentId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// ✅ Single Source of Truth: 공통 타입 사용
import type { PaginatedResponse } from './types';

// 예약 관련 API 서비스
const reservationApi = {
  /**
   * 모든 예약 목록을 조회합니다.
   */
  async getReservations(
    query: ReservationQuery = {}
  ): Promise<PaginatedResponse<ExpandedReservation>> {
    const queryParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const url = `/api/reservations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await axios.get(url);
    return response.data;
  },

  /**
   * 특정 예약 정보를 조회합니다.
   */
  async getReservation(id: string): Promise<ExpandedReservation> {
    const response = await axios.get(`/api/reservations/${id}`);
    return response.data.data;
  },

  /**
   * 새 예약을 생성합니다.
   */
  async createReservation(data: CreateReservationDto): Promise<Reservation> {
    const response = await axios.post('/api/reservations', data);
    return response.data.data;
  },

  /**
   * 예약 정보를 수정합니다.
   */
  async updateReservation(id: string, data: UpdateReservationDto): Promise<Reservation> {
    const response = await axios.patch(`/api/reservations/${id}`, data);
    return response.data.data;
  },

  /**
   * 예약을 삭제합니다.
   */
  async deleteReservation(id: string): Promise<void> {
    await axios.delete(`/api/reservations/${id}`);
  },

  /**
   * 예약을 승인합니다.
   */
  async approveReservation(id: string, notes?: string): Promise<Reservation> {
    const response = await axios.post(`/api/reservations/${id}/approve`, { notes });
    return response.data.data;
  },

  /**
   * 예약을 거부합니다.
   */
  async rejectReservation(id: string, reason: string): Promise<Reservation> {
    const response = await axios.post(`/api/reservations/${id}/reject`, { reason });
    return response.data.data;
  },

  /**
   * 특정 장비의 예약 목록을 조회합니다.
   */
  async getEquipmentReservations(
    equipmentId: string,
    query: ReservationQuery = {}
  ): Promise<PaginatedResponse<Reservation>> {
    const queryParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const response = await axios.get(
      `/api/equipment/${equipmentId}/reservations?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * 특정 사용자의 예약 목록을 조회합니다.
   */
  async getUserReservations(
    userId: string,
    query: ReservationQuery = {}
  ): Promise<PaginatedResponse<Reservation>> {
    const queryParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const response = await axios.get(`/api/users/${userId}/reservations?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * 내 예약 목록을 조회합니다.
   */
  async getMyReservations(query: ReservationQuery = {}): Promise<PaginatedResponse<Reservation>> {
    const queryParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const response = await axios.get(`/api/reservations/me?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * 예약을 완료하고 장비를 반납합니다.
   */
  async completeReservation(id: string): Promise<Reservation> {
    const response = await axios.post(`/api/reservations/${id}/complete`);
    return response.data.data;
  },
};

export default reservationApi;
