/**
 * 캐시 전용 이벤트 상수 (SSOT)
 *
 * NOTIFICATION_EVENTS와 분리된 캐시 무효화 전용 이벤트.
 * - NOTIFICATION_EVENTS: DB notifications 테이블 insert + 알림 발송
 * - CACHE_EVENTS: 캐시 무효화만 (알림 없음, 에러 허용 UX)
 *
 * emit 위치: Service 계층 전용 (Controller emitAsync 금지 — .eslintrc.js AD-8)
 */
export const CACHE_EVENTS = {
  // ─── 부적합 첨부 (NC Attachment) ───
  NC_ATTACHMENT_UPLOADED: 'nonConformance.attachmentUploaded',
  NC_ATTACHMENT_DELETED: 'nonConformance.attachmentDeleted',

  // ─── 수리 이력 (Repair History) ───
  REPAIR_HISTORY_CREATED: 'repairHistory.created',
  REPAIR_HISTORY_UPDATED: 'repairHistory.updated',
  REPAIR_HISTORY_DELETED: 'repairHistory.deleted',

  // ─── 소프트웨어 유효성 확인 (SW Validation) ───
  // 캐시 무효화 전용: list + testSoftware.detail 두 패턴만 무효화 (NOTIFICATION_EVENTS와 분리)
  SW_VALIDATION_SUBMITTED: 'cache.swValidation.submitted',
  SW_VALIDATION_APPROVED: 'cache.swValidation.approved',
  SW_VALIDATION_QUALITY_APPROVED: 'cache.swValidation.qualityApproved',
  SW_VALIDATION_REJECTED: 'cache.swValidation.rejected',

  // ─── 교정 (Calibration) ───
  // NOTIFICATION_EVENTS.CALIBRATION_*는 알림(DB insert + 발송)만 담당.
  // 캐시 무효화는 이 채널에서 독립 처리.
  CALIBRATION_CREATED: 'cache.calibration.created',
  CALIBRATION_UPDATED: 'cache.calibration.updated',
  CALIBRATION_CERTIFICATE_UPLOADED: 'cache.calibration.certificateUploaded',
  CALIBRATION_CERTIFICATE_REVISED: 'cache.calibration.certificateRevised',

  // ─── Inspection Form Template (Phase 1B-backend) ───
  // 직전 점검 prefill source가 *전용 template DB*로 이동 (LIMS Template Snapshot 패턴).
  // template create/update/version_up 시 InspectionFormDialog query invalidate.
  // 미구현 시 사용자가 stale prefill 본 후 충돌 가능 → 1B-backend 출시 시 함께 활성화.
  INSPECTION_TEMPLATE_CREATED: 'cache.inspection.template.created',
  INSPECTION_TEMPLATE_UPDATED: 'cache.inspection.template.updated',
  INSPECTION_TEMPLATE_VERSION_UP: 'cache.inspection.template.versionUp',
} as const;

export type CacheEventName = (typeof CACHE_EVENTS)[keyof typeof CACHE_EVENTS];

/** NC 첨부 캐시 이벤트 페이로드 */
export interface NCAttachmentCachePayload {
  ncId: string;
  equipmentId: string;
  documentId: string;
  actorId: string | null;
}

/** 수리 이력 캐시 이벤트 페이로드 */
export interface RepairHistoryCachePayload {
  equipmentId: string;
}

/** SW 유효성 확인 캐시 이벤트 페이로드 */
export interface SwValidationCachePayload {
  validationId: string;
  testSoftwareId: string;
}

/** 교정 캐시 이벤트 페이로드 */
export interface CalibrationCachePayload {
  calibrationId: string;
  equipmentId: string;
  calibrationDate: Date;
  teamId: string;
  actorId: string;
  documentIds?: string[];
  /** 교정계획서 항목과 연결된 경우 planItemId. 연결된 계획서 캐시 무효화에 사용. */
  linkedPlanItemId?: string | null;
}

/**
 * Inspection Form Template 캐시 이벤트 페이로드 (Phase 1B-backend).
 *
 * 디자인 리뷰 §N + LIMS Template Snapshot 패턴.
 * frontend 1A-a/b는 이미 완료 — 1B-backend 출시 시 본 이벤트 발행 시작.
 */
export interface InspectionTemplateCachePayload {
  templateId: string;
  equipmentId: string;
  inspectionType: 'intermediate' | 'self';
  /** 변경된 version (auto-create는 1, 이후 +1) */
  version: number;
  /** 첫 승인 트리거 inspection (auto-create 시) */
  sourceInspectionId?: string | null;
  /** 명시 수정 trigger 사용자 (admin only) */
  actorId: string | null;
}
