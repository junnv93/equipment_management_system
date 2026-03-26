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
import {
  API_ENDPOINTS,
  VALIDATION_RULES,
  ROLE_APPROVAL_CATEGORIES,
} from '@equipment-management/shared-constants';
import {
  type UserRole,
  type UnifiedApprovalStatus,
  type ApprovalCategory,
  SITE_LABELS,
  UserRoleValues as URVal,
  UnifiedApprovalStatusValues as UASVal,
  CalibrationApprovalStatusValues as CASVal,
  CheckoutStatusValues as CSVal,
  CalibrationPlanStatusValues as CPSVal,
  EquipmentImportSourceValues as EISrcVal,
} from '@equipment-management/schemas';
import calibrationApi, { type Calibration } from './calibration-api';
import checkoutApi, { type Checkout } from './checkout-api';
import nonConformancesApi, { type NonConformance } from './non-conformances-api';
import equipmentImportApi, { type EquipmentImport } from './equipment-import-api';
import softwareApi from './software-api';
import calibrationPlansApi from './calibration-plans-api';
import { reviewDisposal, approveDisposal, getCurrentDisposalRequest } from './disposal-api';
import equipmentApi from './equipment-api';
import { transformArrayResponse, transformSingleResponse } from './utils/response-transformers';

// ============================================================================
// Disposal API 페이로드 타입 (SSOT: 백엔드 DTO와 일치)
// @see apps/backend/src/modules/equipment/dto/disposal.dto.ts
// ============================================================================

// ============================================================================
// 통합 승인 상태 타입
// ✅ SSOT: UnifiedApprovalStatus는 @equipment-management/schemas에서 import
// 라벨은 i18n 파일(approvals.unifiedStatus.*)에서 관리
export type { UnifiedApprovalStatus };

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
// ✅ SSOT: ApprovalCategory는 @equipment-management/schemas에서 import (위 import 참조)
export type { ApprovalCategory };

/**
 * 역할별 탭 설정
 *
 * SSOT: 백엔드 ApprovalsService의 getPendingCountsByRole과 동기화
 */
// ✅ SSOT: ROLE_APPROVAL_CATEGORIES는 shared-constants에서 import (위 import 참조)
export const ROLE_TABS: Record<UserRole, readonly ApprovalCategory[]> = ROLE_APPROVAL_CATEGORIES;

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
  /** i18n 키 — t(labelKey) with useTranslations('approvals') */
  labelKey: string;
  /** lucide-react 아이콘 이름 */
  icon: string;
  /** i18n 키 — 승인/검토 버튼 라벨 */
  actionKey: string;
  /** 승인 시 코멘트 입력 필수 여부 (기본 false) */
  commentRequired?: boolean;
  /** i18n 키 — 코멘트 다이얼로그 제목 (commentRequired일 때 사용) */
  commentDialogTitleKey?: string;
  /** i18n 키 — 코멘트 placeholder (commentRequired일 때 사용) */
  commentPlaceholderKey?: string;
  /** 다단계 승인 여부 (disposal 2-step, calibration_plan 3-step) */
  multiStep?: boolean;
  /** 다단계 승인 타입 — StepIndicator의 type 파라미터 */
  multiStepType?: 'disposal' | 'calibration_plan';
  /** 사이드바 섹션 그룹핑 */
  section: ApprovalSection;
}

// ============================================================================
// 승인 섹션 정의 (사이드바 카테고리 그룹핑)
// ============================================================================

export type ApprovalSection = 'checkout' | 'equipment' | 'management';

export const APPROVAL_SECTIONS = {
  checkout: { labelKey: 'sections.checkout', order: 0 },
  equipment: { labelKey: 'sections.equipment', order: 1 },
  management: { labelKey: 'sections.management', order: 2 },
} as const;

// ============================================================================
// 매직넘버 상수화
// ============================================================================

/** 반려 사유 최소 글자 수 — SSOT: shared-constants/validation-rules */
export const REJECTION_MIN_LENGTH = VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH;

export const TAB_META: Record<ApprovalCategory, TabMeta> = {
  // Direction-based (checkout section)
  outgoing: {
    labelKey: 'tabMeta.outgoing.label',
    icon: 'ArrowUpFromLine',
    actionKey: 'tabMeta.outgoing.action',
    section: 'checkout',
  },
  incoming: {
    labelKey: 'tabMeta.incoming.label',
    icon: 'ArrowDownToLine',
    actionKey: 'tabMeta.incoming.action',
    section: 'checkout',
  },

  // Equipment section
  equipment: {
    labelKey: 'tabMeta.equipment.label',
    icon: 'Package',
    actionKey: 'tabMeta.equipment.action',
    section: 'equipment',
  },
  calibration: {
    labelKey: 'tabMeta.calibration.label',
    icon: 'FileCheck',
    actionKey: 'tabMeta.calibration.action',
    section: 'equipment',
  },
  inspection: {
    labelKey: 'tabMeta.inspection.label',
    icon: 'ClipboardCheck',
    actionKey: 'tabMeta.inspection.action',
    section: 'equipment',
  },
  nonconformity: {
    labelKey: 'tabMeta.nonconformity.label',
    icon: 'AlertTriangle',
    actionKey: 'tabMeta.nonconformity.action',
    section: 'equipment',
  },

  // Management section
  disposal_review: {
    labelKey: 'tabMeta.disposal_review.label',
    icon: 'Trash2',
    actionKey: 'tabMeta.disposal_review.action',
    commentRequired: true,
    commentDialogTitleKey: 'tabMeta.disposal_review.commentDialogTitle',
    commentPlaceholderKey: 'tabMeta.disposal_review.commentPlaceholder',
    multiStep: true,
    multiStepType: 'disposal',
    section: 'management',
  },
  disposal_final: {
    labelKey: 'tabMeta.disposal_final.label',
    icon: 'Trash2',
    actionKey: 'tabMeta.disposal_final.action',
    multiStep: true,
    multiStepType: 'disposal',
    section: 'management',
  },
  plan_review: {
    labelKey: 'tabMeta.plan_review.label',
    icon: 'Calendar',
    actionKey: 'tabMeta.plan_review.action',
    multiStep: true,
    multiStepType: 'calibration_plan',
    section: 'management',
  },
  plan_final: {
    labelKey: 'tabMeta.plan_final.label',
    icon: 'Calendar',
    actionKey: 'tabMeta.plan_final.action',
    multiStep: true,
    multiStepType: 'calibration_plan',
    section: 'management',
  },
  software: {
    labelKey: 'tabMeta.software.label',
    icon: 'Code',
    actionKey: 'tabMeta.software.action',
    commentRequired: true,
    commentDialogTitleKey: 'tabMeta.software.commentDialogTitle',
    commentPlaceholderKey: 'tabMeta.software.commentPlaceholder',
    section: 'management',
  },
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
 * 구조화된 summary 데이터 (i18n용)
 *
 * 컴포넌트에서 t() 함수로 로컬라이즈된 summary를 생성할 때 사용.
 * summary 필드는 영어 기본값으로 유지되며, summaryData가 있을 때
 * getLocalizedSummary()로 로컬라이즈된 텍스트를 생성.
 */
export type ApprovalSummaryData =
  | { type: 'calibration'; equipmentId: string }
  | { type: 'checkout'; equipmentNames: string; direction: 'outgoing' | 'incoming' }
  | { type: 'calibration_plan'; year: string; siteId: string }
  | { type: 'equipment_request'; equipmentName: string; requestType: string }
  | { type: 'disposal'; equipmentName: string; managementNumber: string; step: 'review' | 'final' }
  | { type: 'software'; softwareName: string }
  | { type: 'inspection'; equipmentName: string }
  | { type: 'non_conformance'; cause: string }
  | {
      type: 'equipment_import';
      equipmentName: string;
      sourceType: 'rental' | 'internal_shared';
      vendorOrDepartment: string;
    };

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
  /** 구조화된 summary 데이터 — getLocalizedSummary()에서 i18n 렌더링용 */
  summaryData?: ApprovalSummaryData;
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

export interface ApprovalKpiResponse {
  /** 오늘 현재 사용자가 처리(승인+반려)한 건수 */
  todayProcessed: number;
  /** 현재 카테고리에서 URGENT_THRESHOLD_DAYS 이상 경과한 건수 (서버 집계) */
  urgentCount: number;
  /** 현재 카테고리 평균 대기일 (서버 집계) */
  avgWaitDays: number;
}

/**
 * 일괄 처리 결과
 */
export interface BulkActionResult {
  success: string[];
  failed: string[];
}

/** 장비 요청 유형 키 — i18n에서 requestTypes.* 키와 매칭 */
export const REQUEST_TYPES = ['create', 'update', 'delete'] as const;

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
        return this.getPendingInspections(teamId);
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
   *
   * 팀 필터링: 백엔드에서 역할 기반 자동 필터링 (technical_manager → teamId, others → site)
   */
  private async getPendingOutgoing(_teamId?: string): Promise<ApprovalItem[]> {
    try {
      const [regularCheckouts, vendorReturns] = await Promise.all([
        // Regular checkouts - backend filters by team/site automatically
        checkoutApi.getCheckouts({ statuses: 'pending' }),
        // Vendor returns - backend filters by team/site automatically
        checkoutApi.getCheckouts({ statuses: 'pending', purpose: 'return_to_vendor' }),
      ]);

      const regularItems = (regularCheckouts.data || []).map((item: Checkout) =>
        this.mapCheckoutToApprovalItem(item, 'outgoing')
      );

      const vendorReturnItems = (vendorReturns.data || []).map((item: Checkout) =>
        this.mapCheckoutToApprovalItem(item, 'outgoing')
      );

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
   *
   * 팀 필터링: 백엔드에서 역할 기반 자동 필터링
   */
  private async getPendingIncoming(_teamId?: string): Promise<ApprovalItem[]> {
    try {
      const [returns, rentalImports, sharedImports] = await Promise.all([
        // Equipment returning - backend filters automatically
        checkoutApi.getPendingReturnApprovals(),
        // Rental equipment arriving - backend filters by site (equipmentImports.site)
        equipmentImportApi.getList({ status: 'pending', sourceType: 'rental' }),
        // Shared equipment arriving - backend filters by site
        equipmentImportApi.getList({ status: 'pending', sourceType: 'internal_shared' }),
      ]);

      const returnItems = (returns.data || []).map((item: Checkout) =>
        this.mapCheckoutToApprovalItem(item, 'incoming')
      );

      const rentalItems = (rentalImports.data || []).map((item: EquipmentImport) =>
        this.mapEquipmentImportToApprovalItem(item, 'incoming')
      );

      const sharedItems = (sharedImports.data || []).map((item: EquipmentImport) =>
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
      const items = response.data || [];

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
   *
   * 팀 필터링: 백엔드에서 역할 기반 자동 필터링
   */
  private async getPendingCheckouts(_teamId?: string): Promise<ApprovalItem[]> {
    try {
      const response = await checkoutApi.getCheckouts({ statuses: 'pending' });
      // PaginatedResponse uses 'data' field
      const items = response.data || [];

      return items.map((item: Checkout) => this.mapCheckoutToApprovalItem(item, 'outgoing'));
    } catch {
      return [];
    }
  }

  /**
   * 반입 승인 대기 목록 조회
   *
   * @deprecated Use getPendingIncoming() instead (consolidates returns + imports)
   *
   * 팀 필터링: 백엔드에서 역할 기반 자동 필터링
   */
  private async getPendingReturns(_teamId?: string): Promise<ApprovalItem[]> {
    try {
      const response = await checkoutApi.getPendingReturnApprovals();
      // PaginatedResponse uses 'data' field
      const items = response.data || [];

      return items.map((item: Checkout) => this.mapCheckoutToApprovalItem(item, 'incoming'));
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

      // 수리 필터는 백엔드에서 pendingClose=true로 적용 (카운트 쿼리와 동일 조건)
      return items.map((item: NonConformance) => this.mapNonConformanceToApprovalItem(item));
    } catch {
      return [];
    }
  }

  /**
   * 중간점검 승인 대기 목록 조회
   * 서버에서 status=due (checkDate <= today) 필터링 — 클라이언트 날짜 로직 없음
   */
  private async getPendingInspections(teamId?: string): Promise<ApprovalItem[]> {
    try {
      const params = new URLSearchParams({ status: 'due' });
      if (teamId) params.set('teamId', teamId);
      const response = await apiClient.get(
        `${API_ENDPOINTS.CALIBRATIONS.INTERMEDIATE_CHECKS.ALL}?${params.toString()}`
      );
      const items = transformArrayResponse<Record<string, unknown>>(response);

      return items.map((item) => this.mapInspectionToApprovalItem(item));
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
      const items = response.data || [];

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
      const response = await apiClient.get(API_ENDPOINTS.APPROVALS.COUNTS);
      return transformSingleResponse<PendingCountsByCategory>(response) ?? this.getEmptyCounts();
    } catch (error) {
      console.error('Failed to fetch approval counts:', error);
      return this.getEmptyCounts();
    }
  }

  /**
   * 승인 KPI 조회 — 서버 사이드 집계
   *
   * @param category - 카테고리 (urgentCount/avgWaitDays 집계 대상)
   */
  async getKpi(category?: string): Promise<ApprovalKpiResponse> {
    try {
      const params = category ? `?category=${encodeURIComponent(category)}` : '';
      const response = await apiClient.get(`${API_ENDPOINTS.APPROVALS.KPI}${params}`);
      return (
        transformSingleResponse<ApprovalKpiResponse>(response) ?? {
          todayProcessed: 0,
          urgentCount: 0,
          avgWaitDays: 0,
        }
      );
    } catch {
      return { todayProcessed: 0, urgentCount: 0, avgWaitDays: 0 };
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
   *
   * ⚠️ CAS 버전 정책: 항상 최신 detail을 조회하여 CAS 버전을 사용합니다.
   * 이유: 승인/반려는 상태 전이(status transition) 액션으로, 사용자 편집 데이터가 없습니다.
   * 리스트 캐시의 stale 버전을 사용하면 다단계 승인(3-step 등)에서 VERSION_CONFLICT가 발생합니다.
   * (예: plan submit→review→approve 과정에서 casVersion이 단계마다 증가하지만,
   *  리스트 캐시는 최초 로딩 시점의 stale 버전을 보유)
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
        const { version } = await checkoutApi.getCheckout(id);
        await checkoutApi.approveCheckout(id, version, comment);
        break;
      }

      case 'incoming':
        // Incoming can be: checkout return OR equipment import
        // Determine type from originalData
        if (this.isCheckout(originalData)) {
          const { version } = await checkoutApi.getCheckout(id);
          await checkoutApi.approveReturn(id, { version, comment });
        } else if (this.isEquipmentImport(originalData)) {
          const { version } = await equipmentImportApi.getOne(id);
          await equipmentImportApi.approve(id, version, comment);
        } else {
          throw new Error('Unknown incoming item type');
        }
        break;

      // Specialized
      case 'equipment': {
        const { version: eqVersion } = await equipmentApi.getRequestByUuid(id);
        await equipmentApi.approveRequest(id, eqVersion);
        break;
      }
      case 'calibration': {
        const { version: calVersion } = await calibrationApi.getCalibration(id);
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
        const { version: ncVersion } = await nonConformancesApi.getNonConformance(id);
        await nonConformancesApi.closeNonConformance(id, {
          version: ncVersion,
          closureNotes: comment,
        });
        break;
      }
      case 'disposal_review': {
        if (!equipmentId) throw new Error('equipmentId is required for disposal review');
        const disposalReview = await getCurrentDisposalRequest(equipmentId);
        if (disposalReview?.version === undefined) throw new Error('Disposal request not found');
        await reviewDisposal(equipmentId, {
          version: disposalReview.version,
          decision: 'approve',
          opinion: comment || 'Approved',
        });
        break;
      }
      case 'disposal_final': {
        if (!equipmentId) throw new Error('equipmentId is required for disposal approval');
        const disposalFinal = await getCurrentDisposalRequest(equipmentId);
        if (disposalFinal?.version === undefined) throw new Error('Disposal request not found');
        await approveDisposal(equipmentId, {
          version: disposalFinal.version,
          decision: 'approve',
          comment: comment || 'Approved',
        });
        break;
      }
      case 'plan_review': {
        const { casVersion: reviewCasVersion } = await calibrationPlansApi.getCalibrationPlan(id);
        await calibrationPlansApi.reviewCalibrationPlan(id, {
          casVersion: reviewCasVersion,
          reviewComment: comment || undefined,
        });
        break;
      }
      case 'plan_final': {
        const { casVersion: approveCasVersion } = await calibrationPlansApi.getCalibrationPlan(id);
        await calibrationPlansApi.approveCalibrationPlan(id, {
          casVersion: approveCasVersion,
        });
        break;
      }
      case 'software': {
        if (!comment?.trim()) {
          throw new Error(
            'Software approval requires a comment (commentRequired: true in TAB_META)'
          );
        }
        const { version: softwareVersion } = await softwareApi.getSoftwareHistoryDetail(id);
        await softwareApi.approveSoftwareChange(id, {
          version: softwareVersion,
          approverComment: comment,
        });
        break;
      }
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
        const { version } = await checkoutApi.getCheckout(id);
        await checkoutApi.rejectCheckout(id, version, reason);
        break;
      }

      case 'incoming':
        if (this.isCheckout(originalData)) {
          const { version } = await checkoutApi.getCheckout(id);
          await checkoutApi.rejectReturn(id, { version, reason });
        } else if (this.isEquipmentImport(originalData)) {
          const { version } = await equipmentImportApi.getOne(id);
          await equipmentImportApi.reject(id, version, reason);
        } else {
          throw new Error('Unknown incoming item type');
        }
        break;

      // Specialized
      case 'equipment': {
        const { version: eqRejectVersion } = await equipmentApi.getRequestByUuid(id);
        await equipmentApi.rejectRequest(id, reason, eqRejectVersion);
        break;
      }
      case 'calibration': {
        const { version: calVersion } = await calibrationApi.getCalibration(id);
        await calibrationApi.rejectCalibration(id, {
          version: calVersion,
          rejectionReason: reason,
        });
        break;
      }
      case 'inspection':
        throw new Error('Inspection items cannot be rejected.');
      case 'nonconformity': {
        const { version: ncRejectVersion } = await nonConformancesApi.getNonConformance(id);
        await nonConformancesApi.rejectCorrection(id, {
          version: ncRejectVersion,
          rejectionReason: reason,
        });
        break;
      }
      case 'disposal_review': {
        if (!equipmentId) throw new Error('equipmentId is required for disposal review');
        const disposalReview = await getCurrentDisposalRequest(equipmentId);
        if (disposalReview?.version === undefined) throw new Error('Disposal request not found');
        await reviewDisposal(equipmentId, {
          version: disposalReview.version,
          decision: 'reject',
          opinion: reason || 'Rejected',
        });
        break;
      }
      case 'disposal_final': {
        if (!equipmentId) throw new Error('equipmentId is required for disposal approval');
        const disposalFinal = await getCurrentDisposalRequest(equipmentId);
        if (disposalFinal?.version === undefined) throw new Error('Disposal request not found');
        await approveDisposal(equipmentId, {
          version: disposalFinal.version,
          decision: 'reject',
          comment: reason || 'Rejected',
        });
        break;
      }
      case 'plan_review':
      case 'plan_final': {
        const { casVersion: rejectCasVersion } = await calibrationPlansApi.getCalibrationPlan(id);
        await calibrationPlansApi.rejectCalibrationPlan(id, {
          casVersion: rejectCasVersion,
          rejectionReason: reason,
        });
        break;
      }
      case 'software': {
        const { version: softwareVersion } = await softwareApi.getSoftwareHistoryDetail(id);
        await softwareApi.rejectSoftwareChange(id, {
          version: softwareVersion,
          rejectionReason: reason,
        });
        break;
      }
      default:
        throw new Error(`Unsupported category: ${category}`);
    }
  }

  /**
   * 일괄 승인 처리
   *
   * Note: For disposal categories and consolidated categories (outgoing/incoming),
   * we need to fetch the items first to get equipmentId or originalData for type discrimination
   */
  async bulkApprove(
    category: ApprovalCategory,
    ids: string[],
    approverId: string,
    comment?: string
  ): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    // incoming 타입 판별, disposal equipmentId 추출에 originalData 필요
    const itemsMap = await this.fetchItemsMapIfNeeded(category);

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
   * we need to fetch the items first to get equipmentId or originalData for type discrimination
   */
  async bulkReject(
    category: ApprovalCategory,
    ids: string[],
    approverId: string,
    reason: string
  ): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    // incoming 타입 판별, disposal equipmentId 추출에 originalData 필요
    const itemsMap = await this.fetchItemsMapIfNeeded(category);

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
   * originalData가 bulk 처리 시 필요한 카테고리
   *
   * CAS 버전은 approve/reject 내부에서 항상 최신 detail을 조회하므로 여기서 불필요.
   * originalData는 타입 판별(incoming: checkout vs import)과
   * equipmentId 추출(disposal)에만 사용됩니다.
   */
  private static readonly ORIGINAL_DATA_REQUIRED_CATEGORIES = new Set<ApprovalCategory>([
    'incoming',
    'disposal_review',
    'disposal_final',
  ]);

  /**
   * bulk approve/reject 시 타입 판별 또는 equipmentId가 필요한 카테고리에 대해 items를 사전 fetch
   */
  private async fetchItemsMapIfNeeded(
    category: ApprovalCategory
  ): Promise<Map<string, ApprovalItem> | undefined> {
    if (!ApprovalsApi.ORIGINAL_DATA_REQUIRED_CATEGORIES.has(category)) return undefined;
    const items = await this.getPendingItems(category);
    return new Map(items.map((item) => [item.id, item]));
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
        : calibration.registeredByRole === URVal.TEST_ENGINEER
          ? 'Test Engineer'
          : 'Technical Manager',
      requesterTeam: team?.name ? String(team.name) : '',
      requestedAt: calibration.createdAt,
      summary: `Equipment (${calibration.equipmentId}) Calibration Record`,
      summaryData: { type: 'calibration', equipmentId: calibration.equipmentId },
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
    const equipmentNames = checkout.equipment?.map((e) => e.name).join(', ') || 'Equipment';

    // user.team 관계를 통해 팀 정보 추출
    const user = checkout.user as Record<string, unknown> | undefined;
    const team = user?.team as Record<string, unknown> | undefined;

    return {
      id: checkout.id,
      category,
      status: this.mapCheckoutStatus(checkout.status),
      requesterId: checkout.requesterId || checkout.userId || '',
      requesterName: checkout.user?.name || 'Unknown',
      requesterTeam: team?.name ? String(team.name) : '',
      requestedAt: checkout.createdAt,
      summary:
        category === 'outgoing'
          ? `${equipmentNames} Checkout Request`
          : `${equipmentNames} Return Pending`,
      summaryData: { type: 'checkout', equipmentNames, direction: category },
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
      requesterName: plan.authorName ? String(plan.authorName) : 'Unknown',
      requesterTeam: plan.teamName ? String(plan.teamName) : '',
      requestedAt: String(plan.createdAt || ''),
      summary: `${plan.year || ''} ${siteLabel} Calibration Plan`,
      summaryData: { type: 'calibration_plan', year: String(plan.year || ''), siteId },
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
      requesterName: item.changerName ? String(item.changerName) : 'Unknown',
      requesterTeam: item.teamName ? String(item.teamName) : '',
      requestedAt: String(item.changedAt || item.createdAt || ''),
      summary: `${item.softwareName || 'Software'} Change Request`,
      summaryData: { type: 'software', softwareName: String(item.softwareName || 'Software') },
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
      requesterName: user?.name ? String(user.name) : 'Unknown',
      requesterTeam: team?.name ? String(team.name) : '',
      requestedAt: nc.correctionDate || nc.discoveryDate,
      summary: `${nc.cause} (Corrected)`,
      summaryData: { type: 'non_conformance', cause: nc.cause },
      details: {
        equipmentId: nc.equipmentId,
        discoveryDate: nc.discoveryDate,
        cause: nc.cause,
        ncType: nc.ncType,
        correctionContent: nc.correctionContent,
        correctionDate: nc.correctionDate,
        actionPlan: nc.actionPlan,
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
      requesterName: 'Auto Alert',
      requesterTeam: item.teamName ? String(item.teamName) : item.team ? String(item.team) : '',
      requestedAt: String(item.nextIntermediateCheckDate || item.createdAt || ''),
      summary: `${item.equipmentName || 'Equipment'} Intermediate Check`,
      summaryData: { type: 'inspection', equipmentName: String(item.equipmentName || 'Equipment') },
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
      status: category === 'disposal_review' ? UASVal.PENDING : UASVal.REVIEWED,
      requesterId: String(item.requestedBy || ''),
      requesterName: requester?.name ? String(requester.name) : 'Unknown',
      requesterTeam: team?.name ? String(team.name) : '',
      requestedAt: String(item.requestedAt || ''),
      summary: `${equipment?.name || 'Equipment'} (${equipment?.managementNumber || ''}) Disposal ${category === 'disposal_review' ? 'Review' : 'Approval'}`,
      summaryData: {
        type: 'disposal',
        equipmentName: String(equipment?.name || 'Equipment'),
        managementNumber: String(equipment?.managementNumber || ''),
        step: category === 'disposal_review' ? ('review' as const) : ('final' as const),
      },
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
      ? `${equipmentName} ${requestType} Request`
      : `Equipment ${requestType} Request`;

    return {
      id: String(item.id),
      category: 'equipment',
      status: this.mapEquipmentRequestStatus(String(item.approvalStatus || '')),
      requesterId: String(item.requestedBy || ''),
      requesterName: requester?.name ? String(requester.name) : 'Unknown',
      requesterTeam: (() => {
        const team = requester?.team as Record<string, unknown> | undefined;
        return team?.name ? String(team.name) : '';
      })(),
      requestedAt: String(item.requestedAt || ''),
      summary,
      summaryData: { type: 'equipment_request', equipmentName, requestType },
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
      case CASVal.PENDING_APPROVAL:
        return UASVal.PENDING;
      case CASVal.APPROVED:
        return UASVal.APPROVED;
      case CASVal.REJECTED:
        return UASVal.REJECTED;
      default:
        return UASVal.PENDING;
    }
  }

  private mapCalibrationStatus(status?: string): UnifiedApprovalStatus {
    switch (status) {
      case CASVal.PENDING_APPROVAL:
        return UASVal.PENDING;
      case CASVal.APPROVED:
        return UASVal.APPROVED;
      case CASVal.REJECTED:
        return UASVal.REJECTED;
      default:
        return UASVal.PENDING;
    }
  }

  private mapCheckoutStatus(status: string): UnifiedApprovalStatus {
    switch (status) {
      case CSVal.PENDING:
        return UASVal.PENDING;
      case CSVal.APPROVED:
        return UASVal.APPROVED;
      case CSVal.REJECTED:
        return UASVal.REJECTED;
      case CSVal.RETURNED:
        return UASVal.PENDING; // 반입 승인 대기
      default:
        return UASVal.PENDING;
    }
  }

  private mapPlanStatus(status: string): UnifiedApprovalStatus {
    switch (status) {
      case CPSVal.PENDING_REVIEW:
        return UASVal.PENDING_REVIEW;
      case CPSVal.PENDING_APPROVAL:
        return UASVal.REVIEWED;
      case CPSVal.APPROVED:
        return UASVal.APPROVED;
      case CPSVal.REJECTED:
        return UASVal.REJECTED;
      default:
        return UASVal.PENDING;
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
    const isRental = item.sourceType === EISrcVal.RENTAL;
    const vendorOrDepartment = isRental
      ? String(item.vendorName || '')
      : String(item.ownerDepartment || '');
    const summary = isRental
      ? `${item.equipmentName} Rental Import (${item.vendorName})`
      : `${item.equipmentName} Shared Equipment Import (${item.ownerDepartment})`;

    return {
      id: item.id,
      category,
      status: UASVal.PENDING,
      requesterId: item.requesterId,
      requesterName: requester?.name ? String(requester.name) : 'Requester',
      requesterTeam: team?.name ? String(team.name) : '',
      requestedAt: item.createdAt,
      summary,
      summaryData: {
        type: 'equipment_import',
        equipmentName: item.equipmentName,
        sourceType: isRental ? ('rental' as const) : ('internal_shared' as const),
        vendorOrDepartment,
      },
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
}

export const approvalsApi = new ApprovalsApi();
export default approvalsApi;
