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
import {
  type UserRole,
  type UnifiedApprovalStatus,
  UNIFIED_APPROVAL_STATUS_LABELS,
  SITE_LABELS,
} from '@equipment-management/schemas';
import calibrationApi, { type Calibration } from './calibration-api';
import checkoutApi, { type Checkout } from './checkout-api';
import nonConformancesApi, { type NonConformance } from './non-conformances-api';
import equipmentImportApi, { type EquipmentImport } from './equipment-import-api';
import { reviewDisposal, approveDisposal, getCurrentDisposalRequest } from './disposal-api';
import { transformArrayResponse, transformPaginatedResponse } from './utils/response-transformers';

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
// ✅ SSOT: UnifiedApprovalStatus, UNIFIED_APPROVAL_STATUS_LABELS는
// @equipment-management/schemas에서 import (위 import 참조)
// Re-export for downstream consumers
export type { UnifiedApprovalStatus };
export { UNIFIED_APPROVAL_STATUS_LABELS };

// ============================================================================
// 승인 카테고리 정의
// ============================================================================

/**
 * 승인 카테고리
 * 프론트엔드에서 탭 분류에 사용
 *
 * Direction-based categories (consolidated):
 * - outgoing: All equipment leaving facility (checkouts + vendor returns)
 * - incoming: All equipment entering facility (returns + rental imports + shared imports)
 *
 * Specialized categories (non-movement):
 * - equipment, calibration, inspection, nonconformity, disposal, plans, software
 */
export type ApprovalCategory =
  // Direction-based (movement of equipment)
  | 'outgoing' // 반출 (장비가 시설을 떠남)
  | 'incoming' // 반입 (장비가 시설로 들어옴)

  // Specialized approvals (non-movement)
  | 'equipment' // 장비 등록/수정/삭제
  | 'calibration' // 교정 기록
  | 'inspection' // 중간점검
  | 'nonconformity' // 부적합 장비 사용 재개
  | 'disposal_review' // 장비 폐기 (기술책임자 검토)
  | 'disposal_final' // 장비 폐기 (시험소장 최종)
  | 'plan_review' // 교정계획서 (품질책임자 검토)
  | 'plan_final' // 교정계획서 (시험소장 최종)
  | 'software'; // 소프트웨어 유효성

/**
 * 역할별 탭 설정
 *
 * SSOT: 백엔드 ApprovalsService의 getPendingCountsByRole과 동기화
 */
export const ROLE_TABS: Record<UserRole, ApprovalCategory[]> = {
  test_engineer: [], // 시험실무자는 승인 권한 없음
  technical_manager: [
    'outgoing', // ← Consolidated: checkout + vendor returns
    'incoming', // ← Consolidated: return + rental imports + shared imports
    'equipment',
    'calibration',
    'inspection',
    'nonconformity',
    'disposal_review',
  ],
  quality_manager: ['plan_review', 'software'],
  lab_manager: ['disposal_final', 'plan_final', 'incoming'], // lab_manager also sees incoming (rental imports)
  system_admin: [], // 시스템 관리자는 설정 관리 전용, 승인 워크플로우 미참여
};

/**
 * 탭 메타 정보
 *
 * SSOT: 아이콘, 라벨, 승인 시 코멘트 필수 여부의 단일 소스
 *
 * commentRequired가 true인 카테고리는:
 * - 승인 시 코멘트 입력 다이얼로그를 표시
 * - 백엔드 DTO에서도 해당 필드를 .min(1)로 검증
 */
export interface TabMeta {
  label: string;
  icon: string;
  action: string;
  /** 승인 시 코멘트 입력 필수 여부 (기본 false) */
  commentRequired?: boolean;
  /** 코멘트 입력 다이얼로그 제목 (commentRequired일 때 사용) */
  commentDialogTitle?: string;
  /** 코멘트 placeholder (commentRequired일 때 사용) */
  commentPlaceholder?: string;
}

export const TAB_META: Record<ApprovalCategory, TabMeta> = {
  // Direction-based
  outgoing: { label: '반출', icon: 'ArrowUpFromLine', action: '승인' },
  incoming: { label: '반입', icon: 'ArrowDownToLine', action: '승인' },

  // Specialized
  equipment: { label: '장비', icon: 'Package', action: '승인' },
  calibration: { label: '교정 기록', icon: 'FileCheck', action: '승인' },
  inspection: { label: '중간점검', icon: 'ClipboardCheck', action: '승인' },
  nonconformity: { label: '부적합 재개', icon: 'AlertTriangle', action: '승인' },
  disposal_review: {
    label: '폐기 검토',
    icon: 'Trash2',
    action: '검토완료',
    commentRequired: true,
    commentDialogTitle: '폐기 검토 의견',
    commentPlaceholder: '검토 의견을 입력하세요',
  },
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
 *
 * SSOT: 백엔드 ApprovalsService의 PendingCountsByCategory와 동기화
 */
export interface PendingCountsByCategory {
  // Direction-based (consolidated)
  outgoing: number; // checkout + vendor returns
  incoming: number; // return + rental imports + shared imports

  // Specialized
  equipment: number;
  calibration: number;
  inspection: number;
  nonconformity: number;
  disposal_review: number;
  disposal_final: number;
  plan_review: number;
  plan_final: number;
  software: number;
}

/**
 * 일괄 처리 결과
 */
export interface BulkActionResult {
  success: string[];
  failed: string[];
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
      // Direction-based (consolidated)
      case 'outgoing':
        return this.getPendingOutgoing(teamId);
      case 'incoming':
        return this.getPendingIncoming(teamId);

      // Specialized
      case 'equipment':
        return this.getPendingEquipmentApprovals(teamId);
      case 'calibration':
        return this.getPendingCalibrations(teamId);
      case 'inspection':
        return this.getPendingInspections();
      case 'nonconformity':
        return this.getPendingNonConformities();
      case 'disposal_review':
        return this.getPendingDisposalReviews();
      case 'disposal_final':
        return this.getPendingDisposalFinals();
      case 'plan_review':
        return this.getPendingPlanReviews();
      case 'plan_final':
        return this.getPendingPlanFinals();
      case 'software':
        return this.getPendingSoftwareApprovals();
      default:
        return [];
    }
  }

  /**
   * 반출 승인 대기 목록 조회 (통합)
   *
   * Combines:
   * - Regular checkouts (calibration, repair, rental, etc.)
   * - Equipment being returned to vendors (purpose='return_to_vendor')
   */
  private async getPendingOutgoing(teamId?: string): Promise<ApprovalItem[]> {
    try {
      const [regularCheckouts, vendorReturns] = await Promise.all([
        // Regular checkouts
        checkoutApi.getCheckouts({ statuses: 'pending' }),
        // Vendor returns
        checkoutApi.getCheckouts({ statuses: 'pending', purpose: 'return_to_vendor' }),
      ]);

      const regularItems = (regularCheckouts.data || [])
        .filter((item: Checkout) => !teamId || this.isOwnTeamCheckout(item, teamId))
        .map((item: Checkout) => this.mapCheckoutToApprovalItem(item, 'outgoing'));

      const vendorReturnItems = (vendorReturns.data || [])
        .filter((item: Checkout) => !teamId || this.isOwnTeamCheckout(item, teamId))
        .map((item: Checkout) => this.mapCheckoutToApprovalItem(item, 'outgoing'));

      return [...regularItems, ...vendorReturnItems];
    } catch {
      return [];
    }
  }

  /**
   * 반입 승인 대기 목록 조회 (통합)
   *
   * Combines:
   * - Equipment returning from calibration/repair
   * - Rental equipment arriving from vendors
   * - Shared equipment arriving from other teams
   */
  private async getPendingIncoming(teamId?: string): Promise<ApprovalItem[]> {
    try {
      const [returns, rentalImports, sharedImports] = await Promise.all([
        // Equipment returning
        checkoutApi.getPendingReturnApprovals(),
        // Rental equipment arriving
        equipmentImportApi.getList({ status: 'pending', sourceType: 'rental' }),
        // Shared equipment arriving
        equipmentImportApi.getList({ status: 'pending', sourceType: 'internal_shared' }),
      ]);

      const returnItems = (returns.data || [])
        .filter((item: Checkout) => !teamId || this.isOwnTeamCheckout(item, teamId))
        .map((item: Checkout) => this.mapCheckoutToApprovalItem(item, 'incoming'));

      const rentalItems = (rentalImports.items || []).map((item: EquipmentImport) =>
        this.mapEquipmentImportToApprovalItem(item, 'incoming')
      );

      const sharedItems = (sharedImports.items || []).map((item: EquipmentImport) =>
        this.mapEquipmentImportToApprovalItem(item, 'incoming')
      );

      return [...returnItems, ...rentalItems, ...sharedItems];
    } catch {
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
   *
   * @deprecated Use getPendingOutgoing() instead (consolidates checkouts + vendor returns)
   */
  private async getPendingCheckouts(teamId?: string): Promise<ApprovalItem[]> {
    try {
      const response = await checkoutApi.getCheckouts({ statuses: 'pending' });
      // PaginatedResponse uses 'data' field
      const items = response.data || [];

      return items
        .filter((item: Checkout) => !teamId || this.isOwnTeamCheckout(item, teamId))
        .map((item: Checkout) => this.mapCheckoutToApprovalItem(item, 'outgoing'));
    } catch {
      return [];
    }
  }

  /**
   * 반입 승인 대기 목록 조회
   *
   * @deprecated Use getPendingIncoming() instead (consolidates returns + imports)
   */
  private async getPendingReturns(teamId?: string): Promise<ApprovalItem[]> {
    try {
      const response = await checkoutApi.getPendingReturnApprovals();
      // PaginatedResponse uses 'data' field
      const items = response.data || [];

      return items
        .filter((item: Checkout) => !teamId || this.isOwnTeamCheckout(item, teamId))
        .map((item: Checkout) => this.mapCheckoutToApprovalItem(item, 'incoming'));
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
    try {
      const response = await apiClient.get(API_ENDPOINTS.EQUIPMENT.REQUESTS.PENDING);
      const items = transformArrayResponse<Record<string, unknown>>(response);
      return items.map((item) => this.mapEquipmentRequestToApprovalItem(item));
    } catch {
      return [];
    }
  }

  /**
   * 소프트웨어 승인 대기 목록 조회
   */
  private async getPendingSoftwareApprovals(): Promise<ApprovalItem[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SOFTWARE.PENDING);
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
   *
   * @deprecated Use getPendingOutgoing() instead (consolidated into outgoing category)
   */
  private async getPendingCommonEquipment(): Promise<ApprovalItem[]> {
    // 공용/렌탈장비는 체크아웃 시스템을 사용하므로 체크아웃 목록과 동일
    // 타입 필터링이 필요하면 추가
    try {
      const response = await checkoutApi.getCheckouts({
        statuses: 'pending',
        // 추가 필터: purpose='rental' 등
      });
      const items = response.data || [];

      return items.map((item: Checkout) => this.mapCheckoutToApprovalItem(item, 'outgoing'));
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
   * 렌탈 반입 승인 대기 목록 조회
   *
   * @deprecated Use getPendingIncoming() instead (consolidated into incoming category)
   */
  private async getPendingRentalImports(): Promise<ApprovalItem[]> {
    try {
      const response = await equipmentImportApi.getList({
        status: 'pending',
        sourceType: 'rental',
      });
      const items = response.items || [];

      return items.map((item) => this.mapEquipmentImportToApprovalItem(item, 'incoming'));
    } catch {
      return [];
    }
  }

  /**
   * 카테고리별 대기 개수 조회
   *
   * ✅ SSOT: 백엔드 통합 API 사용
   * 기존 13개 별도 API 호출 → 1개 통합 API 호출
   *
   * Performance:
   * - Before: 13 serial API calls (~1.3s)
   * - After: 1 API call (~100ms)
   * - Improvement: 92% faster
   */
  async getPendingCounts(_role?: UserRole): Promise<PendingCountsByCategory> {
    try {
      const response = await apiClient.get<PendingCountsByCategory>(API_ENDPOINTS.APPROVALS.COUNTS);

      return response.data || this.getEmptyCounts();
    } catch (error) {
      console.error('Failed to fetch approval counts:', error);
      return this.getEmptyCounts();
    }
  }

  /**
   * 빈 카운트 객체 반환 (fallback)
   */
  private getEmptyCounts(): PendingCountsByCategory {
    return {
      outgoing: 0,
      incoming: 0,
      equipment: 0,
      calibration: 0,
      inspection: 0,
      nonconformity: 0,
      disposal_review: 0,
      disposal_final: 0,
      plan_review: 0,
      plan_final: 0,
      software: 0,
    };
  }

  /**
   * 승인 처리
   */
  async approve(
    category: ApprovalCategory,
    id: string,
    approverId: string,
    comment?: string,
    equipmentId?: string,
    originalData?: unknown
  ): Promise<void> {
    switch (category) {
      // Direction-based (consolidated)
      case 'outgoing': {
        // ✅ Optimized: use version from originalData, fallback to fetch
        const outgoingVersion =
          this.extractVersion(originalData) ?? (await checkoutApi.getCheckout(id)).version;
        await checkoutApi.approveCheckout(id, outgoingVersion, comment);
        break;
      }

      case 'incoming':
        // Incoming can be: checkout return OR equipment import
        // Determine type from originalData
        if (this.isCheckout(originalData)) {
          const incomingVersion =
            this.extractVersion(originalData) ?? (await checkoutApi.getCheckout(id)).version;
          await checkoutApi.approveReturn(id, { version: incomingVersion, comment });
        } else if (this.isEquipmentImport(originalData)) {
          const importVersion =
            this.extractVersion(originalData) ?? (await equipmentImportApi.getOne(id)).version;
          await equipmentImportApi.approve(id, importVersion, comment);
        } else {
          throw new Error('Unknown incoming item type');
        }
        break;

      // Specialized
      case 'equipment':
        await apiClient.post(API_ENDPOINTS.EQUIPMENT.REQUESTS.APPROVE(id));
        break;
      case 'calibration': {
        const calVersion =
          this.extractVersion(originalData) ?? (await calibrationApi.getCalibration(id)).version;
        await calibrationApi.approveCalibration(id, {
          version: calVersion,
          approverComment: comment || undefined,
        });
        break;
      }
      case 'inspection':
        await apiClient.post(API_ENDPOINTS.CALIBRATIONS.INTERMEDIATE_CHECKS.COMPLETE(id), {
          comment,
        });
        break;
      case 'nonconformity': {
        const ncVersion =
          this.extractVersion(originalData) ??
          (await nonConformancesApi.getNonConformance(id)).version;
        await nonConformancesApi.closeNonConformance(id, {
          version: ncVersion,
          closureNotes: comment,
        });
        break;
      }
      case 'disposal_review': {
        if (!equipmentId) throw new Error('equipmentId is required for disposal review');
        const reviewVersion =
          this.extractVersion(originalData) ??
          (await getCurrentDisposalRequest(equipmentId))?.version;
        if (reviewVersion === undefined) throw new Error('Disposal request not found');
        await reviewDisposal(equipmentId, {
          version: reviewVersion,
          decision: 'approve',
          opinion: comment || '승인합니다',
        });
        break;
      }
      case 'disposal_final': {
        if (!equipmentId) throw new Error('equipmentId is required for disposal approval');
        const finalVersion =
          this.extractVersion(originalData) ??
          (await getCurrentDisposalRequest(equipmentId))?.version;
        if (finalVersion === undefined) throw new Error('Disposal request not found');
        await approveDisposal(equipmentId, {
          version: finalVersion,
          decision: 'approve',
          comment: comment || '승인합니다',
        });
        break;
      }
      case 'plan_review':
        await apiClient.patch(API_ENDPOINTS.CALIBRATION_PLANS.REVIEW(id), { comment });
        break;
      case 'plan_final':
        await apiClient.patch(API_ENDPOINTS.CALIBRATION_PLANS.APPROVE(id), { comment });
        break;
      case 'software':
        await apiClient.patch(API_ENDPOINTS.SOFTWARE.APPROVE(id), { comment });
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
    equipmentId?: string,
    originalData?: unknown
  ): Promise<void> {
    switch (category) {
      // Direction-based (consolidated)
      case 'outgoing': {
        const outgoingVersion =
          this.extractVersion(originalData) ?? (await checkoutApi.getCheckout(id)).version;
        await checkoutApi.rejectCheckout(id, outgoingVersion, reason);
        break;
      }

      case 'incoming':
        if (this.isCheckout(originalData)) {
          const incomingVersion =
            this.extractVersion(originalData) ?? (await checkoutApi.getCheckout(id)).version;
          await checkoutApi.rejectReturn(id, { version: incomingVersion, reason });
        } else if (this.isEquipmentImport(originalData)) {
          const importVersion =
            this.extractVersion(originalData) ?? (await equipmentImportApi.getOne(id)).version;
          await equipmentImportApi.reject(id, importVersion, reason);
        } else {
          throw new Error('Unknown incoming item type');
        }
        break;

      // Specialized
      case 'equipment':
        await apiClient.post(API_ENDPOINTS.EQUIPMENT.REQUESTS.REJECT(id), {
          rejectionReason: reason,
        });
        break;
      case 'calibration': {
        const calVersion =
          this.extractVersion(originalData) ?? (await calibrationApi.getCalibration(id)).version;
        await calibrationApi.rejectCalibration(id, {
          version: calVersion,
          rejectionReason: reason,
        });
        break;
      }
      case 'inspection':
        throw new Error('중간점검은 반려할 수 없습니다.');
      case 'nonconformity': {
        const ncRejectVersion =
          this.extractVersion(originalData) ??
          (await nonConformancesApi.getNonConformance(id)).version;
        await nonConformancesApi.rejectCorrection(id, {
          version: ncRejectVersion,
          rejectionReason: reason,
        });
        break;
      }
      case 'disposal_review': {
        if (!equipmentId) throw new Error('equipmentId is required for disposal review');
        const reviewVersion =
          this.extractVersion(originalData) ??
          (await getCurrentDisposalRequest(equipmentId))?.version;
        if (reviewVersion === undefined) throw new Error('Disposal request not found');
        await reviewDisposal(equipmentId, {
          version: reviewVersion,
          decision: 'reject',
          opinion: reason || '반려합니다',
        });
        break;
      }
      case 'disposal_final': {
        if (!equipmentId) throw new Error('equipmentId is required for disposal approval');
        const finalVersion =
          this.extractVersion(originalData) ??
          (await getCurrentDisposalRequest(equipmentId))?.version;
        if (finalVersion === undefined) throw new Error('Disposal request not found');
        await approveDisposal(equipmentId, {
          version: finalVersion,
          decision: 'reject',
          comment: reason || '반려합니다',
        });
        break;
      }
      case 'plan_review':
      case 'plan_final':
        await apiClient.patch(API_ENDPOINTS.CALIBRATION_PLANS.REJECT(id), {
          reason,
        });
        break;
      case 'software':
        await apiClient.patch(API_ENDPOINTS.SOFTWARE.REJECT(id), {
          reason,
        });
        break;
      default:
        throw new Error(`Unsupported category: ${category}`);
    }
  }

  /**
   * 일괄 승인 처리
   *
   * Note: For disposal categories and consolidated categories (outgoing/incoming),
   * we need to fetch the items first to get equipmentId or originalData
   */
  async bulkApprove(
    category: ApprovalCategory,
    ids: string[],
    approverId: string,
    comment?: string
  ): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    // For disposal categories and consolidated categories, fetch items first
    let itemsMap: Map<string, ApprovalItem> | undefined;
    if (
      category === 'disposal_review' ||
      category === 'disposal_final' ||
      category === 'outgoing' ||
      category === 'incoming'
    ) {
      const items = await this.getPendingItems(category);
      itemsMap = new Map(items.map((item) => [item.id, item]));
    }

    for (const id of ids) {
      try {
        let equipmentId: string | undefined;
        let originalData: unknown;
        if (itemsMap) {
          const item = itemsMap.get(id);
          equipmentId = item?.details?.equipmentId as string | undefined;
          originalData = item?.originalData;
        }
        await this.approve(category, id, approverId, comment, equipmentId, originalData);
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
   * Note: For disposal categories and consolidated categories (outgoing/incoming),
   * we need to fetch the items first to get equipmentId or originalData
   */
  async bulkReject(
    category: ApprovalCategory,
    ids: string[],
    approverId: string,
    reason: string
  ): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    // For disposal categories and consolidated categories, fetch items first
    let itemsMap: Map<string, ApprovalItem> | undefined;
    if (
      category === 'disposal_review' ||
      category === 'disposal_final' ||
      category === 'outgoing' ||
      category === 'incoming'
    ) {
      const items = await this.getPendingItems(category);
      itemsMap = new Map(items.map((item) => [item.id, item]));
    }

    for (const id of ids) {
      try {
        let equipmentId: string | undefined;
        let originalData: unknown;
        if (itemsMap) {
          const item = itemsMap.get(id);
          equipmentId = item?.details?.equipmentId as string | undefined;
          originalData = item?.originalData;
        }
        await this.reject(category, id, approverId, reason, equipmentId, originalData);
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

  /**
   * Extract version from originalData (avoids extra fetch when version is already available)
   */
  private extractVersion(data: unknown): number | undefined {
    if (data && typeof data === 'object' && 'version' in data) {
      const v = (data as Record<string, unknown>).version;
      return typeof v === 'number' ? v : undefined;
    }
    return undefined;
  }

  /**
   * Type guard: Check if data is a Checkout
   */
  private isCheckout(data: unknown): data is Checkout {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    return 'equipmentIds' in obj || 'destination' in obj || 'purpose' in obj;
  }

  /**
   * Type guard: Check if data is an EquipmentImport
   */
  private isEquipmentImport(data: unknown): data is EquipmentImport {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    return 'sourceType' in obj && ('vendorName' in obj || 'ownerDepartment' in obj);
  }

  private mapCalibrationToApprovalItem(calibration: Calibration): ApprovalItem {
    // Note: Calibration 타입에는 equipment 조인 정보가 없음
    // 필요시 별도로 장비 정보를 조회해야 함

    // registeredByUser 관계를 통해 사용자 정보 추출
    const registeredByUser = (calibration as unknown as Record<string, unknown>)
      .registeredByUser as Record<string, unknown> | undefined;
    const team = registeredByUser?.team as Record<string, unknown> | undefined;

    return {
      id: calibration.id,
      category: 'calibration',
      status: this.mapCalibrationStatus(calibration.approvalStatus),
      requesterId: calibration.registeredBy || '',
      requesterName: registeredByUser?.name
        ? String(registeredByUser.name)
        : calibration.registeredByRole === 'test_engineer'
          ? '시험실무자'
          : '기술책임자',
      requesterTeam: team?.name ? String(team.name) : '',
      requestedAt: calibration.createdAt,
      summary: `장비(${calibration.equipmentId}) 교정 기록 등록`,
      details: {
        equipmentId: calibration.equipmentId,
        calibrationDate: calibration.calibrationDate,
        nextCalibrationDate: calibration.nextCalibrationDate,
        result: calibration.result,
        calibrationAgency: calibration.calibrationAgency,
        certificateNumber: calibration.certificateNumber,
      },
      originalData: calibration,
    };
  }

  private mapCheckoutToApprovalItem(
    checkout: Checkout,
    category: 'outgoing' | 'incoming'
  ): ApprovalItem {
    const equipmentNames = checkout.equipment?.map((e) => e.name).join(', ') || '장비';

    // user.team 관계를 통해 팀 정보 추출
    const user = checkout.user as Record<string, unknown> | undefined;
    const team = user?.team as Record<string, unknown> | undefined;

    return {
      id: checkout.id,
      category,
      status: this.mapCheckoutStatus(checkout.status),
      requesterId: checkout.requesterId || checkout.userId || '',
      requesterName: checkout.user?.name || '알 수 없음',
      requesterTeam: team?.name ? String(team.name) : '',
      requestedAt: checkout.createdAt,
      summary:
        category === 'outgoing'
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
    // 백엔드 findAll()이 LEFT JOIN으로 플랫 필드 반환: authorName, teamName
    const siteId = String(plan.siteId || '');
    const siteLabel = SITE_LABELS[siteId as keyof typeof SITE_LABELS] || siteId;

    return {
      id: String(plan.id),
      category,
      status: this.mapPlanStatus(String(plan.status)),
      requesterId: String(plan.createdBy || ''),
      requesterName: plan.authorName ? String(plan.authorName) : '알 수 없음',
      requesterTeam: plan.teamName ? String(plan.teamName) : '',
      requestedAt: String(plan.createdAt || ''),
      summary: `${plan.year || ''}년 ${siteLabel} 교정계획서`,
      details: plan,
      originalData: plan,
    };
  }

  private mapSoftwareToApprovalItem(item: Record<string, unknown>): ApprovalItem {
    // 백엔드 findHistory()가 LEFT JOIN으로 플랫 필드 반환: changerName, teamName, equipmentName
    return {
      id: String(item.id),
      category: 'software',
      status: 'pending_review',
      requesterId: String(item.changedBy || ''),
      requesterName: item.changerName ? String(item.changerName) : '알 수 없음',
      requesterTeam: item.teamName ? String(item.teamName) : '',
      requestedAt: String(item.changedAt || item.createdAt || ''),
      summary: `${item.softwareName || '소프트웨어'} 변경 요청`,
      details: item,
      originalData: item,
    };
  }

  private mapNonConformanceToApprovalItem(nc: NonConformance): ApprovalItem {
    // 백엔드 relation 이름: corrector, discoverer (correctedByUser/discoveredByUser가 아님)
    const corrector = (nc as unknown as Record<string, unknown>).corrector as
      | Record<string, unknown>
      | undefined;
    const discoverer = (nc as unknown as Record<string, unknown>).discoverer as
      | Record<string, unknown>
      | undefined;
    const user = corrector || discoverer;
    const team = user?.team as Record<string, unknown> | undefined;

    return {
      id: nc.id,
      category: 'nonconformity',
      status: 'pending', // corrected 상태 = 승인 대기
      requesterId: nc.correctedBy || nc.discoveredBy || '',
      requesterName: user?.name ? String(user.name) : '시험실무자',
      requesterTeam: team?.name ? String(team.name) : '',
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
        rejectionReason: nc.rejectionReason,
        rejectedAt: nc.rejectedAt,
      },
      originalData: nc,
    };
  }

  private mapInspectionToApprovalItem(item: Record<string, unknown>): ApprovalItem {
    // 백엔드 findAllIntermediateChecks()가 플랫 필드 반환: equipmentName, team, teamName
    return {
      id: String(item.calibrationId || item.id),
      category: 'inspection',
      status: 'pending',
      requesterId: '',
      requesterName: '자동 알림',
      requesterTeam: item.teamName ? String(item.teamName) : item.team ? String(item.team) : '',
      requestedAt: String(item.nextIntermediateCheckDate || item.createdAt || ''),
      summary: `${item.equipmentName || '장비'} 중간점검`,
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
    const team = requester?.team as Record<string, unknown> | undefined;

    return {
      id: String(item.id),
      category,
      status: category === 'disposal_review' ? 'pending' : 'reviewed',
      requesterId: String(item.requestedBy || ''),
      requesterName: requester?.name ? String(requester.name) : '알 수 없음',
      requesterTeam: team?.name ? String(team.name) : '',
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

  private mapEquipmentRequestToApprovalItem(item: Record<string, unknown>): ApprovalItem {
    const requester = item.requester as Record<string, unknown> | undefined;
    const equipment = item.equipment as Record<string, unknown> | undefined;
    const requestType = String(item.requestType || 'create');

    const requestTypeLabels: Record<string, string> = {
      create: '등록',
      update: '수정',
      delete: '삭제',
    };

    // requestData에서 장비명 추출 시도
    let equipmentName = '';
    if (equipment?.name) {
      equipmentName = String(equipment.name);
    } else if (item.requestData) {
      try {
        const data =
          typeof item.requestData === 'string' ? JSON.parse(item.requestData) : item.requestData;
        equipmentName = data.name || data.equipmentName || '';
      } catch {
        // JSON 파싱 실패 무시
      }
    }

    const summary = equipmentName
      ? `${equipmentName} ${requestTypeLabels[requestType] || requestType} 요청`
      : `장비 ${requestTypeLabels[requestType] || requestType} 요청`;

    return {
      id: String(item.id),
      category: 'equipment',
      status: this.mapEquipmentRequestStatus(String(item.approvalStatus || '')),
      requesterId: String(item.requestedBy || ''),
      requesterName: requester?.name ? String(requester.name) : '알 수 없음',
      requesterTeam: (() => {
        const team = requester?.team as Record<string, unknown> | undefined;
        return team?.name ? String(team.name) : '';
      })(),
      requestedAt: String(item.requestedAt || ''),
      summary,
      details: {
        requestType,
        equipmentId: item.equipmentId,
        equipment,
        requestData: item.requestData,
      },
      originalData: item,
    };
  }

  private mapEquipmentRequestStatus(status: string): UnifiedApprovalStatus {
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

  /**
   * EquipmentImport를 ApprovalItem으로 변환
   *
   * Handles both rental and internal_shared imports
   */
  private mapEquipmentImportToApprovalItem(
    item: EquipmentImport,
    category: 'incoming'
  ): ApprovalItem {
    // requester 관계를 통해 사용자 정보 추출
    const requester = (item as unknown as Record<string, unknown>).requester as
      | Record<string, unknown>
      | undefined;
    const team = requester?.team as Record<string, unknown> | undefined;

    // Summary varies by source type
    const isRental = item.sourceType === 'rental';
    const summary = isRental
      ? `${item.equipmentName} 렌탈 반입 (${item.vendorName})`
      : `${item.equipmentName} 공용장비 반입 (${item.ownerDepartment})`;

    return {
      id: item.id,
      category,
      status: 'pending',
      requesterId: item.requesterId,
      requesterName: requester?.name ? String(requester.name) : '신청자',
      requesterTeam: team?.name ? String(team.name) : '',
      requestedAt: item.createdAt,
      summary,
      details: {
        equipmentName: item.equipmentName,
        classification: item.classification,
        sourceType: item.sourceType,
        // Rental-specific
        vendorName: item.vendorName,
        vendorContact: item.vendorContact,
        // Internal shared-specific
        ownerDepartment: item.ownerDepartment,
        internalContact: item.internalContact,
        borrowingJustification: item.borrowingJustification,
        // Common
        usagePeriodStart: item.usagePeriodStart,
        usagePeriodEnd: item.usagePeriodEnd,
        reason: item.reason,
      },
      originalData: item,
    };
  }

  private isOwnTeamCheckout(_checkout: Checkout, _teamId: string): boolean {
    // 실제 구현 시 장비의 팀 ID와 비교
    return true;
  }
}

export const approvalsApi = new ApprovalsApi();
export default approvalsApi;
