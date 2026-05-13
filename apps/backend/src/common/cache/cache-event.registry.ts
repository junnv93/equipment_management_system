import { NOTIFICATION_EVENTS } from '../../modules/notifications/events/notification-events';
import { CACHE_EVENTS } from './cache-events';
import { CACHE_KEY_PREFIXES } from './cache-key-prefixes';

/**
 * 캐시 무효화 액션 타입
 *
 * CacheInvalidationHelper의 메서드에 1:1 매핑되는 액션.
 * payload 필드를 참조하여 동적으로 무효화 대상을 결정한다.
 */
export interface CacheInvalidationAction {
  /** CacheInvalidationHelper 메서드명 */
  method:
    | 'invalidateAllDashboard'
    | 'invalidateAllEquipment'
    | 'invalidateEquipmentDetail'
    | 'invalidateEquipmentLists'
    | 'invalidateAfterEquipmentUpdate'
    | 'invalidateAfterNonConformanceCreation'
    | 'invalidateAfterNonConformanceStatusChange'
    | 'invalidateNcDerivedCaches'
    | 'invalidateAfterDisposal'
    | 'invalidateAfterCalibrationPlanUpdate';

  /** payload에서 equipmentId를 추출할 필드명 (기본: 'equipmentId') */
  equipmentIdField?: string;

  /** payload에서 planId를 추출할 필드명 */
  planIdField?: string;

  /** invalidateAfterEquipmentUpdate의 statusChanged 파라미터 */
  statusChanged?: boolean;

  /** invalidateAfterEquipmentUpdate의 teamIdChanged 파라미터 */
  teamIdChanged?: boolean;

  /** invalidateAfterNonConformanceStatusChange의 equipmentStatusChanged 파라미터 */
  equipmentStatusChanged?: boolean;
}

/**
 * 추가 패턴 기반 캐시 삭제 (CacheInvalidationHelper에 없는 캐시)
 *
 * 서비스별 로컬 캐시 키 패턴을 이벤트에 연결한다.
 * 예: checkout 승인 → checkout:* 캐시 삭제
 */
export interface CachePatternDeletion {
  /** SimpleCacheService.deleteByPattern()에 전달할 정규식 패턴 */
  pattern: string;
}

export interface CacheInvalidationRule {
  /** CacheInvalidationHelper 메서드 호출 목록 */
  actions: CacheInvalidationAction[];
  /** 추가 패턴 삭제 (서비스 로컬 캐시) */
  patterns?: CachePatternDeletion[];
}

/**
 * 이벤트 → 캐시 무효화 규칙 레지스트리 (SSOT)
 *
 * 설계 원칙:
 * 1. 모든 상태 변경 이벤트는 최소한 대시보드 캐시를 무효화
 * 2. 장비 상태에 영향을 주는 이벤트는 장비 상세/목록도 무효화
 * 3. 패턴 기반 삭제로 서비스 로컬 캐시도 커버
 *
 * 새 이벤트 추가 시: 이 레지스트리에 규칙을 추가하면 자동 처리 — 코드 변경 0
 *
 * 책임 경계 (서비스 레이어 vs 레지스트리):
 * - 서비스 레이어의 invalidateCache(): 도메인 로컬 캐시를 트랜잭션 직후 동기 삭제
 *   (list/detail/pending 등 — 쓰기 직후 읽기 일관성 보장)
 * - 이 레지스트리: 크로스 도메인 캐시를 이벤트 발행 후 비동기 삭제
 *   (dashboard/approvals 통계 — 약간의 stale 허용 가능)
 */
/**
 * LEGACY allowlist — `${PREFIX}*` wholesale pattern을 사용하는 historical entry.
 *
 * 라운드 #3 갭 O (ADR-0012 §Decision-2): wholesale 패턴은 신규 entry에서 금지.
 * audit script (`scripts/audit-cache-event-channels.mjs`)가 신규 wholesale 추가 시 fail.
 * 다음 entry들은 sprint 도입 전 wholesale 사용 — 점진 마이그레이션 대상.
 *
 * 마이그레이션 패턴: `${PREFIX}*` → `${PREFIX}list:*` + `${PREFIX}pending:*` + `${PREFIX}detail:*` 등.
 * 각 도메인의 service-local invalidateCache()와 책임 분리 정합 필요.
 *
 * 본 allowlist 갱신은 신규 wholesale 도입을 의미하므로 review 필수.
 */
export const CACHE_INVALIDATION_WHOLESALE_LEGACY_ALLOWLIST: ReadonlySet<string> = new Set([
  // Checkouts 10 entries — 2026-05-13 `cache-wholesale-migration-checkouts` sprint에서
  // list:* + summary:* + detail:* specific sub-prefix로 분해됨 (allowlist 제거 완료).
  // Disposal (1 — disposal-requests:* prefix)
  'NOTIFICATION_EVENTS.DISPOSAL_REJECTED',
  // Equipment imports (3 — equipment-imports:* prefix)
  'NOTIFICATION_EVENTS.IMPORT_CREATED',
  'NOTIFICATION_EVENTS.IMPORT_APPROVED',
  'NOTIFICATION_EVENTS.IMPORT_REJECTED',
  // Calibration factors (2 — calibration-factors:* prefix)
  'NOTIFICATION_EVENTS.CALIBRATION_FACTOR_APPROVED',
  'NOTIFICATION_EVENTS.CALIBRATION_FACTOR_REJECTED',
  // Intermediate inspection (1 — calibration:* prefix)
  'NOTIFICATION_EVENTS.INTERMEDIATE_CHECK_COMPLETED',
  // Inspection form template (3 events × 3 patterns — inspection-form-templates/intermediate-inspections/self-inspections wholesale)
  'CACHE_EVENTS.INSPECTION_TEMPLATE_CREATED',
  'CACHE_EVENTS.INSPECTION_TEMPLATE_UPDATED',
  'CACHE_EVENTS.INSPECTION_TEMPLATE_VERSION_UP',
]);

export const CACHE_INVALIDATION_REGISTRY: Record<string, CacheInvalidationRule> = {
  // ─── 반출 (Checkout) ───
  // 모든 반출 이벤트는 대시보드 카운트에 영향 + checkout 캐시 무효화
  [NOTIFICATION_EVENTS.CHECKOUT_CREATED]: {
    actions: [{ method: 'invalidateAllDashboard' }],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}list:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}summary:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}detail:*` },
    ],
  },
  [NOTIFICATION_EVENTS.CHECKOUT_APPROVED]: {
    actions: [
      { method: 'invalidateAllDashboard' },
      { method: 'invalidateEquipmentDetail', equipmentIdField: 'equipmentId' },
    ],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}list:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}summary:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}detail:*` },
    ],
  },
  [NOTIFICATION_EVENTS.CHECKOUT_REJECTED]: {
    actions: [{ method: 'invalidateAllDashboard' }],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}list:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}summary:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}detail:*` },
    ],
  },
  // rental 2-step 승인: 장비 상태 미변경 → invalidateEquipmentDetail 불필요
  [NOTIFICATION_EVENTS.CHECKOUT_BORROWER_APPROVED]: {
    actions: [{ method: 'invalidateAllDashboard' }],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}list:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}summary:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}detail:*` },
    ],
  },
  [NOTIFICATION_EVENTS.CHECKOUT_BORROWER_REJECTED]: {
    actions: [{ method: 'invalidateAllDashboard' }],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}list:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}summary:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}detail:*` },
    ],
  },
  [NOTIFICATION_EVENTS.CHECKOUT_STARTED]: {
    actions: [
      {
        method: 'invalidateAfterEquipmentUpdate',
        equipmentIdField: 'equipmentId',
        statusChanged: true,
      },
    ],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}list:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}summary:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}detail:*` },
    ],
  },
  [NOTIFICATION_EVENTS.CHECKOUT_RETURNED]: {
    actions: [
      {
        method: 'invalidateAfterEquipmentUpdate',
        equipmentIdField: 'equipmentId',
        statusChanged: true,
      },
    ],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}list:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}summary:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}detail:*` },
    ],
  },
  [NOTIFICATION_EVENTS.CHECKOUT_RETURN_APPROVED]: {
    actions: [
      {
        method: 'invalidateAfterEquipmentUpdate',
        equipmentIdField: 'equipmentId',
        statusChanged: true,
      },
    ],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}list:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}summary:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}detail:*` },
    ],
  },
  [NOTIFICATION_EVENTS.CHECKOUT_RETURN_REJECTED]: {
    actions: [{ method: 'invalidateAllDashboard' }],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}list:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}summary:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}detail:*` },
    ],
  },
  [NOTIFICATION_EVENTS.CHECKOUT_OVERDUE]: {
    actions: [{ method: 'invalidateAllDashboard' }],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}list:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}summary:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}detail:*` },
    ],
  },

  // ─── 교정 (Calibration) ───
  [NOTIFICATION_EVENTS.CALIBRATION_CREATED]: {
    actions: [
      { method: 'invalidateAllDashboard' },
      { method: 'invalidateEquipmentDetail', equipmentIdField: 'equipmentId' },
    ],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.CALIBRATION}list:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CALIBRATION}pending:*` },
    ],
  },
  [NOTIFICATION_EVENTS.CALIBRATION_APPROVED]: {
    actions: [
      {
        method: 'invalidateAfterEquipmentUpdate',
        equipmentIdField: 'equipmentId',
        statusChanged: true,
      },
    ],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.CALIBRATION}list:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CALIBRATION}pending:*` },
    ],
  },
  [NOTIFICATION_EVENTS.CALIBRATION_REJECTED]: {
    actions: [
      { method: 'invalidateAllDashboard' },
      { method: 'invalidateEquipmentDetail', equipmentIdField: 'equipmentId' },
    ],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.CALIBRATION}list:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CALIBRATION}pending:*` },
    ],
  },
  [NOTIFICATION_EVENTS.CALIBRATION_DUE_SOON]: {
    actions: [{ method: 'invalidateAllDashboard' }],
  },
  [NOTIFICATION_EVENTS.CALIBRATION_OVERDUE]: {
    actions: [
      {
        method: 'invalidateAfterEquipmentUpdate',
        equipmentIdField: 'equipmentId',
        statusChanged: true,
      },
    ],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.CALIBRATION}list:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CALIBRATION}pending:*` },
    ],
  },

  // ─── 교정계획 (Calibration Plan) ───
  [NOTIFICATION_EVENTS.CALIBRATION_PLAN_SUBMITTED]: {
    actions: [
      { method: 'invalidateAllDashboard' },
      { method: 'invalidateAfterCalibrationPlanUpdate', planIdField: 'planId' },
    ],
  },
  [NOTIFICATION_EVENTS.CALIBRATION_PLAN_REVIEWED]: {
    actions: [
      { method: 'invalidateAllDashboard' },
      { method: 'invalidateAfterCalibrationPlanUpdate', planIdField: 'planId' },
    ],
  },
  [NOTIFICATION_EVENTS.CALIBRATION_PLAN_APPROVED]: {
    actions: [
      { method: 'invalidateAllDashboard' },
      { method: 'invalidateAfterCalibrationPlanUpdate', planIdField: 'planId' },
    ],
  },
  [NOTIFICATION_EVENTS.CALIBRATION_PLAN_REJECTED]: {
    actions: [
      { method: 'invalidateAllDashboard' },
      { method: 'invalidateAfterCalibrationPlanUpdate', planIdField: 'planId' },
    ],
  },

  // ─── 부적합 (Non-Conformance) ───
  [NOTIFICATION_EVENTS.NC_CREATED]: {
    actions: [{ method: 'invalidateAfterNonConformanceCreation', equipmentIdField: 'equipmentId' }],
  },
  [NOTIFICATION_EVENTS.NC_CORRECTED]: {
    actions: [
      {
        method: 'invalidateAfterNonConformanceStatusChange',
        equipmentIdField: 'equipmentId',
        equipmentStatusChanged: false,
      },
    ],
  },
  [NOTIFICATION_EVENTS.NC_CLOSED]: {
    actions: [
      {
        method: 'invalidateAfterNonConformanceStatusChange',
        equipmentIdField: 'equipmentId',
        equipmentStatusChanged: true,
      },
    ],
  },
  [NOTIFICATION_EVENTS.NC_CORRECTION_REJECTED]: {
    actions: [
      {
        method: 'invalidateAfterNonConformanceStatusChange',
        equipmentIdField: 'equipmentId',
        equipmentStatusChanged: false,
      },
    ],
  },
  [CACHE_EVENTS.NC_ATTACHMENT_UPLOADED]: {
    actions: [
      {
        method: 'invalidateNcDerivedCaches',
        equipmentIdField: 'equipmentId',
      },
    ],
  },
  [CACHE_EVENTS.NC_ATTACHMENT_DELETED]: {
    actions: [
      {
        method: 'invalidateNcDerivedCaches',
        equipmentIdField: 'equipmentId',
      },
    ],
  },

  // ─── 장비 요청 (Equipment Request) ───
  [NOTIFICATION_EVENTS.EQUIPMENT_REQUEST_CREATED]: {
    actions: [{ method: 'invalidateAllDashboard' }],
  },
  [NOTIFICATION_EVENTS.EQUIPMENT_REQUEST_APPROVED]: {
    actions: [
      {
        method: 'invalidateAfterEquipmentUpdate',
        equipmentIdField: 'equipmentId',
        statusChanged: true,
      },
    ],
  },
  [NOTIFICATION_EVENTS.EQUIPMENT_REQUEST_REJECTED]: {
    actions: [{ method: 'invalidateAllDashboard' }],
  },

  // ─── 폐기 (Disposal) ───
  [NOTIFICATION_EVENTS.DISPOSAL_REQUESTED]: {
    actions: [{ method: 'invalidateAfterDisposal', equipmentIdField: 'equipmentId' }],
  },
  [NOTIFICATION_EVENTS.DISPOSAL_REVIEWED]: {
    actions: [{ method: 'invalidateAfterDisposal', equipmentIdField: 'equipmentId' }],
  },
  [NOTIFICATION_EVENTS.DISPOSAL_APPROVED]: {
    actions: [{ method: 'invalidateAfterDisposal', equipmentIdField: 'equipmentId' }],
  },
  [NOTIFICATION_EVENTS.DISPOSAL_REJECTED]: {
    actions: [
      { method: 'invalidateAllDashboard' },
      { method: 'invalidateEquipmentDetail', equipmentIdField: 'equipmentId' },
    ],
    patterns: [{ pattern: `${CACHE_KEY_PREFIXES.DISPOSAL_REQUESTS}*` }],
  },

  // ─── 장비 반입 (Equipment Import) ───
  [NOTIFICATION_EVENTS.IMPORT_CREATED]: {
    actions: [{ method: 'invalidateAllDashboard' }],
    patterns: [{ pattern: `${CACHE_KEY_PREFIXES.EQUIPMENT_IMPORTS}*` }],
  },
  [NOTIFICATION_EVENTS.IMPORT_APPROVED]: {
    actions: [
      {
        method: 'invalidateAfterEquipmentUpdate',
        equipmentIdField: 'equipmentId',
        statusChanged: true,
      },
    ],
    patterns: [{ pattern: `${CACHE_KEY_PREFIXES.EQUIPMENT_IMPORTS}*` }],
  },
  [NOTIFICATION_EVENTS.IMPORT_REJECTED]: {
    actions: [{ method: 'invalidateAllDashboard' }],
    patterns: [{ pattern: `${CACHE_KEY_PREFIXES.EQUIPMENT_IMPORTS}*` }],
  },

  // ─── 소프트웨어 유효성 확인 (Software Validation — cache-only channel) ───
  // 정책: ADR-0012 (cache event channel responsibility separation).
  // NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_*는 알림 발송/SSE/downstream side-effect(test-software 자격 부여) 전용으로 유지.
  // 캐시 무효화는 이 채널(CACHE_EVENTS)에서 독립 처리 — calibration 패턴 정합.
  //
  // 책임 분리 (ADR-0012 §Decision):
  // - 서비스 레이어(invalidateCache, sync): 도메인 로컬 캐시 동기 무효화 — 트랜잭션 직후 read-after-write 일관성 보장
  //     → sw-validations:detail:<id> + list:* + pending:* + test-software:detail:<id>
  // - 이 레지스트리(CACHE_EVENTS 채널, async): 크로스 도메인 + broader sub-prefix 안전망
  //     → dashboard:* + approvals:* (invalidateAllDashboard)
  //     + sw-validations:list:* + pending:* + detail:* (specific sub-prefix — wholesale `*` 금지)
  //     + test-software:detail:* (다른 도메인 — SW validation status가 test-software 자격에 영향)
  //
  // 회귀 차단:
  //   - cache-event-listener.ts `validateDualChannelExclusivity()` 부팅타임 invariant
  //   - scripts/audit-cache-event-channels.mjs proactive audit
  //   - cache-events-naming.spec.ts 명명 규약 강제
  //
  // 라운드 #3 갭 A: registry는 `list:*` + `pending:*` 만 무효화 (detail:* 제외).
  // `detail:<id>` 는 service-local invalidateCache()가 sync로 단독 책임 (read-after-write).
  // calibration registry 패턴(line ~404) 완전 정합.
  [CACHE_EVENTS.SW_VALIDATION_SUBMITTED]: {
    actions: [{ method: 'invalidateAllDashboard' }],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.SOFTWARE_VALIDATIONS}list:*` },
      { pattern: `${CACHE_KEY_PREFIXES.SOFTWARE_VALIDATIONS}pending:*` },
      { pattern: `${CACHE_KEY_PREFIXES.TEST_SOFTWARE}detail:*` },
    ],
  },
  [CACHE_EVENTS.SW_VALIDATION_APPROVED]: {
    actions: [{ method: 'invalidateAllDashboard' }],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.SOFTWARE_VALIDATIONS}list:*` },
      { pattern: `${CACHE_KEY_PREFIXES.SOFTWARE_VALIDATIONS}pending:*` },
      { pattern: `${CACHE_KEY_PREFIXES.TEST_SOFTWARE}detail:*` },
    ],
  },
  [CACHE_EVENTS.SW_VALIDATION_QUALITY_APPROVED]: {
    actions: [{ method: 'invalidateAllDashboard' }],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.SOFTWARE_VALIDATIONS}list:*` },
      { pattern: `${CACHE_KEY_PREFIXES.SOFTWARE_VALIDATIONS}pending:*` },
      { pattern: `${CACHE_KEY_PREFIXES.TEST_SOFTWARE}detail:*` },
    ],
  },
  [CACHE_EVENTS.SW_VALIDATION_REJECTED]: {
    actions: [{ method: 'invalidateAllDashboard' }],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.SOFTWARE_VALIDATIONS}list:*` },
      { pattern: `${CACHE_KEY_PREFIXES.SOFTWARE_VALIDATIONS}pending:*` },
      { pattern: `${CACHE_KEY_PREFIXES.TEST_SOFTWARE}detail:*` },
    ],
  },
  // 시스템 자동 재검증 트리거 (testSoftware 버전 변경 side-effect).
  // 라운드 #3 갭 F: ADR-0012 예외 제거 — CACHE_EVENTS 채널로 마이그레이션.
  // NOTIFICATION_EVENTS.TEST_SOFTWARE_REVALIDATION_REQUIRED는 알림 발송 전용으로 유지.
  // test-software.service.ts 가 양 채널 동시 emit.
  [CACHE_EVENTS.TEST_SOFTWARE_REVALIDATION_REQUIRED]: {
    actions: [{ method: 'invalidateAllDashboard' }],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.TEST_SOFTWARE}detail:*` },
      { pattern: `${CACHE_KEY_PREFIXES.SOFTWARE_VALIDATIONS}list:*` },
      { pattern: `${CACHE_KEY_PREFIXES.SOFTWARE_VALIDATIONS}pending:*` },
    ],
  },

  // ─── 교정 캐시 전용 (Calibration — cache-only channel) ───
  // NOTIFICATION_EVENTS.CALIBRATION_*는 알림 발송 전용으로 유지.
  // 캐시 무효화는 이 채널에서 독립 처리.
  [CACHE_EVENTS.CALIBRATION_CREATED]: {
    actions: [
      { method: 'invalidateAllDashboard' },
      { method: 'invalidateEquipmentDetail', equipmentIdField: 'equipmentId' },
    ],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.CALIBRATION}list:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CALIBRATION}pending:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CALIBRATION}summary:*` },
    ],
  },
  [CACHE_EVENTS.CALIBRATION_UPDATED]: {
    actions: [
      { method: 'invalidateAllDashboard' },
      { method: 'invalidateEquipmentDetail', equipmentIdField: 'equipmentId' },
    ],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.CALIBRATION}list:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CALIBRATION}detail:*` },
      { pattern: `${CACHE_KEY_PREFIXES.CALIBRATION}pending:*` },
    ],
  },
  [CACHE_EVENTS.CALIBRATION_CERTIFICATE_UPLOADED]: {
    actions: [{ method: 'invalidateEquipmentDetail', equipmentIdField: 'equipmentId' }],
    patterns: [{ pattern: `${CACHE_KEY_PREFIXES.CALIBRATION}detail:*` }],
  },
  [CACHE_EVENTS.CALIBRATION_CERTIFICATE_REVISED]: {
    actions: [{ method: 'invalidateEquipmentDetail', equipmentIdField: 'equipmentId' }],
    patterns: [{ pattern: `${CACHE_KEY_PREFIXES.CALIBRATION}detail:*` }],
  },

  // ─── 교정 인자 (Calibration Factor) ───
  [NOTIFICATION_EVENTS.CALIBRATION_FACTOR_APPROVED]: {
    actions: [
      { method: 'invalidateAllDashboard' },
      { method: 'invalidateEquipmentDetail', equipmentIdField: 'equipmentId' },
    ],
    patterns: [{ pattern: `${CACHE_KEY_PREFIXES.CALIBRATION_FACTORS}*` }],
  },
  [NOTIFICATION_EVENTS.CALIBRATION_FACTOR_REJECTED]: {
    actions: [{ method: 'invalidateAllDashboard' }],
    patterns: [{ pattern: `${CACHE_KEY_PREFIXES.CALIBRATION_FACTORS}*` }],
  },

  // ─── 중간 점검 (Intermediate Check) ───
  [NOTIFICATION_EVENTS.INTERMEDIATE_CHECK_COMPLETED]: {
    actions: [
      {
        method: 'invalidateAfterEquipmentUpdate',
        equipmentIdField: 'equipmentId',
        statusChanged: true,
      },
    ],
    patterns: [{ pattern: `${CACHE_KEY_PREFIXES.CALIBRATION}*` }],
  },

  // ─── 수리 이력 (Repair History) ───
  [CACHE_EVENTS.REPAIR_HISTORY_CREATED]: {
    actions: [
      {
        method: 'invalidateAfterEquipmentUpdate',
        equipmentIdField: 'equipmentId',
        statusChanged: false,
        teamIdChanged: false,
      },
    ],
  },
  [CACHE_EVENTS.REPAIR_HISTORY_UPDATED]: {
    actions: [
      {
        method: 'invalidateAfterEquipmentUpdate',
        equipmentIdField: 'equipmentId',
        statusChanged: false,
        teamIdChanged: false,
      },
    ],
  },
  [CACHE_EVENTS.REPAIR_HISTORY_DELETED]: {
    actions: [
      {
        method: 'invalidateAfterEquipmentUpdate',
        equipmentIdField: 'equipmentId',
        statusChanged: false,
        teamIdChanged: false,
      },
    ],
  },

  // ─── Inspection Form Template (Phase 1B-backend, 사전 등록) ───
  // frontend 1A-a/b/c 완료 — backend 출시 시 발행 시작.
  // template create/update/version_up 시:
  // - 해당 equipment의 inspection 상세 캐시 무효화 (invalidateEquipmentDetail)
  // - template/intermediate/self inspection list 캐시 패턴 삭제
  // - dashboard 카운트는 영향 없음 (template 자체는 inspection record 아님)
  [CACHE_EVENTS.INSPECTION_TEMPLATE_CREATED]: {
    actions: [
      {
        method: 'invalidateEquipmentDetail',
        equipmentIdField: 'equipmentId',
      },
    ],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.INSPECTION_FORM_TEMPLATES}*` },
      { pattern: `${CACHE_KEY_PREFIXES.INTERMEDIATE_INSPECTIONS}*` },
      { pattern: `${CACHE_KEY_PREFIXES.SELF_INSPECTIONS}*` },
    ],
  },
  [CACHE_EVENTS.INSPECTION_TEMPLATE_UPDATED]: {
    actions: [
      {
        method: 'invalidateEquipmentDetail',
        equipmentIdField: 'equipmentId',
      },
    ],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.INSPECTION_FORM_TEMPLATES}*` },
      { pattern: `${CACHE_KEY_PREFIXES.INTERMEDIATE_INSPECTIONS}*` },
      { pattern: `${CACHE_KEY_PREFIXES.SELF_INSPECTIONS}*` },
    ],
  },
  [CACHE_EVENTS.INSPECTION_TEMPLATE_VERSION_UP]: {
    actions: [
      {
        method: 'invalidateEquipmentDetail',
        equipmentIdField: 'equipmentId',
      },
    ],
    patterns: [
      { pattern: `${CACHE_KEY_PREFIXES.INSPECTION_FORM_TEMPLATES}*` },
      { pattern: `${CACHE_KEY_PREFIXES.INTERMEDIATE_INSPECTIONS}*` },
      { pattern: `${CACHE_KEY_PREFIXES.SELF_INSPECTIONS}*` },
    ],
  },
};
