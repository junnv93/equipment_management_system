/**
 * 캐시 전용 이벤트 상수 (SSOT)
 *
 * NOTIFICATION_EVENTS와 분리된 캐시 무효화 전용 이벤트.
 * - NOTIFICATION_EVENTS: DB notifications 테이블 insert + 알림 발송
 * - CACHE_EVENTS: 캐시 무효화만 (알림 없음, 에러 허용 UX)
 *
 * 정책: ADR-0012 (cache event channel responsibility separation).
 *   - 동일 status 전이의 캐시 무효화는 CACHE_EVENTS 채널만 사용.
 *   - NOTIFICATION_EVENTS는 알림/SSE/downstream side-effect 전용.
 *
 * 명명 규약 (신규 entry 필수, LEGACY 예외는 CACHE_EVENT_LEGACY_NAMING_ALLOWLIST):
 *   - `cache.<domainCamel>.<verbCamel>` (예: `cache.calibration.created`)
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

/**
 * CACHE_EVENTS 도메인 → NOTIFICATION_EVENTS 도메인 동의어 (SSOT, ADR-0012).
 *
 * cache-event-listener.ts `validateDualChannelExclusivity()` boot-time invariant +
 * scripts/audit-cache-event-channels.mjs audit script 양쪽이 본 map을 import해서
 * mirror pair 검출에 사용한다.
 *
 * 사용 예: CACHE_EVENTS의 `cache.swValidation.submitted` ↔ NOTIFICATION_EVENTS의
 * `softwareValidation.submitted` 가 mirror라는 것을 자동 추론하려면 도메인 표기
 * 차이(`swValidation` vs `softwareValidation`)를 본 map에 등록.
 *
 * cache-events-naming.spec.ts가 dead synonym(미사용 키)을 자동 차단.
 */
export const CACHE_TO_NOTIFICATION_DOMAIN_SYNONYM = {
  swValidation: 'softwareValidation',
} as const;

/**
 * LEGACY allowlist — `cache.<domain>.<verb>` 명명 규약을 따르지 않는 historical 키.
 *
 * 신규 CACHE_EVENTS entry는 반드시 `cache.<domain>.<verb>` 형식이어야 하나(ADR-0012),
 * 다음 키들은 본 정책 채택 이전에 도입되어 `cache.` prefix 없이 등록되어 있다.
 * 일괄 rename 시 호출자 마이그레이션 범위가 크므로 점진 처리.
 *
 * 신규 entry 추가는 cache-events-naming.spec.ts가 `^cache\.` 패턴으로 차단한다.
 * 본 allowlist 갱신은 신규 LEGACY 도입을 의미하므로 review 필수.
 */
export const CACHE_EVENT_LEGACY_NAMING_ALLOWLIST: ReadonlySet<string> = new Set([
  'nonConformance.attachmentUploaded',
  'nonConformance.attachmentDeleted',
  'repairHistory.created',
  'repairHistory.updated',
  'repairHistory.deleted',
]);

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
