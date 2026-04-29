/**
 * @internal — approvals-api 전용 백엔드 응답 DTO 인터페이스
 *
 * 백엔드가 반환하는 플랫/중첩 응답 형태를 TypeScript로 표현.
 * Record<string, unknown> 캐스트를 제거하기 위한 SSOT 타입 정의.
 * 이 파일의 타입은 approvals-api.ts barrel에서 re-export하지 않는다.
 */

/** 폐기 요청 응답 행 — 백엔드 DisposalRequest + relations */
export interface DisposalApprovalRow {
  id: string;
  requestedBy?: string;
  requestedAt?: string;
  reason?: string;
  reasonDetail?: string;
  equipmentId?: string;
  reviewOpinion?: string;
  reviewedAt?: string;
  equipment?: { name?: string; managementNumber?: string };
  requester?: { name?: string; team?: { name?: string } };
}

/** 장비 요청 응답 행 — 백엔드 EquipmentRequest + relations */
export interface EquipmentRequestApprovalRow {
  id: string;
  requestType?: string;
  requestedBy?: string;
  requestedAt?: string;
  approvalStatus?: string;
  requestData?: string | Record<string, string>;
  equipmentId?: string;
  equipment?: { name?: string };
  requester?: { name?: string; team?: { name?: string } };
}

/** 교정계획서 응답 행 — 백엔드 CalibrationPlan (플랫 LEFT JOIN 포함) */
export interface CalibrationPlanApprovalRow {
  [key: string]: unknown;
  id: string;
  status?: string;
  createdBy?: string;
  createdAt?: string;
  year?: string | number;
  siteId?: string;
  authorName?: string;
  teamName?: string;
}

/** 소프트웨어 검증 응답 행 — 백엔드 SoftwareValidation (플랫 LEFT JOIN 포함) */
export interface SoftwareValidationApprovalRow {
  [key: string]: unknown;
  id: string;
  changedBy?: string;
  changerName?: string;
  teamName?: string;
  changedAt?: string;
  createdAt?: string;
  softwareName?: string;
}

/** 중간점검 응답 행 — 백엔드 IntermediateCheck (플랫 LEFT JOIN 포함) */
export interface InspectionApprovalRow {
  [key: string]: unknown;
  id?: string;
  calibrationId?: string;
  teamName?: string;
  team?: string;
  nextIntermediateCheckDate?: string;
  createdAt?: string;
  equipmentName?: string;
}

/** 자체점검 승인 대기 응답 행 — 백엔드 SelfInspectionsService.findPendingApproval() */
export interface SelfInspectionApprovalRow {
  [key: string]: unknown;
  id: string;
  equipmentId: string;
  equipmentName: string;
  teamName: string;
  submittedAt: string | null;
}

/** 자체점검 단건 조회 응답 — approve/reject 시 version 추출용 */
export interface SelfInspectionDetail {
  id: string;
  version: number;
}
