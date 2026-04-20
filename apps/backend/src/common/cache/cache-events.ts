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
}
