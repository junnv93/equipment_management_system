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
export * from './document';
export * from './equipment-history';
export * from './user';
export * from './team';
export * from './checkout';
export * from './calibration';
export * from './types/disposal';
export * from './settings';
export * from './audit-log';
export * from './field-labels';

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

// ============================================================
// Validation Messages - SSOT
// ============================================================

export * from './validation';

// ============================================================
// Shared Field Utilities (Form-safe validators)
// ============================================================

export { uuidString, optionalUuid, nullableOptionalUuid } from './utils/fields';

// Common base types
export type { PaginatedResponseType, PaginatedResponse, SoftDeleteEntity } from './common/base';
