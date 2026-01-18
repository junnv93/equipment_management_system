import axios from 'axios';
import type { SingleResourceResponse } from '@equipment-management/schemas';
import { transformPaginatedResponse, transformSingleResponse } from './utils/response-transformers';
import type { PaginatedResponse } from './types';

export interface Rental {
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
  requestDate: string;
  startDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue' | 'return_requested';
  purpose: string;
  approvedById?: string;
  approvedBy?: {
    id: string;
    name: string;
    email: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentalHistory extends Rental {
  returnCondition?: string;
  returnNotes?: string;
}

// ✅ Single Source of Truth: 공통 타입 사용
// PaginatedResponse는 lib/api/types.ts에서 import

export interface RentalQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  userId?: string;
  equipmentId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CreateRentalDto {
  equipmentId: string;
  startDate?: string; // ISO 형식, 선택 (서버에서 자동 설정 가능)
  expectedEndDate: string; // ✅ 백엔드 필드명에 맞게 수정 (expectedReturnDate → expectedEndDate)
  purpose: string;
  location?: string; // ✅ 백엔드에 있는 필드 추가
  notes?: string;
  // userId는 서버에서 JWT에서 자동으로 가져오므로 프론트엔드에서 보내지 않음
}

export interface UpdateRentalDto {
  startDate?: string;
  expectedReturnDate?: string;
  purpose?: string;
  notes?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue';
}

export interface ReturnRentalDto {
  actualReturnDate: string;
  returnCondition?: string;
  returnNotes?: string;
}

export interface RentalSummary {
  total: number;
  pending: number;
  approved: number;
  overdue: number;
  returnedToday: number;
}

export interface ReturnRequestDto {
  returnCondition: string;
  returnNotes?: string;
}

export interface ApproveReturnDto {
  status: 'approved' | 'rejected';
  approverId: string;
  notes?: string;
}

// 상태 타입 정의
export type RentalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'returned'
  | 'overdue'
  | 'return_requested';

const rentalApi = {
  /**
   * 대여 목록을 조회합니다.
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async getRentals(query: RentalQuery = {}): Promise<PaginatedResponse<Rental>> {
    const queryParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const url = `/api/rentals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await axios.get(url);
    // ✅ 공통 유틸리티 사용: 백엔드 응답을 프론트엔드 형식으로 변환
    return transformPaginatedResponse<Rental>(response);
  },

  /**
   * 특정 대여 정보를 조회합니다.
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async getRental(id: string): Promise<Rental> {
    const response = await axios.get(`/api/rentals/${id}`);
    // ✅ 공통 유틸리티 사용: 백엔드 응답을 프론트엔드 형식으로 변환
    return transformSingleResponse<Rental>(response);
  },

  /**
   * 특정 사용자의 대여 이력을 조회합니다.
   */
  async getUserRentals(
    userId: string,
    query: RentalQuery = {}
  ): Promise<PaginatedResponse<Rental>> {
    const queryParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const url = `/api/users/${userId}/rentals?${queryParams.toString()}`;
    const response = await axios.get(url);
    return response.data;
  },

  /**
   * 특정 장비의 대여 이력을 조회합니다.
   */
  async getEquipmentRentals(
    equipmentId: string,
    query: RentalQuery = {}
  ): Promise<PaginatedResponse<Rental>> {
    const queryParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const url = `/api/equipment/${equipmentId}/rentals?${queryParams.toString()}`;
    const response = await axios.get(url);
    return response.data;
  },

  /**
   * 새 대여 요청을 생성합니다.
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async createRental(data: CreateRentalDto): Promise<Rental> {
    const response = await axios.post('/api/rentals', data);
    return transformSingleResponse<Rental>(response);
  },

  /**
   * 대여 정보를 업데이트합니다.
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async updateRental(id: string, data: UpdateRentalDto): Promise<Rental> {
    const response = await axios.patch(`/api/rentals/${id}`, data);
    return transformSingleResponse<Rental>(response);
  },

  /**
   * 대여 요청을 승인합니다.
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async approveRental(id: string, approverId: string): Promise<Rental> {
    const response = await axios.patch(`/api/rentals/${id}/approve`, { approverId });
    return transformSingleResponse<Rental>(response);
  },

  /**
   * 대여 요청을 거부합니다.
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async rejectRental(id: string, reason: string, approverId?: string): Promise<Rental> {
    const response = await axios.patch(`/api/rentals/${id}/reject`, { reason, approverId });
    return transformSingleResponse<Rental>(response);
  },

  /**
   * 장비 반납을 처리합니다.
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async completeRental(id: string): Promise<Rental> {
    const response = await axios.patch(`/api/rentals/${id}/complete`);
    return transformSingleResponse<Rental>(response);
  },

  /**
   * @deprecated returnRental은 completeRental로 대체되었습니다.
   * 장비 반납을 처리합니다. (레거시 호환성)
   */
  async returnRental(id: string, data: ReturnRentalDto): Promise<Rental> {
    // ✅ 백엔드에는 return 엔드포인트가 없고 complete만 있음
    return this.completeRental(id);
  },

  /**
   * 대여 요약 정보를 조회합니다.
   * ⚠️ 백엔드에 엔드포인트가 없음 - findAll로 대체하거나 백엔드에 구현 필요
   */
  async getRentalSummary(): Promise<RentalSummary> {
    // ✅ 백엔드에 summary 엔드포인트가 없으므로 findAll로 대체
    const response = await this.getRentals({ pageSize: 1 });
    // 간단한 요약 정보 생성 (실제로는 백엔드에서 제공해야 함)
    return {
      total: response.meta.pagination.total,
      pending: 0, // findAll에 status 필터로 조회 필요
      approved: 0,
      overdue: 0,
      returnedToday: 0,
    };
  },

  /**
   * 기한이 지난 대여 목록을 조회합니다.
   * ✅ 백엔드에 엔드포인트가 없으므로 findAll에 필터로 처리
   * ✅ 공통 메서드 재사용: 중복 제거
   */
  async getOverdueRentals(query: RentalQuery = {}): Promise<PaginatedResponse<Rental>> {
    return this.getRentals({ ...query, status: 'overdue' });
  },

  /**
   * 오늘 반납 예정인 대여 목록을 조회합니다.
   * ✅ 백엔드에 엔드포인트가 없으므로 findAll에 필터로 처리
   * ✅ 공통 메서드 재사용: 중복 제거
   */
  async getTodayReturns(query: RentalQuery = {}): Promise<PaginatedResponse<Rental>> {
    const today = new Date().toISOString().split('T')[0];
    return this.getRentals({ ...query, endDate: today });
  },

  /**
   * 사용자가 장비 반납을 요청합니다.
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async requestReturn(id: string, data: ReturnRequestDto): Promise<Rental> {
    const response = await axios.post(`/api/rentals/${id}/request-return`, data);
    return transformSingleResponse<Rental>(response);
  },

  /**
   * 반납 요청을 승인하거나 거절합니다.
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async approveReturn(id: string, data: ApproveReturnDto): Promise<Rental> {
    const response = await axios.patch(`/api/rentals/${id}/approve-return`, data);
    return transformSingleResponse<Rental>(response);
  },
};

export default rentalApi;
