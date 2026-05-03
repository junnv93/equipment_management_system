/**
 * Schemas package validation constants.
 *
 * `packages/schemas` is below `shared-constants` in the dependency graph, so schema-level
 * Zod definitions must keep their own constants here instead of importing shared-constants.
 */
export const SCHEMA_VALIDATION_RULES = {
  /** 장비명 최대 길이 */
  EQUIPMENT_NAME_MAX_LENGTH: 100,
} as const;
