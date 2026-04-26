import { apiClient } from './api-client';
import {
  transformPaginatedResponse,
  transformSingleResponse,
  transformArrayResponse,
} from './utils/response-transformers';
import type { PaginatedResponse } from './types';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';

// ✅ SSOT: 반출 상태/목적 타입 import
import type {
  CheckoutStatus,
  CheckoutPurpose,
  UserSelectableCheckoutPurpose,
  ConditionCheckStep,
  ConditionStatus,
  AccessoriesStatus,
  NextStepDescriptor,
} from '@equipment-management/schemas';

// ✅ Handover 토큰 타입 (QR Phase 3) — DTO shape은 백엔드와 동일 SSOT 재사용 대상.
// 프론트에서 백엔드 DTO를 직접 import할 수 없으므로 구조만 로컬 재정의.
// 변경 시 apps/backend/.../dto/handover-token.dto.ts와 동기화 필수.
export type HandoverTokenPurpose = 'borrower_receive' | 'borrower_return' | 'lender_receive';

export interface IssueHandoverTokenResponse {
  token: string;
  expiresAt: string;
  purpose: HandoverTokenPurpose;
}

export interface VerifyHandoverTokenResponse {
  checkoutId: string;
  purpose: HandoverTokenPurpose;
}

/**
 * ✅ Phase 2: Server-Driven UI
 * 서버가 계산한 사용자별 가능한 액션
 */
export interface CheckoutAvailableActions {
  canApprove: boolean;
  canReject: boolean;
  canStart: boolean;
  canReturn: boolean;
  canApproveReturn: boolean;
  canRejectReturn: boolean;
  canCancel: boolean;
  canSubmitConditionCheck: boolean;
}

export interface Checkout {
  id: string;
  version: number; // ✅ Phase 1: Optimistic Locking
  equipmentIds?: string[]; // ✅ 백엔드 응답에 따라 조정
  equipment?: Array<{
    id: string;
    name: string;
    managementNumber: string;
    status: string;
  }>;
  requesterId?: string; // ✅ 백엔드 필드명
  user?: {
    id: string;
    name: string;
    email: string;
    department?: string;
    team?: { name: string };
  };
  destination: string; // ✅ 백엔드 필드명
  phoneNumber?: string; // ✅ 백엔드 필드명
  address?: string;
  purpose: CheckoutPurpose;
  reason: string; // ✅ 백엔드 필수 필드
  checkoutDate?: string; // ✅ 백엔드 필드명
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: CheckoutStatus; // ✅ SSOT에서 import한 타입
  // 반출 유형
  checkoutType?: 'calibration' | 'repair' | 'rental';
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
  // 반출 승인 정보
  approverId?: string; // ✅ 백엔드 필드명
  approvedAt?: string; // ✅ 백엔드 필드명
  approvedBy?: {
    id: string;
    name: string;
    email: string;
  };
  rejectionReason?: string; // ✅ 백엔드 필드명
  // 대여 1차 승인 정보 (rental 전용)
  borrowerApproverId?: string;
  borrowerApprovedAt?: string;
  borrowerRejectionReason?: string;
  // 상태 확인 기록 (대여 목적)
  conditionChecks?: ConditionCheck[];
  // ✅ Phase 2: Server-Driven UI - 서버가 계산한 가능한 액션 + 다음 단계
  meta?: {
    availableActions: CheckoutAvailableActions;
    nextStep?: NextStepDescriptor | null;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * 상태 확인 기록 (대여 목적 양측 4단계 확인)
 */
export interface ConditionCheck {
  id: string;
  checkoutId: string;
  step: ConditionCheckStep;
  checkedBy: string;
  checkedAt: string;
  checker?: {
    id: string;
    name: string;
    email: string;
  };
  appearanceStatus: ConditionStatus;
  operationStatus: ConditionStatus;
  accessoriesStatus?: AccessoriesStatus;
  abnormalDetails?: string;
  comparisonWithPrevious?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 상태 확인 등록 DTO
 */
export interface CreateConditionCheckDto {
  version: number; // ✅ Phase 1: Optimistic Locking
  step: ConditionCheckStep;
  appearanceStatus: ConditionStatus;
  operationStatus: ConditionStatus;
  accessoriesStatus?: AccessoriesStatus;
  abnormalDetails?: string;
  comparisonWithPrevious?: string;
  notes?: string;
}

// ✅ Single Source of Truth: 공통 타입 사용
// PaginatedResponse는 lib/api/types.ts에서 import

export interface CheckoutQuery {
  page?: number;
  pageSize?: number;
  statuses?: string;
  equipmentId?: string;
  teamId?: string;
  direction?: 'outbound' | 'inbound';
  purpose?: CheckoutPurpose;
  endDate?: string;
  checkoutFrom?: string; // ✅ 반출일 시작 (YYYY-MM-DD)
  checkoutTo?: string; // ✅ 반출일 종료 (YYYY-MM-DD)
  search?: string;
  destination?: string;
  includeSummary?: boolean; // ✅ 성능 최적화: 요약 정보 포함 여부
}

export interface PendingChecksQuery {
  role?: 'lender' | 'borrower';
  page?: number;
  pageSize?: number;
}

export interface CreateCheckoutDto {
  equipmentIds: string[];
  destination: string; // ✅ 백엔드 필드명에 맞게 수정 (location → destination)
  phoneNumber?: string; // ✅ 백엔드 필드명에 맞게 수정 (contactNumber → phoneNumber)
  address?: string;
  purpose: UserSelectableCheckoutPurpose;
  reason: string; // ✅ 백엔드 필수 필드 추가
  expectedReturnDate: string; // ISO 형식
  notes?: string; // ✅ 백엔드에는 notes 필드가 없지만, reason에 포함 가능
  lenderTeamId?: string; // 외부 대여 시 빌려주는 팀 ID
  lenderSiteId?: string; // 외부 대여 시 빌려주는 사이트 ID
  // startDate는 백엔드에서 자동 설정되므로 프론트엔드에서 보내지 않음
}

export interface UpdateCheckoutDto {
  version: number; // ✅ Phase 1: Optimistic Locking
  destination?: string;
  phoneNumber?: string;
  address?: string;
  reason?: string;
  expectedReturnDate?: string;
  notes?: string;
}

export interface ReturnCheckoutDto {
  version: number; // ✅ Phase 1: Optimistic Locking
  calibrationChecked?: boolean; // 교정 확인 (교정 목적 반출 시 필수)
  repairChecked?: boolean; // 수리 확인 (수리 목적 반출 시 필수)
  workingStatusChecked: boolean; // 작동 여부 확인 (모든 유형 필수)
  inspectionNotes?: string; // 검사 비고
  itemConditions?: Array<{
    equipmentId: string;
    conditionAfter: string;
  }>; // 장비별 반입 후 상태 기록
}

export interface ApproveReturnDto {
  version: number; // ✅ Phase 1: Optimistic Locking
  comment?: string; // 승인 코멘트
  // ✅ Rule 2: approverId는 서버에서 req.user.userId로 추출
}

export interface RejectReturnDto {
  version: number; // ✅ Phase 1: Optimistic Locking
  reason: string; // 반려 사유 (필수)
}

export interface CheckoutSummary {
  total: number;
  pending: number;
  approved: number;
  overdue: number;
  returnedToday: number;
}

/** Sprint 1.1 보장: 서버는 항상 meta를 populate해야 함. 누락 시 FSM drift 감지 로그. */
function warnMetaDrift(checkout: Checkout): void {
  if (checkout.meta === undefined) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[FSM drift] meta missing', checkout.id);
    }
  }
}

const checkoutApi = {
  /**
   * 반출 목록을 조회합니다.
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async getCheckouts(
    query: CheckoutQuery = {}
  ): Promise<PaginatedResponse<Checkout, CheckoutSummary>> {
    const queryParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const url = `${API_ENDPOINTS.CHECKOUTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(url);
    const result = transformPaginatedResponse<Checkout, CheckoutSummary>(response);
    result.data.forEach(warnMetaDrift);
    return result;
  },

  /**
   * 특정 반출 정보를 조회합니다.
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async getCheckout(id: string): Promise<Checkout> {
    const response = await apiClient.get(API_ENDPOINTS.CHECKOUTS.GET(id));
    const checkout = transformSingleResponse<Checkout>(response);
    warnMetaDrift(checkout);
    return checkout;
  },

  /**
   * 특정 장비의 반출 이력을 조회합니다.
   * SSOT: API_ENDPOINTS.EQUIPMENT.CHECKOUTS → /api/equipment/:id/checkouts
   */
  async getEquipmentCheckouts(
    equipmentId: string,
    query: CheckoutQuery = {}
  ): Promise<PaginatedResponse<Checkout, CheckoutSummary>> {
    const queryParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const url = `${API_ENDPOINTS.EQUIPMENT.CHECKOUTS(equipmentId)}?${queryParams.toString()}`;
    const response = await apiClient.get(url);
    return transformPaginatedResponse<Checkout, CheckoutSummary>(response);
  },

  /**
   * 새 반출 요청을 생성합니다.
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async createCheckout(data: CreateCheckoutDto): Promise<Checkout> {
    const response = await apiClient.post(API_ENDPOINTS.CHECKOUTS.CREATE, data);
    return transformSingleResponse<Checkout>(response);
  },

  /**
   * 반출 정보를 업데이트합니다.
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async updateCheckout(id: string, data: UpdateCheckoutDto): Promise<Checkout> {
    const response = await apiClient.patch(API_ENDPOINTS.CHECKOUTS.UPDATE(id), data);
    return transformSingleResponse<Checkout>(response);
  },

  /**
   * 반출 승인을 처리합니다 (1단계 승인 통합).
   * 모든 목적(교정/수리/외부 대여)에 대해 1단계 승인으로 통합되었습니다.
   * approverId는 백엔드에서 세션으로부터 자동 추출됩니다.
   * ✅ Phase 1: Optimistic Locking - version 필수
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async approveCheckout(id: string, version: number, notes?: string): Promise<Checkout> {
    const response = await apiClient.patch(API_ENDPOINTS.CHECKOUTS.APPROVE(id), { version, notes });
    return transformSingleResponse<Checkout>(response);
  },

  /**
   * 반출 요청을 거부합니다.
   * ✅ Phase 1: Optimistic Locking - version 필수
   * ✅ Rule 2: approverId는 서버에서 추출 (클라이언트 미전송)
   */
  async rejectCheckout(id: string, version: number, reason: string): Promise<Checkout> {
    const response = await apiClient.patch(API_ENDPOINTS.CHECKOUTS.REJECT(id), {
      version,
      reason,
    });
    return transformSingleResponse<Checkout>(response);
  },

  /**
   * 대여 반출 1차 승인 (차용 팀 TM)
   * rental 전용. pending → borrower_approved.
   * ✅ Rule 2: approverId는 서버에서 추출
   */
  async borrowerApproveCheckout(id: string, version: number, notes?: string): Promise<Checkout> {
    const response = await apiClient.patch(API_ENDPOINTS.CHECKOUTS.BORROWER_APPROVE(id), {
      version,
      notes,
    });
    return transformSingleResponse<Checkout>(response);
  },

  /**
   * 대여 반출 1차 반려 (차용 팀 TM)
   * rental 전용. pending → rejected (borrowerRejectionReason 기록).
   * ✅ Rule 2: approverId는 서버에서 추출
   */
  async borrowerRejectCheckout(id: string, version: number, reason: string): Promise<Checkout> {
    const response = await apiClient.patch(API_ENDPOINTS.CHECKOUTS.BORROWER_REJECT(id), {
      version,
      reason,
    });
    return transformSingleResponse<Checkout>(response);
  },

  /**
   * 반출 신청을 취소합니다 (신청자 본인 또는 권한 보유자).
   * 상태: pending/approved → canceled
   * ✅ Phase 1: Optimistic Locking - version 필수
   */
  async cancelCheckout(id: string, version: number): Promise<Checkout> {
    const response = await apiClient.patch(API_ENDPOINTS.CHECKOUTS.CANCEL(id), { version });
    return transformSingleResponse<Checkout>(response);
  },

  /**
   * 반출을 시작합니다.
   * 상태: approved → checked_out
   * 장비 상태도 checked_out으로 자동 변경됩니다.
   * ✅ Phase 1: Optimistic Locking - version 필수
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async startCheckout(
    id: string,
    version: number,
    data?: { itemConditions?: Array<{ equipmentId: string; conditionBefore: string }> }
  ): Promise<Checkout> {
    const response = await apiClient.post(API_ENDPOINTS.CHECKOUTS.START(id), { version, ...data });
    return transformSingleResponse<Checkout>(response);
  },

  /**
   * 반출지 목록을 조회합니다.
   * DB에서 사용된 실제 반출지 값들을 반환합니다.
   */
  async getDestinations(): Promise<string[]> {
    const response = await apiClient.get(API_ENDPOINTS.CHECKOUTS.DESTINATIONS);
    return transformArrayResponse<string>(response);
  },

  /**
   * 장비 반입(반납)을 처리합니다.
   * 상태: checked_out → returned (검사 완료, 기술책임자 승인 대기)
   * ✅ Phase 1: Optimistic Locking - version은 data에 포함
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async returnCheckout(id: string, data: ReturnCheckoutDto): Promise<Checkout> {
    const response = await apiClient.post(API_ENDPOINTS.CHECKOUTS.RETURN(id), data);
    return transformSingleResponse<Checkout>(response);
  },

  /**
   * 반입 최종 승인을 처리합니다 (기술책임자).
   * 상태: returned → return_approved
   * 장비 상태: available로 자동 복원
   * ✅ Phase 1: Optimistic Locking - version은 data에 포함
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async approveReturn(id: string, data: ApproveReturnDto): Promise<Checkout> {
    const response = await apiClient.patch(API_ENDPOINTS.CHECKOUTS.APPROVE_RETURN(id), data);
    return transformSingleResponse<Checkout>(response);
  },

  /**
   * 반입을 반려합니다 (기술책임자).
   * 상태: returned → checked_out (재검사/재반입 필요)
   * ✅ Phase 1: Optimistic Locking - version은 data에 포함
   * ✅ Rule 2: approverId는 서버에서 추출 (DTO에 미포함)
   */
  async rejectReturn(id: string, data: RejectReturnDto): Promise<Checkout> {
    const response = await apiClient.patch(API_ENDPOINTS.CHECKOUTS.REJECT_RETURN(id), data);
    return transformSingleResponse<Checkout>(response);
  },

  /**
   * 검사 완료된 반입 건 목록 조회 (기술책임자 승인 대기)
   * ✅ 공통 메서드 재사용: 중복 제거
   */
  async getPendingReturnApprovals(
    query: CheckoutQuery = {}
  ): Promise<PaginatedResponse<Checkout, CheckoutSummary>> {
    return this.getCheckouts({ ...query, statuses: 'returned' });
  },

  /**
   * 기한이 지난 반출 목록을 조회합니다.
   * ✅ 백엔드에 엔드포인트가 없으므로 findAll에 필터로 처리
   * ✅ 공통 메서드 재사용: 중복 제거
   */
  async getOverdueCheckouts(
    query: CheckoutQuery = {}
  ): Promise<PaginatedResponse<Checkout, CheckoutSummary>> {
    return this.getCheckouts({ ...query, statuses: 'overdue' });
  },

  /**
   * 오늘 반입 예정인 반출 목록을 조회합니다.
   * ✅ 백엔드에 엔드포인트가 없으므로 findAll에 필터로 처리
   * ✅ 공통 메서드 재사용: 중복 제거
   */
  async getTodayReturns(
    query: CheckoutQuery = {}
  ): Promise<PaginatedResponse<Checkout, CheckoutSummary>> {
    const today = new Date().toISOString().split('T')[0];
    return this.getCheckouts({ ...query, endDate: today });
  },

  // ============================================================================
  // 대여 목적 양측 4단계 확인 API
  // ============================================================================

  /**
   * 상태 확인을 등록합니다 (대여 목적).
   * 대여 목적 반출 시 양측 4단계 확인을 위한 API입니다.
   * ✅ Phase 1: Optimistic Locking - version은 data에 포함
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async submitConditionCheck(
    checkoutId: string,
    data: CreateConditionCheckDto
  ): Promise<ConditionCheck> {
    const response = await apiClient.post(
      API_ENDPOINTS.CHECKOUTS.CONDITION_CHECK(checkoutId),
      data
    );
    return transformSingleResponse<ConditionCheck>(response);
  },

  /**
   * 특정 반출의 상태 확인 기록을 조회합니다.
   * 대여 목적 반출의 양측 4단계 확인 이력을 조회합니다.
   */
  async getConditionChecks(checkoutId: string): Promise<ConditionCheck[]> {
    const response = await apiClient.get(API_ENDPOINTS.CHECKOUTS.CONDITION_CHECKS(checkoutId));
    return transformArrayResponse<ConditionCheck>(response);
  },

  /**
   * 확인 필요 목록을 조회합니다.
   * 현재 사용자가 확인해야 할 대여 건 목록을 조회합니다.
   * ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
   */
  async getPendingChecks(query: PendingChecksQuery = {}): Promise<PaginatedResponse<Checkout>> {
    const queryParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const url = `${API_ENDPOINTS.CHECKOUTS.PENDING_CHECKS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(url);
    return transformPaginatedResponse<Checkout>(response);
  },

  /**
   * QR 인수인계 토큰 발급 — 10분 TTL, jti 기반 1회용 서명 토큰.
   * 체크아웃 상태에 따라 purpose가 자동 도출되므로 DTO는 선택적.
   */
  issueHandoverToken: async (
    checkoutId: string,
    purpose?: HandoverTokenPurpose
  ): Promise<IssueHandoverTokenResponse> => {
    const response = await apiClient.post(
      API_ENDPOINTS.CHECKOUTS.HANDOVER_TOKEN(checkoutId),
      purpose ? { purpose } : {}
    );
    return transformSingleResponse<IssueHandoverTokenResponse>(response);
  },

  /**
   * QR 인수인계 토큰 검증 + 소비 — `/handover` 중계 페이지가 호출.
   * 성공 시 checkoutId + purpose 반환, 실패 case는 HTTP status로 구분.
   */
  verifyHandoverToken: async (token: string): Promise<VerifyHandoverTokenResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.CHECKOUTS.HANDOVER_VERIFY, {
      token,
    });
    return transformSingleResponse<VerifyHandoverTokenResponse>(response);
  },
};

export default checkoutApi;

// Re-export types for convenience
export type {
  ConditionCheckStep,
  ConditionStatus,
  AccessoriesStatus,
} from '@equipment-management/schemas';
