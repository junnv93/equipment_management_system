import { SCHEMA_VALIDATION_RULES } from '@equipment-management/schemas';

/**
 * 검증 규칙 공유 상수 — Backend DTO / Frontend Form SSOT
 *
 * 프론트엔드와 백엔드가 동일한 검증 규칙을 적용하기 위한 단일 소스입니다.
 * DTO의 `.min()`, `.max()` 값과 프론트엔드 폼 검증에서 동일한 상수를 사용합니다.
 *
 * SSOT 단방향 import:
 * - `EXTENDED_TEXT_MAX_LENGTH`는 `packages/schemas`의 `SCHEMA_VALIDATION_RULES`가 source-of-truth.
 *   schemas 패키지는 shared-constants 의존 불가(의존 그래프 최하층)이므로 schemas 내부에서
 *   `equipmentFilterSchema` 등 자체 SSOT를 사용해야 한다. 그 값을 본 객체에 단방향 wire하여
 *   mirror 상수 분기(어긋날 위험) 제거.
 *
 * @example
 * // Backend DTO
 * import { VALIDATION_RULES } from '@equipment-management/shared-constants';
 * rejectionReason: z.string().min(VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH)
 *
 * // Frontend
 * import { VALIDATION_RULES } from '@equipment-management/shared-constants';
 * if (reason.length < VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH) { ... }
 */
export const VALIDATION_RULES = {
  /** 반려/거부 사유 최소 글자 수 */
  REJECTION_REASON_MIN_LENGTH: 10,

  /**
   * 승인 철회 사유 최소 글자 수 (UL-QP-18 철회 기록 정책)
   *
   * **SSOT 단방향**: source-of-truth는 `SCHEMA_VALIDATION_RULES.REVOCATION_REASON_MIN_LENGTH`
   * (`packages/schemas`). revoke-approval zod schema가 schemas 패키지에 위치하므로 schemas 측
   * 정의를 그대로 노출 — 두 값 분기 위험 0.
   */
  REVOCATION_REASON_MIN_LENGTH: SCHEMA_VALIDATION_RULES.REVOCATION_REASON_MIN_LENGTH,

  /** 장비 반입 기본 반납 예정일 (일) */
  DEFAULT_RETURN_DAYS: 7,

  /** 일반 텍스트 필드 최대 길이 (name, department 등 varchar(100)) */
  TEXT_FIELD_MAX_LENGTH: 100,

  /** 짧은 텍스트 필드 최대 길이 (unit, cycle 등 varchar(20)) */
  SHORT_TEXT_MAX_LENGTH: 20,

  /**
   * 장기 텍스트 필드 최대 길이 (description, reason 등 varchar(500))
   *
   * **SSOT 단방향**: source-of-truth는 `SCHEMA_VALIDATION_RULES.LONG_TEXT_MAX_LENGTH`
   * (`packages/schemas`). revoke-approval/calibration-comment 등 schemas 측 zod 가 직접 사용.
   */
  LONG_TEXT_MAX_LENGTH: SCHEMA_VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,

  /** 전화번호 최대 길이 */
  PHONE_MAX_LENGTH: 20,

  /** 관리번호 최대 길이 */
  MANAGEMENT_NUMBER_MAX_LENGTH: 50,

  /**
   * 중간 텍스트 필드 최대 길이 (소프트웨어명, 제조사, URL, Query DTO 자유 텍스트 등 varchar(200)).
   *
   * **SSOT 단방향**: source-of-truth는 `SCHEMA_VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH`
   * (`packages/schemas`). schemas가 shared-constants에 의존 불가하므로 schemas 측 정의를
   * 그대로 노출. 두 값이 어긋날 수 없다 — 단일 import 경로.
   */
  EXTENDED_TEXT_MAX_LENGTH: SCHEMA_VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH,

  /** 케이블 관리번호/길이/손실값 등 짧은 케이블 도메인 텍스트 최대 길이 */
  CABLE_SHORT_TEXT_MAX_LENGTH: 20,

  /** 케이블 위치 최대 길이 */
  CABLE_LOCATION_MAX_LENGTH: 50,

  /** 케이블 시리얼번호 최대 길이 */
  CABLE_SERIAL_NUMBER_MAX_LENGTH: 100,

  /** 일괄 작업 최대 처리 건수 */
  BULK_OPERATION_MAX_COUNT: 50,

  /**
   * Query DTO CSV 다중값 필드 최대 길이 (statuses, methods, roles, teams, ids 등)
   *
   * 단일 검색어 가정인 EXTENDED_TEXT_MAX_LENGTH(200)와 분리 — 다수 enum 토큰을
   * `'a,b,c,...'` 형식으로 보낼 때 200자 초과 가능. 1000자 = 약 166개 토큰 (현실적 상한).
   * 토큰별 enum 검증은 service-layer 책임 (점진 도입).
   */
  LONG_CSV_MAX_LENGTH: 1000,

  /**
   * 반출 목적지(destination) 최대 길이 — `varchar(255)` SSOT.
   *
   * `packages/db/src/schema/checkouts.ts`의 `destination` 컬럼(varchar(255))과 1:1 정합.
   * 일반 검색어 EXTENDED_TEXT_MAX_LENGTH(200)와 분리 — destination은 주소/장소명을
   * 자유 형식으로 받는 필드라 250자 안팎이 필요할 수 있고, DB 컬럼 길이를 그대로 노출하여
   * 의도(여기까지 허용, 그 이상은 DB가 거부) 명시.
   */
  DESTINATION_MAX_LENGTH: 255,

  /**
   * sortOrder 최대값 — preset/saved-views 등 사용자 정렬 entity 공통.
   *
   * 9999 = 4자리 정수 상한. 1만개 이상 관리 entity는 별도 UX(페이지네이션 + DnD)가
   * 필요하므로 본 상한을 넘어가면 트리거 검토.
   */
  SORT_ORDER_MAX: 9999,
} as const;

// ============================================================================
// UUID 정규식 패턴 (SSOT)
// ============================================================================

/**
 * UUID v4 형식 검증용 정규식 (anchored, 단일 문자열이 UUID인지 테스트)
 *
 * @example
 * import { UUID_TEST_REGEX } from '@equipment-management/shared-constants';
 * if (UUID_TEST_REGEX.test(actorId)) { ... }  // notification-dispatcher 등
 */
export const UUID_TEST_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * UUID v4 패턴 소스 문자열 (flag 없는 raw source)
 *
 * 용도별로 적절한 flags를 붙여 new RegExp()로 인스턴스화하세요.
 *
 * @example
 * import { UUID_PATTERN_SOURCE } from '@equipment-management/shared-constants';
 * // 경로 정규화 (gi flags): 문자열 내 모든 UUID를 :id로 치환
 * const UUID_PATH_PATTERN = new RegExp(UUID_PATTERN_SOURCE, 'gi');
 * path.replace(UUID_PATH_PATTERN, ':id');
 */
export const UUID_PATTERN_SOURCE = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
