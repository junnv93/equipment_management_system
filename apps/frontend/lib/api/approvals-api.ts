/**
 * 통합 승인 관리 API
 *
 * ⚠️ SSOT: 이 파일은 기존 개별 API들을 통합하여 승인 관리 페이지에서 사용합니다.
 * - 기존 API 파일들을 재사용 (calibration-api, checkout-api 등)
 * - 역할별 필터링 로직 포함
 *
 * @see docs/development/FRONTEND_UI_PROMPTS(UI-3: 승인 관리 통합 페이지_수정O).md
 */

import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { type UserRole } from '@equipment-management/schemas';
import calibrationApi, { type Calibration } from './calibration-api';
import checkoutApi, { type Checkout } from './checkout-api';
import nonConformancesApi, { type NonConformance } from './non-conformances-api';
import { transformArrayResponse } from './utils/response-transformers';

// ============================================================================
// Disposal API 페이로드 타입 (SSOT: 백엔드 DTO와 일치)
// @see apps/backend/src/modules/equipment/dto/disposal.dto.ts
// ============================================================================

/**
 * 폐기 검토 API 페이로드
 * Backend DTO: ReviewDisposalDto { decision, opinion }
 */
interface DisposalReviewPayload {
  decision: 'approve' | 'reject';
  opinion: string; // 검토 의견 (승인/반려 모두 필수)
}

/**
 * 폐기 최종 승인 API 페이로드
 * Backend DTO: ApproveDisposalDto { decision, comment? }
 */
interface DisposalApprovalPayload {
  decision: 'approve' | 'reject';
  comment?: string; // 승인 코멘트 (선택)
}

// ============================================================================
// 통합 승인 상태 타입 (프론트엔드 로컬 정의)
// Note: packages/schemas/src/enums.ts에 UnifiedApprovalStatus 추가됨
// 패키지 빌드 후 import로 전환 예정
// ============================================================================

/**
 * 통합 승인 상태
 */
export type UnifiedApprovalStatus =
  | 'pending' // 대기 (1단계 승인용)
  | 'pending_review' // 검토 대기 (다단계 1단계)
  | 'reviewed' // 검토 완료 (다단계 2단계 대기)
  | 'approved' // 승인 완료
  | 'rejected'; // 반려

/**
 * 통합 승인 상태 라벨
 */
export const UNIFIED_APPROVAL_STATUS_LABELS: Record<UnifiedApprovalStatus, string> = {
  pending: '대기',
  pending_review: '검토 대기',
  reviewed: '검토 완료',
  approved: '승인 완료',
  rejected: '반려',
};

// ============================================================================
// 승인 카테고리 정의
// ============================================================================

/**
 * 승인 카테고리
 * 프론트엔드에서 탭 분류에 사용
 */
export type ApprovalCategory =
  | 'equipment' // 장비 등록/수정/삭제
  | 'calibration' // 교정 기록
  | 'inspection' // 중간점검
  | 'checkout' // 반출
  | 'return' // 반입
  | 'common_equipment' // 공용/렌탈장비 사용
  | 'nonconformity' // 부적합 장비 사용 재개
  | 'disposal_review' // 장비 폐기 (기술책임자 검토)
  | 'disposal_final' // 장비 폐기 (시험소장 최종)
  | 'plan_review' // 교정계획서 (품질책임자 검토)
  | 'plan_final' // 교정계획서 (시험소장 최종)
  | 'software'; // 소프트웨어 유효성

/**
 * 역할별 탭 설정
 */
export const ROLE_TABS: Record<UserRole, ApprovalCategory[]> = {
  test_engineer: [], // 시험실무자는 승인 권한 없음
  technical_manager: [
    'equipment',
    'calibration',
    'inspection',
    'checkout',
    'return',
    'common_equipment',
    'nonconformity',
    'disposal_review',
  ],
  quality_manager: ['plan_review', 'software'],
  lab_manager: ['disposal_final', 'plan_final'],
};

/**
 * 탭 메타 정보
 */
export const TAB_META: Record<ApprovalCategory, { label: string; icon: string; action: string }> = {
  equipment: { label: '장비', icon: 'Package', action: '승인' },
  calibration: { label: '교정 기록', icon: 'FileCheck', action: '승인' },
  inspection: { label: '중간점검', icon: 'ClipboardCheck', action: '승인' },
  checkout: { label: '반출', icon: 'ArrowUpFromLine', action: '승인' },
  return: { label: '반입', icon: 'ArrowDownToLine', action: '승인' },
  common_equipment: { label: '공용/렌탈', icon: 'Share2', action: '승인' },
  nonconformity: { label: '부적합 재개', icon: 'AlertTriangle', action: '승인' },
  disposal_review: { label: '폐기 검토', icon: 'Trash2', action: '검토완료' },
  disposal_final: { label: '폐기 승인', icon: 'Trash2', action: '승인' },
  plan_review: { label: '교정계획서 검토', icon: 'Calendar', action: '검토완료' },
  plan_final: { label: '교정계획서 승인', icon: 'Calendar', action: '승인' },
  software: { label: '소프트웨어', icon: 'Code', action: '검토완료' },
};

// ============================================================================
// 승인 항목 인터페이스
// ============================================================================

/**
 * 승인 이력 항목
 */
export interface ApprovalHistoryEntry {
  step: number;
  action: 'review' | 'approve' | 'reject';
  actorId: string;
  actorName: string;
  actorRole: string;
  actionAt: string;
  comment?: string;
}

/**
 * 첨부 파일
 */
export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}

/**
 * 통합 승인 항목
 */
export interface ApprovalItem {
  id: string;
  category: ApprovalCategory;
  status: UnifiedApprovalStatus;
  requesterId: string;
  requesterName: string;
  requesterTeam: string;
  requestedAt: string;
  summary: string;
  details: Record<string, unknown>;
  attachments?: Attachment[];
  approvalHistory?: ApprovalHistoryEntry[];
  // 원본 데이터 참조
  originalData?: Calibration | Checkout | unknown;
}

/**
 * 카테고리별 대기 개수
 */
export interface PendingCountsByCategory {
  equipment: number;
  calibration: number;
  inspection: number;
  checkout: number;
  return: number;
  common_equipment: number;
  nonconformity: number;
  disposal_review: number;
  disposal_final: number;
  plan_review: number;
  plan_final: number;
  software: number;
}

// ============================================================================
// 승인 관리 API
// ============================================================================

class ApprovalsApi {
  /**
   * 카테고리별 승인 대기 목록 조회
   */
  async getPendingItems(category: ApprovalCategory, teamId?: string): Promise<ApprovalItem[]> {
    switch (category) {
      case 'calibration':
        return this.getPendingCalibrations(teamId);
      case 'checkout':
        return this.getPendingCheckouts(teamId);
      case 'return':
        return this.getPendingReturns(teamId);
      case 'plan_review':
        return this.getPendingPlanReviews();
      case 'plan_final':
        return this.getPendingPlanFinals();
      case 'equipment':
        return this.getPendingEquipmentApprovals(teamId);
      case 'software':
        return this.getPendingSoftwareApprovals();
      case 'nonconformity':
        return this.getPendingNonConformities();
      case 'inspection':
        return this.getPendingInspections();
      case 'common_equipment':
        return this.getPendingCommonEquipment();
      case 'disposal_review':
        return this.getPendingDisposalReviews();
      case 'disposal_final':
        return this.getPendingDisposalFinals();
      default:
        return [];
    }
  }

  /**
   * 교정 승인 대기 목록 조회
   */
  private async getPendingCalibrations(_teamId?: string): Promise<ApprovalItem[]> {
    try {
      const response = await calibrationApi.getPendingCalibrations();
      // getPendingCalibrations returns { items: Calibration[] }
      const items = response.items || [];

      // Note: teamId 필터링은 별도 장비 조회가 필요하므로 현재는 생략
      return items.map((item: Calibration) => this.mapCalibrationToApprovalItem(item));
    } catch {
      return [];
    }
  }

  /**
   * 반출 승인 대기 목록 조회
   */
  private async getPendingCheckouts(teamId?: string): Promise<ApprovalItem[]> {
    try {
      const response = await checkoutApi.getCheckouts({ status: 'pending' });
      // PaginatedResponse uses 'data' field
      const items = response.data || [];

      return items
        .filter((item: Checkout) => !teamId || this.isOwnTeamCheckout(item, teamId))
        .map((item: Checkout) => this.mapCheckoutToApprovalItem(item, 'checkout'));
    } catch {
      return [];
    }
  }

  /**
   * 반입 승인 대기 목록 조회
   */
  private async getPendingReturns(teamId?: string): Promise<ApprovalItem[]> {
    try {
      const response = await checkoutApi.getPendingReturnApprovals();
      // PaginatedResponse uses 'data' field
      const items = response.data || [];

      return items
        .filter((item: Checkout) => !teamId || this.isOwnTeamCheckout(item, teamId))
        .map((item: Checkout) => this.mapCheckoutToApprovalItem(item, 'return'));
    } catch {
      return [];
    }
  }

  /**
   * 교정계획서 검토 대기 목록 조회 (품질책임자)
   */
  private async getPendingPlanReviews(): Promise<ApprovalItem[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CALIBRATION_PLANS.PENDING_REVIEW);
      const items = transformArrayResponse<Record<string, unknown>>(response);

      return items.map((item) => this.mapPlanToApprovalItem(item, 'plan_review'));
    } catch {
      return [];
    }
  }

  /**
   * 교정계획서 최종 승인 대기 목록 조회 (시험소장)
   */
  private async getPendingPlanFinals(): Promise<ApprovalItem[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CALIBRATION_PLANS.PENDING_APPROVAL);
      const items = transformArrayResponse<Record<string, unknown>>(response);

      return items.map((item) => this.mapPlanToApprovalItem(item, 'plan_final'));
    } catch {
      return [];
    }
  }

  /**
   * 장비 승인 대기 목록 조회
   */
  private async getPendingEquipmentApprovals(_teamId?: string): Promise<ApprovalItem[]> {
    // 장비 요청 API가 있다면 여기서 호출
    // 현재는 빈 배열 반환
    return [];
  }

  /**
   * 소프트웨어 승인 대기 목록 조회
   */
  private async getPendingSoftwareApprovals(): Promise<ApprovalItem[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SOFTWARE.CHANGES.PENDING);
      const items = transformArrayResponse<Record<string, unknown>>(response);

      return items.map((item) => this.mapSoftwareToApprovalItem(item));
    } catch {
      return [];
    }
  }

  /**
   * 부적합 재개 승인 대기 목록 조회
   */
  private async getPendingNonConformities(): Promise<ApprovalItem[]> {
    try {
      const response = await nonConformancesApi.getPendingCloseNonConformances();
      // PaginatedResponse uses 'data' field
      const items = response.data || [];

      return items
        .filter((item: NonConformance) => {
          // damage/malfunction 유형은 수리 기록이 필요
          const requiresRepair = ['damage', 'malfunction'].includes(item.ncType);
          if (requiresRepair && !item.repairHistoryId) {
            console.warn(`부적합 ${item.id}는 수리 기록이 없어 승인할 수 없습니다.`);
            return false; // 목록에서 제외
          }
          return true;
        })
        .map((item: NonConformance) => this.mapNonConformanceToApprovalItem(item));
    } catch {
      return [];
    }
  }

  /**
   * 중간점검 승인 대기 목록 조회
   */
  private async getPendingInspections(): Promise<ApprovalItem[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CALIBRATIONS.INTERMEDIATE_CHECKS.ALL);
      const items = transformArrayResponse<Record<string, unknown>>(response);

      // 완료되지 않은 중간점검만 필터링
      const pendingItems = items.filter((item) => !item.completed);

      return pendingItems.map((item) => this.mapInspectionToApprovalItem(item));
    } catch {
      return [];
    }
  }

  /**
   * 공용/렌탈장비 사용 승인 대기 목록 조회
   */
  private async getPendingCommonEquipment(): Promise<ApprovalItem[]> {
    // 공용/렌탈장비는 체크아웃 시스템을 사용하므로 체크아웃 목록과 동일
    // 타입 필터링이 필요하면 추가
    try {
      const response = await checkoutApi.getCheckouts({
        status: 'pending',
        // 추가 필터: purpose='rental' 등
      });
      const items = response.data || [];

      return items.map((item: Checkout) =>
        this.mapCheckoutToApprovalItem(item, 'common_equipment')
      );
    } catch {
      return [];
    }
  }

  /**
   * 폐기 검토 대기 목록 조회 (기술책임자)
   */
  private async getPendingDisposalReviews(): Promise<ApprovalItem[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.EQUIPMENT.DISPOSAL.PENDING_REVIEW);
      const items = transformArrayResponse<Record<string, unknown>>(response);

      return items.map((item) => this.mapDisposalToApprovalItem(item, 'disposal_review'));
    } catch {
      return [];
    }
  }

  /**
   * 폐기 최종 승인 대기 목록 조회 (시험소장)
   */
  private async getPendingDisposalFinals(): Promise<ApprovalItem[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.EQUIPMENT.DISPOSAL.PENDING_APPROVAL);
      const items = transformArrayResponse<Record<string, unknown>>(response);

      return items.map((item) => this.mapDisposalToApprovalItem(item, 'disposal_final'));
    } catch {
      return [];
    }
  }

  /**
   * 카테고리별 대기 개수 조회
   */
  async getPendingCounts(role?: UserRole): Promise<PendingCountsByCategory> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.PENDING_APPROVAL_COUNTS, {
        params: role ? { role } : undefined,
      });

      const data = response.data || {};

      // 부적합 재개 대기 개수 별도 조회
      let nonconformityCount = 0;
      try {
        const ncResponse = await nonConformancesApi.getPendingCloseNonConformances();
        nonconformityCount = ncResponse.data?.length || 0;
      } catch {
        // 에러 무시
      }

      // 폐기 검토 대기 개수
      let disposalReviewCount = 0;
      try {
        const response = await apiClient.get(API_ENDPOINTS.EQUIPMENT.DISPOSAL.PENDING_REVIEW);
        const items = transformArrayResponse<Record<string, unknown>>(response);
        disposalReviewCount = items.length;
      } catch {
        // 에러 무시
      }

      // 폐기 최종 승인 대기 개수
      let disposalFinalCount = 0;
      try {
        const response = await apiClient.get(API_ENDPOINTS.EQUIPMENT.DISPOSAL.PENDING_APPROVAL);
        const items = transformArrayResponse<Record<string, unknown>>(response);
        disposalFinalCount = items.length;
      } catch {
        // 에러 무시
      }

      return {
        equipment: data.equipment || 0,
        calibration: data.calibration || 0,
        inspection: 0, // TODO: 백엔드 API 추가 필요
        checkout: data.checkout || 0,
        return: 0, // TODO: 백엔드 API 추가 필요
        common_equipment: 0, // checkout과 동일하게 처리
        nonconformity: nonconformityCount,
        disposal_review: disposalReviewCount,
        disposal_final: disposalFinalCount,
        plan_review: 0, // TODO: 백엔드 API 추가 필요
        plan_final: 0, // TODO: 백엔드 API 추가 필요
        software: data.software || 0,
      };
    } catch {
      return {
        equipment: 0,
        calibration: 0,
        inspection: 0,
        checkout: 0,
        return: 0,
        common_equipment: 0,
        nonconformity: 0,
        disposal_review: 0,
        disposal_final: 0,
        plan_review: 0,
        plan_final: 0,
        software: 0,
      };
    }
  }

  /**
   * 승인 처리
   */
  async approve(
    category: ApprovalCategory,
    id: string,
    approverId: string,
    comment?: string,
    equipmentId?: string
  ): Promise<void> {
    switch (category) {
      case 'calibration':
        await calibrationApi.approveCalibration(id, {
          approverId,
          approverComment: comment || '',
        });
        break;
      case 'checkout':
        await checkoutApi.approveCheckout(id);
        break;
      case 'return':
        await checkoutApi.approveReturn(id, { approverId, comment });
        break;
      case 'plan_review':
        await apiClient.patch(API_ENDPOINTS.CALIBRATION_PLANS.REVIEW(id), { comment });
        break;
      case 'plan_final':
        await apiClient.patch(API_ENDPOINTS.CALIBRATION_PLANS.APPROVE(id), { comment });
        break;
      case 'software':
        await apiClient.patch(API_ENDPOINTS.SOFTWARE.CHANGES.APPROVE(id), { comment });
        break;
      case 'nonconformity':
        await nonConformancesApi.closeNonConformance(id, {
          closedBy: approverId,
          closureNotes: comment,
        });
        break;
      case 'inspection':
        await apiClient.post(API_ENDPOINTS.CALIBRATIONS.INTERMEDIATE_CHECKS.COMPLETE(id), {
          comment,
        });
        break;
      case 'common_equipment':
        // 공용장비는 체크아웃과 동일하게 처리
        await checkoutApi.approveCheckout(id);
        break;
      case 'disposal_review':
        if (!equipmentId) throw new Error('equipmentId is required for disposal review');
        await apiClient.post<unknown, DisposalReviewPayload>(
          API_ENDPOINTS.EQUIPMENT.DISPOSAL.REVIEW(equipmentId),
          {
            decision: 'approve',
            opinion: comment || '승인합니다',
          }
        );
        break;
      case 'disposal_final':
        if (!equipmentId) throw new Error('equipmentId is required for disposal approval');
        await apiClient.post<unknown, DisposalApprovalPayload>(
          API_ENDPOINTS.EQUIPMENT.DISPOSAL.APPROVE(equipmentId),
          {
            decision: 'approve',
            comment: comment || '승인합니다',
          }
        );
        break;
      default:
        throw new Error(`Unsupported category: ${category}`);
    }
  }

  /**
   * 반려 처리
   */
  async reject(
    category: ApprovalCategory,
    id: string,
    approverId: string,
    reason: string,
    equipmentId?: string
  ): Promise<void> {
    switch (category) {
      case 'calibration':
        await calibrationApi.rejectCalibration(id, {
          approverId,
          rejectionReason: reason,
        });
        break;
      case 'checkout':
        await checkoutApi.rejectCheckout(id, reason, approverId);
        break;
      case 'plan_review':
      case 'plan_final':
        await apiClient.patch(API_ENDPOINTS.CALIBRATION_PLANS.REJECT(id), {
          reason,
        });
        break;
      case 'software':
        await apiClient.patch(API_ENDPOINTS.SOFTWARE.CHANGES.REJECT(id), {
          reason,
        });
        break;
      case 'nonconformity':
        // 부적합은 반려 기능이 없음 (조치 완료 상태에서만 종료 가능)
        throw new Error('부적합 재개는 반려할 수 없습니다. 부적합 관리 페이지에서 처리하세요.');
      case 'inspection':
        // 중간점검은 반려 기능 없음
        throw new Error('중간점검은 반려할 수 없습니다.');
      case 'common_equipment':
        await checkoutApi.rejectCheckout(id, reason, approverId);
        break;
      case 'disposal_review':
        if (!equipmentId) throw new Error('equipmentId is required for disposal review');
        await apiClient.post<unknown, DisposalReviewPayload>(
          API_ENDPOINTS.EQUIPMENT.DISPOSAL.REVIEW(equipmentId),
          {
            decision: 'reject',
            opinion: reason || '반려합니다',
          }
        );
        break;
      case 'disposal_final':
        if (!equipmentId) throw new Error('equipmentId is required for disposal approval');
        await apiClient.post<unknown, DisposalApprovalPayload>(
          API_ENDPOINTS.EQUIPMENT.DISPOSAL.APPROVE(equipmentId),
          {
            decision: 'reject',
            comment: reason || '반려합니다',
          }
        );
        break;
      default:
        throw new Error(`Unsupported category: ${category}`);
    }
  }

  /**
   * 일괄 승인 처리
   *
   * Note: For disposal categories, we need to fetch the items first to get equipmentId
   */
  async bulkApprove(
    category: ApprovalCategory,
    ids: string[],
    approverId: string,
    comment?: string
  ): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    // For disposal categories, fetch items first to get equipmentId
    let itemsMap: Map<string, ApprovalItem> | undefined;
    if (category === 'disposal_review' || category === 'disposal_final') {
      const items = await this.getPendingItems(category);
      itemsMap = new Map(items.map((item) => [item.id, item]));
    }

    for (const id of ids) {
      try {
        let equipmentId: string | undefined;
        if (itemsMap) {
          const item = itemsMap.get(id);
          equipmentId = item?.details?.equipmentId as string | undefined;
        }
        await this.approve(category, id, approverId, comment, equipmentId);
        success.push(id);
      } catch {
        failed.push(id);
      }
    }

    return { success, failed };
  }

  /**
   * 일괄 반려 처리
   *
   * Note: For disposal categories, we need to fetch the items first to get equipmentId
   */
  async bulkReject(
    category: ApprovalCategory,
    ids: string[],
    approverId: string,
    reason: string
  ): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    // For disposal categories, fetch items first to get equipmentId
    let itemsMap: Map<string, ApprovalItem> | undefined;
    if (category === 'disposal_review' || category === 'disposal_final') {
      const items = await this.getPendingItems(category);
      itemsMap = new Map(items.map((item) => [item.id, item]));
    }

    for (const id of ids) {
      try {
        let equipmentId: string | undefined;
        if (itemsMap) {
          const item = itemsMap.get(id);
          equipmentId = item?.details?.equipmentId as string | undefined;
        }
        await this.reject(category, id, approverId, reason, equipmentId);
        success.push(id);
      } catch {
        failed.push(id);
      }
    }

    return { success, failed };
  }

  // ============================================================================
  // 헬퍼 메서드
  // ============================================================================

  private mapCalibrationToApprovalItem(calibration: Calibration): ApprovalItem {
    // Note: Calibration 타입에는 equipment 조인 정보가 없음
    // 필요시 별도로 장비 정보를 조회해야 함
    return {
      id: calibration.id,
      category: 'calibration',
      status: this.mapCalibrationStatus(calibration.approvalStatus),
      requesterId: calibration.registeredBy || '',
      requesterName: calibration.registeredByRole === 'test_engineer' ? '시험실무자' : '기술책임자',
      requesterTeam: '',
      requestedAt: calibration.createdAt,
      summary: `장비(${calibration.equipmentId}) 교정 기록 등록`,
      details: {
        equipmentId: calibration.equipmentId,
        calibrationDate: calibration.calibrationDate,
        nextCalibrationDate: calibration.nextCalibrationDate,
        calibrationResult: calibration.calibrationResult,
        calibrationAgency: calibration.calibrationAgency,
        certificateNumber: calibration.certificateNumber,
      },
      originalData: calibration,
    };
  }

  private mapCheckoutToApprovalItem(
    checkout: Checkout,
    category: 'checkout' | 'return'
  ): ApprovalItem {
    const equipmentNames = checkout.equipment?.map((e) => e.name).join(', ') || '장비';

    return {
      id: checkout.id,
      category,
      status: this.mapCheckoutStatus(checkout.status),
      requesterId: checkout.requesterId || checkout.userId || '',
      requesterName: checkout.user?.name || '알 수 없음',
      requesterTeam: checkout.user?.department || '',
      requestedAt: checkout.createdAt,
      summary:
        category === 'checkout'
          ? `${equipmentNames} 반출 요청`
          : `${equipmentNames} 반입 승인 대기`,
      details: {
        equipmentIds: checkout.equipmentIds,
        equipment: checkout.equipment,
        destination: checkout.destination,
        purpose: checkout.purpose,
        expectedReturnDate: checkout.expectedReturnDate,
      },
      originalData: checkout,
    };
  }

  private mapPlanToApprovalItem(
    plan: Record<string, unknown>,
    category: 'plan_review' | 'plan_final'
  ): ApprovalItem {
    const author = plan.author as Record<string, unknown> | undefined;
    const site = plan.site as Record<string, unknown> | undefined;

    return {
      id: String(plan.id),
      category,
      status: this.mapPlanStatus(String(plan.status)),
      requesterId: String(plan.createdBy || ''),
      requesterName: author?.name ? String(author.name) : '알 수 없음',
      requesterTeam: site?.name ? String(site.name) : '',
      requestedAt: String(plan.createdAt || ''),
      summary: `${plan.year || ''}년 ${site?.name || ''} 교정계획서`,
      details: plan,
      originalData: plan,
    };
  }

  private mapSoftwareToApprovalItem(item: Record<string, unknown>): ApprovalItem {
    const requester = item.requester as Record<string, unknown> | undefined;

    return {
      id: String(item.id),
      category: 'software',
      status: 'pending_review',
      requesterId: String(item.requestedBy || ''),
      requesterName: requester?.name ? String(requester.name) : '알 수 없음',
      requesterTeam: '',
      requestedAt: String(item.createdAt || ''),
      summary: `${item.softwareName || '소프트웨어'} 변경 요청`,
      details: item,
      originalData: item,
    };
  }

  private mapNonConformanceToApprovalItem(nc: NonConformance): ApprovalItem {
    return {
      id: nc.id,
      category: 'nonconformity',
      status: 'pending', // corrected 상태 = 승인 대기
      requesterId: nc.correctedBy || nc.discoveredBy || '',
      requesterName: '시험실무자', // 실제로는 사용자 정보 조회 필요
      requesterTeam: '',
      requestedAt: nc.correctionDate || nc.discoveryDate,
      summary: `${nc.cause} (조치 완료)`,
      details: {
        equipmentId: nc.equipmentId,
        discoveryDate: nc.discoveryDate,
        cause: nc.cause,
        ncType: nc.ncType,
        correctionContent: nc.correctionContent,
        correctionDate: nc.correctionDate,
        actionPlan: nc.actionPlan,
        analysisContent: nc.analysisContent,
      },
      originalData: nc,
    };
  }

  private mapInspectionToApprovalItem(item: Record<string, unknown>): ApprovalItem {
    const equipment = item.equipment as Record<string, unknown> | undefined;

    return {
      id: String(item.calibrationId || item.id),
      category: 'inspection',
      status: 'pending',
      requesterId: '',
      requesterName: '자동 알림',
      requesterTeam: '',
      requestedAt: String(item.nextIntermediateCheckDate || item.createdAt || ''),
      summary: `${equipment?.name || '장비'} 중간점검`,
      details: item,
      originalData: item,
    };
  }

  private mapDisposalToApprovalItem(
    item: Record<string, unknown>,
    category: 'disposal_review' | 'disposal_final'
  ): ApprovalItem {
    const equipment = item.equipment as Record<string, unknown> | undefined;
    const requester = item.requester as Record<string, unknown> | undefined;

    return {
      id: String(item.id),
      category,
      status: category === 'disposal_review' ? 'pending' : 'reviewed',
      requesterId: String(item.requestedBy || ''),
      requesterName: requester?.name ? String(requester.name) : '알 수 없음',
      requesterTeam: '',
      requestedAt: String(item.requestedAt || ''),
      summary: `${equipment?.name || '장비'} (${equipment?.managementNumber || ''}) 폐기 ${category === 'disposal_review' ? '검토' : '승인'}`,
      details: {
        reason: item.reason,
        reasonDetail: item.reasonDetail,
        equipmentId: item.equipmentId,
        equipment,
        reviewOpinion: item.reviewOpinion,
        reviewedAt: item.reviewedAt,
      },
      originalData: item,
    };
  }

  private mapCalibrationStatus(status?: string): UnifiedApprovalStatus {
    switch (status) {
      case 'pending_approval':
        return 'pending';
      case 'approved':
        return 'approved';
      case 'rejected':
        return 'rejected';
      default:
        return 'pending';
    }
  }

  private mapCheckoutStatus(status: string): UnifiedApprovalStatus {
    switch (status) {
      case 'pending':
        return 'pending';
      case 'approved':
        return 'approved';
      case 'rejected':
        return 'rejected';
      case 'returned':
        return 'pending'; // 반입 승인 대기
      default:
        return 'pending';
    }
  }

  private mapPlanStatus(status: string): UnifiedApprovalStatus {
    switch (status) {
      case 'pending_review':
        return 'pending_review';
      case 'pending_approval':
        return 'reviewed';
      case 'approved':
        return 'approved';
      case 'rejected':
        return 'rejected';
      default:
        return 'pending';
    }
  }

  private isOwnTeamCheckout(_checkout: Checkout, _teamId: string): boolean {
    // 실제 구현 시 장비의 팀 ID와 비교
    return true;
  }
}

export const approvalsApi = new ApprovalsApi();
export default approvalsApi;
