/**
 * Schemas package validation constants.
 *
 * `packages/schemas` is below `shared-constants` in the dependency graph, so schema-level
 * Zod definitions must keep their own constants here instead of importing shared-constants.
 */
export const SCHEMA_VALIDATION_RULES = {
  /** 장비명 최대 길이 */
  EQUIPMENT_NAME_MAX_LENGTH: 100,

  /**
   * Query schema 자유 텍스트 단일 검색어 최대 길이.
   *
   * **SSOT source-of-truth**: 본 상수가 단일 진실의 소스. shared-constants의
   * `VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH`는 본 값을 단방향 import하여 노출하므로
   * mirror 상수 분기 위험 없음 (`packages/shared-constants/src/validation-rules.ts` 참조).
   */
  EXTENDED_TEXT_MAX_LENGTH: 200,

  /**
   * 장기 텍스트 필드 최대 길이 (description, reason 등 varchar(500)).
   *
   * **SSOT source-of-truth**: 본 상수가 단일 진실의 소스. shared-constants의
   * `VALIDATION_RULES.LONG_TEXT_MAX_LENGTH`는 본 값을 단방향 import.
   *
   * revoke-approval schema 가 schemas 패키지에서 직접 사용 — backend DTO 와 frontend 양쪽
   * 공유 SSOT. 의존 그래프(schemas → shared-constants 금지) 보존을 위해 schemas 측 SSOT.
   */
  LONG_TEXT_MAX_LENGTH: 500,

  /**
   * 승인 철회 사유 최소 글자 수 (UL-QP-18 철회 기록 정책).
   *
   * **SSOT source-of-truth**: shared-constants `VALIDATION_RULES.REVOCATION_REASON_MIN_LENGTH`
   * 가 본 값을 단방향 import. `packages/schemas/src/revoke-approval.ts` 의 zod schema
   * 가 본 값을 직접 사용 (schemas → shared-constants 의존 금지).
   */
  REVOCATION_REASON_MIN_LENGTH: 10,
} as const;
