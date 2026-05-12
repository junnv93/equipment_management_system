/**
 * @equipment-management/schemas
 *
 * 공유 타입, Zod 스키마, enum 정의의 Single Source of Truth
 *
 * Best Practice: 각 모듈별 `export * from` 패턴으로 자동 동기화
 */

// ============================================================
// Core Domain Schemas
// ============================================================

export * from './equipment';
export * from './equipment-request';
export * from './equipment-attachment';
export * from './qr-handover';
export * from './document';
export * from './equipment-history';
export * from './user';
export * from './team';
export * from './checkout';
export * from './checkout-display';
export * from './revoke-approval';
export * from './calibration';
export * from './types/disposal';
export * from './settings';
export * from './audit-log';
export * from './field-labels';
export * from './form-template';
export * from './monitoring';
export * from './pagination';
export * from './schema-validation-rules';

// ============================================================
// Enums - Single Source of Truth
// ============================================================

export * from './enums';

// ============================================================
// Error Handling
// ============================================================

export * from './errors';

// ============================================================
// API Response Types
// ============================================================

export * from './api-response';
export * from './data-migration';

// ============================================================
// Validation Messages - SSOT
// ============================================================

export * from './validation';

// ============================================================
// Shared Field Utilities (Form-safe validators)
// ============================================================

export {
  uuidString,
  optionalUuid,
  nullableOptionalUuid,
  optionalTrimmedString,
  optionalIsoDateString,
  optionalCursor,
  optionalCsvEnum,
  optionalCsvUuid,
} from './utils/fields';

// ============================================================
// Sort Enums (per-domain SSOT — Query DTO + service mapper 동일 참조)
// ============================================================

export * from './sort';

// ============================================================
// Inspection Template (UL-QP-18-03 / UL-QP-18-05 Build-Once Workflow)
// ============================================================

export * from './types/inspection-template';
export {
  extractStructureFromInspection,
  describeStructureCounts,
  diffStructures,
  type InspectionTemplateSource,
} from './utils/inspection-template';

// Common base types
export type { PaginatedResponseType, PaginatedResponse, SoftDeleteEntity } from './common/base';

// ============================================================
// Software Validation (UL-QP-18-09)
// ============================================================

export * from './software-validation';

// ============================================================
// FSM — Checkout Finite State Machine (PR-1 SSOT)
// ============================================================

export * from './fsm';
