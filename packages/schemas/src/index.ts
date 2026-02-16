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

// Enums 네임스페이스 (선택적 사용을 위해)
import * as Enums from './enums';
export { Enums };

// ============================================================
// Error Handling
// ============================================================

export * from './errors';

// ============================================================
// API Response Types
// ============================================================

export * from './api-response';

// ============================================================
// Legacy Compatibility Types (TODO: 점진적 제거 예정)
// ============================================================

import type { User } from './user';
import type { Team } from './team';

export type UserListResponse = {
  items: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type TeamListResponse = {
  items: Team[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
