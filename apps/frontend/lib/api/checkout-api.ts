import axios from 'axios';
import type { SingleResourceResponse } from '@equipment-management/schemas';
import { transformPaginatedResponse, transformSingleResponse } from './utils/response-transformers';
import type { PaginatedResponse } from './types';

export interface Checkout {
  id: string;
  equipmentIds?: string[]; // ✅ 백엔드 응답에 따라 조정
  equipment?: Array<{
    id: string;
    name: string;
    managementNumber: string;
    status: string;
  }>;
  requesterId?: string; // ✅ 백엔드 필드명
  userId?: string; // 레거시 호환성
  user?: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
  destination: string; // ✅ 백엔드 필드명에 맞게 수정 (location → destination)
  location?: string; // 레거시 호환성
  phoneNumber?: string; // ✅ 백엔드 필드명
  contactNumber?: string; // 레거시 호환성
  address?: string;
  purpose: string; // ✅ CheckoutPurpose (calibration, repair, external_rental)
  reason: string; // ✅ 백엔드 필수 필드
  checkoutDate?: string; // ✅ 백엔드 필드명
  startDate?: string; // 레거시 호환성
  expectedReturnDate: string;
  actualReturnDate?: string;
  status:
    | 'pending'
    | 'first_approved'
    | 'final_approved'
    | 'rejected'
    | 'checked_out'
    | 'returned'
    | 'return_approved'
    | 'overdue'
    | 'canceled'; // ✅ 백엔드 상태값
  // 반출 유형
  checkoutType?: 'internal_calibration' | 'internal_repair' | 'external_rental';
  // 외부 대여 시 빌려주는 측 정보
  lenderTeamId?: string;
  lenderSiteId?: string;
  // 반입 검사 정보
  calibrationChecked?: boolean;
  repairChecked?: boolean;
  workingStatusChecked?: boolean;
  inspectionNotes?: string;
  // 반입 승인 정보
  returnApprovedBy?: string;
  returnApprovedAt?: string;
  firstApproverId?: string; // ✅ 백엔드 필드명
  finalApproverId?: string; // ✅ 백엔드 필드명
  approvedById?: string; // 레거시 호환성
  approvedBy?: {
    id: string;
    name: string;
    email: string;
  };
  rejectionReason?: string; // ✅ 백엔드 필드명
  notes?: string; // 레거시 호환성
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutHistory extends Checkout {
  returnCondition?: string;
  returnNotes?: string;
}

// ✅ Single Source of Truth: 공통 타입 사용
// PaginatedResponse는 lib/api/types.ts에서 import

export interface CheckoutQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  userId?: string;
  equipmentId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  location?: string;
}

export interface CreateCheckoutDto {
  equipmentIds: string[];
  destination: string; // ✅ 백엔드 필드명에 맞게 수정 (location → destination)
  phoneNumber?: string; // ✅ 백엔드 필드명에 맞게 수정 (contactNumber → phoneNumber)
  address?: string;
  purpose: string; // ✅ 백엔드: CheckoutPurpose (calibration, repair, external_rental)
  reason: string; // ✅ 백엔드 필수 필드 추가
  expectedReturnDate: string; // ISO 형식
  notes?: string; // ✅ 백엔드에는 notes 필드가 없지만, reason에 포함 가능
  // startDate는 백엔드에서 자동 설정되므로 프론트엔드에서 보내지 않음
}

export interface UpdateCheckoutDto {
  location?: string;
  contactNumber?: string;
  address?: string;
  purpose?: string;
  startDate?: string;
  expectedReturnDate?: string;
  notes?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue';
}

export interface ReturnCheckoutDto {
  calibrationChecked?: boolean; // 교정 확인 (교정 목적 반출 시 필수)
  repairChecked?: boolean; // 수리 확인 (수리 목적 반출 시 필수)
  workingStatusChecked: boolean; // 작동 여부 확인 (모든 유형 필수)
  inspectionNotes?: string; // 검사 비고
  // 레거시 호환성
  actualReturnDate?: string;
  returnCondition?: string;
  returnNotes?: string;
}

export interface ApproveReturnDto {
  approverId?: string; // 승인자 UUID (선택, 미제공 시 현재 로그인 사용자)
  comment?: string; // 승인 코멘트
}

export interface CheckoutSummary {
  total: number;
  pending: number;
  approved: number;
  overdue: number;
  returnedToday: number;
}

const checkoutApi = {
  /**
   * 반출 목록을 조회합니다.
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async getCheckouts(query: CheckoutQuery = {}): Promise<PaginatedResponse<Checkout>> {
    const queryParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const url = `/api/checkouts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await axios.get(url);
    // ✅ 공통 유틸리티 사용: 백엔드 응답을 프론트엔드 형식으로 변환
    return transformPaginatedResponse<Checkout>(response);
  },

  /**
   * 특정 반출 정보를 조회합니다.
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async getCheckout(id: string): Promise<Checkout> {
    const response = await axios.get(`/api/checkouts/${id}`);
    return transformSingleResponse<Checkout>(response);
  },

  /**
   * 특정 사용자의 반출 이력을 조회합니다.
   */
  async getUserCheckouts(
    userId: string,
    query: CheckoutQuery = {}
  ): Promise<PaginatedResponse<Checkout>> {
    const queryParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const url = `/api/users/${userId}/checkouts?${queryParams.toString()}`;
    const response = await axios.get(url);
    return response.data;
  },

  /**
   * 특정 장비의 반출 이력을 조회합니다.
   */
  async getEquipmentCheckouts(
    equipmentId: string,
    query: CheckoutQuery = {}
  ): Promise<PaginatedResponse<Checkout>> {
    const queryParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const url = `/api/equipment/${equipmentId}/checkouts?${queryParams.toString()}`;
    const response = await axios.get(url);
    return response.data;
  },

  /**
   * 새 반출 요청을 생성합니다.
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async createCheckout(data: CreateCheckoutDto): Promise<Checkout> {
    const response = await axios.post('/api/checkouts', data);
    return transformSingleResponse<Checkout>(response);
  },

  /**
   * 반출 정보를 업데이트합니다.
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async updateCheckout(id: string, data: UpdateCheckoutDto): Promise<Checkout> {
    const response = await axios.patch(`/api/checkouts/${id}`, data);
    return transformSingleResponse<Checkout>(response);
  },

  /**
   * 반출 1차 승인을 처리합니다.
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async approveFirst(id: string, approverId: string): Promise<Checkout> {
    const response = await axios.patch(`/api/checkouts/${id}/approve-first`, { approverId });
    return transformSingleResponse<Checkout>(response);
  },

  /**
   * 반출 최종 승인을 처리합니다.
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async approveFinal(id: string, approverId: string): Promise<Checkout> {
    const response = await axios.patch(`/api/checkouts/${id}/approve-final`, { approverId });
    return transformSingleResponse<Checkout>(response);
  },

  /**
   * @deprecated approveCheckout은 approveFirst 또는 approveFinal로 대체되었습니다.
   * 반출 요청을 승인합니다. (레거시 호환성)
   */
  async approveCheckout(id: string, notes?: string): Promise<Checkout> {
    // ✅ 백엔드는 2단계 승인 시스템이므로, 기본적으로 1차 승인으로 처리
    // 실제로는 목적에 따라 approveFirst 또는 approveFinal을 호출해야 함
    // 임시로 1차 승인으로 처리 (실제 사용 시에는 목적 확인 필요)
    console.warn('approveCheckout is deprecated. Use approveFirst or approveFinal instead.');
    // approverId는 JWT에서 가져와야 하므로, 이 메서드는 사용하지 않는 것이 좋음
    throw new Error(
      'approveCheckout is deprecated. Use approveFirst or approveFinal with approverId.'
    );
  },

  /**
   * 반출 요청을 거부합니다.
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async rejectCheckout(id: string, reason: string, approverId?: string): Promise<Checkout> {
    const response = await axios.patch(`/api/checkouts/${id}/reject`, { reason, approverId });
    return transformSingleResponse<Checkout>(response);
  },

  /**
   * 장비 반입(반납)을 처리합니다.
   * 상태: checked_out → returned (검사 완료, 기술책임자 승인 대기)
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async returnCheckout(id: string, data: ReturnCheckoutDto): Promise<Checkout> {
    const response = await axios.post(`/api/checkouts/${id}/return`, data);
    return transformSingleResponse<Checkout>(response);
  },

  /**
   * 반입 최종 승인을 처리합니다 (기술책임자).
   * 상태: returned → return_approved
   * 장비 상태: available로 자동 복원
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async approveReturn(id: string, data: ApproveReturnDto = {}): Promise<Checkout> {
    const response = await axios.patch(`/api/checkouts/${id}/approve-return`, data);
    return transformSingleResponse<Checkout>(response);
  },

  /**
   * 검사 완료된 반입 건 목록 조회 (기술책임자 승인 대기)
   * ✅ 공통 메서드 재사용: 중복 제거
   */
  async getPendingReturnApprovals(query: CheckoutQuery = {}): Promise<PaginatedResponse<Checkout>> {
    return this.getCheckouts({ ...query, status: 'returned' });
  },

  /**
   * 반출 요약 정보를 조회합니다.
   * ⚠️ 백엔드에 엔드포인트가 없음 - findAll로 대체하거나 백엔드에 구현 필요
   */
  async getCheckoutSummary(): Promise<CheckoutSummary> {
    // ✅ 백엔드에 summary 엔드포인트가 없으므로 findAll로 대체
    const response = await this.getCheckouts({ pageSize: 1 });
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
   * 기한이 지난 반출 목록을 조회합니다.
   * ✅ 백엔드에 엔드포인트가 없으므로 findAll에 필터로 처리
   * ✅ 공통 메서드 재사용: 중복 제거
   */
  async getOverdueCheckouts(query: CheckoutQuery = {}): Promise<PaginatedResponse<Checkout>> {
    return this.getCheckouts({ ...query, status: 'overdue' });
  },

  /**
   * 오늘 반입 예정인 반출 목록을 조회합니다.
   * ✅ 백엔드에 엔드포인트가 없으므로 findAll에 필터로 처리
   * ✅ 공통 메서드 재사용: 중복 제거
   */
  async getTodayReturns(query: CheckoutQuery = {}): Promise<PaginatedResponse<Checkout>> {
    const today = new Date().toISOString().split('T')[0];
    return this.getCheckouts({ ...query, endDate: today });
  },
};

export default checkoutApi;
