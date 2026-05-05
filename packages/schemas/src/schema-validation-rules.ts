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
} as const;
