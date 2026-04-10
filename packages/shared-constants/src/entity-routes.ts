/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 엔티티 라우팅 맵
 *
 * 모든 엔티티 타입 → URL 매핑을 이 파일에서 관리합니다.
 * - 하드코딩 금지 (`/equipment/${id}` 등을 직접 작성하지 말 것)
 * - getEntityRoute(type, id) 헬퍼 함수 사용
 *
 * @see packages/schemas/src/audit-log.ts (AuditEntityType)
 */

import type { AuditEntityType } from '@equipment-management/schemas';

/**
 * 엔티티 타입별 URL 생성 함수
 */
export const ENTITY_ROUTES: Record<AuditEntityType, (id: string) => string> = {
  equipment: (id) => `/equipment/${id}`,
  calibration: (id) => `/calibration/history?selected=${id}`,
  checkout: (id) => `/checkouts/${id}`,
  rental: (id) => `/equipment-imports/${id}`,
  rental_import: (id) => `/equipment-imports/${id}`,
  calibration_plan: (id) => `/calibration-plans/${id}`,
  non_conformance: (id) => `/non-conformances/${id}`,
  user: (id) => `/admin/users/${id}`,
  team: (id) => `/admin/teams/${id}`,
  calibration_factor: (id) => `/equipment/${id}?tab=factors`, // 장비 상세의 보정계수 탭
  software: (id) => `/software/${id}`, // 시험용 소프트웨어 상세
  software_validation: (id) => `/software/${id}?tab=validation`, // 유효성 확인
  repair_history: (id) => `/equipment/${id}?tab=maintenance`, // 장비 상세의 수리이력 탭
  equipment_import: (id) => `/equipment-imports/${id}`,
  location_history: (id) => `/equipment/${id}?tab=location`, // 장비 상세의 위치 이력 탭
  maintenance_history: (id) => `/equipment/${id}?tab=maintenance`,
  incident_history: (id) => `/equipment/${id}?tab=incident`,
  settings: (id) => `/settings/${id}`,
  notification: (id) => `/notifications?selected=${id}`,
  report: () => `/reports`,
  document: (id) => `/documents/${id}`,
  software_equipment_link: (id) => `/software/${id}`,
  intermediate_inspection: (id) => `/calibration/intermediate-checks?selected=${id}`,
  cable: (id) => `/cables/${id}`,
  cable_loss_measurement: (id) => `/cables/${id}?tab=measurements`,
  self_inspection: (id) => `/equipment/${id}?tab=self-inspection`,
  form_template: () => `/reports/form-templates`,
  inspection_result_section: (id) => `/calibration/intermediate-checks?selected=${id}`,
};

/**
 * 엔티티 타입과 ID로 URL 생성
 *
 * @param entityType - 엔티티 타입 (equipment, calibration, checkout 등)
 * @param entityId - 엔티티 ID (UUID)
 * @returns URL 경로 (예: `/equipment/123e4567-e89b-12d3-a456-426614174000`)
 *
 * @example
 * ```typescript
 * getEntityRoute('equipment', '123e4567-e89b-12d3-a456-426614174000')
 * // → "/equipment/123e4567-e89b-12d3-a456-426614174000"
 *
 * getEntityRoute('calibration_factor', 'abc123')
 * // → "/equipment/abc123?tab=factors"
 * ```
 */
export function getEntityRoute(entityType: string, entityId: string): string | null {
  const routeFn = ENTITY_ROUTES[entityType as AuditEntityType];
  if (!routeFn) {
    return null;
  }
  return routeFn(entityId);
}

/**
 * 엔티티 타입이 라우팅 가능한지 확인
 */
export function hasEntityRoute(entityType: string): boolean {
  return entityType in ENTITY_ROUTES;
}
