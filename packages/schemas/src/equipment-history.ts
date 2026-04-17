import { z } from 'zod';
import { IncidentTypeEnum } from './enums';
import { uuidString, optionalUuid } from './utils/fields';

/**
 * 장비 위치 변동 이력 스키마
 */
export const locationHistorySchema = z.object({
  id: uuidString(),
  equipmentId: uuidString(),
  changedAt: z.coerce.date(),
  previousLocation: z.string().optional(),
  newLocation: z.string().max(100),
  notes: z.string().optional(),
  changedBy: optionalUuid(),
  createdAt: z.coerce.date(),
});

export const createLocationHistorySchema = z.object({
  changedAt: z.coerce.date(),
  newLocation: z.string().min(1).max(100),
  notes: z.string().optional(),
  version: z.number().int().positive().optional(),
});

export type LocationHistory = z.infer<typeof locationHistorySchema>;
export type CreateLocationHistoryInput = z.infer<typeof createLocationHistorySchema>;

/**
 * 장비 유지보수 내역 스키마
 */
export const maintenanceHistorySchema = z.object({
  id: uuidString(),
  equipmentId: uuidString(),
  performedAt: z.coerce.date(),
  content: z.string(),
  performedBy: optionalUuid(),
  performedByName: z.string().optional(), // 조회 시 조인된 데이터
  createdAt: z.coerce.date(),
});

export const createMaintenanceHistorySchema = z.object({
  performedAt: z.coerce.date(),
  content: z.string().min(1),
});

export type MaintenanceHistory = z.infer<typeof maintenanceHistorySchema>;
export type CreateMaintenanceHistoryInput = z.infer<typeof createMaintenanceHistorySchema>;

/**
 * 장비 손상/오작동/변경/수리 내역 스키마
 */
export const incidentHistorySchema = z.object({
  id: uuidString(),
  equipmentId: uuidString(),
  occurredAt: z.coerce.date(),
  incidentType: IncidentTypeEnum,
  content: z.string(),
  reportedBy: optionalUuid(),
  reportedByName: z.string().optional(), // 조회 시 조인된 데이터
  createdAt: z.coerce.date(),
});

export const createIncidentHistorySchema = z.object({
  occurredAt: z.coerce.date(),
  incidentType: IncidentTypeEnum,
  content: z.string().min(1),
});

export type IncidentHistory = z.infer<typeof incidentHistorySchema>;
export type CreateIncidentHistoryInput = z.infer<typeof createIncidentHistorySchema>;

/**
 * 통합 이력 엔트리 유형 (UL-QP-18-02 이력카드 §9.9 "장비 손상, 오작동, 변경 또는 수리 내역" 섹션).
 *
 * 이력카드의 단일 섹션은 3개 도메인 테이블을 합쳐 표시한다:
 * - `incident_history` (incident_type: damage | malfunction | change | repair | calibration_overdue)
 * - `repair_history` (단독 수리 기록 — incident_history에 대응되지 않는 사전 예방 수리 등)
 * - `non_conformances` (부적합 조치 기록 — FK 역참조로 incident/repair와 연결되지 않은 고유 건만)
 *
 * FK 역참조 기반 중복 제거 규칙:
 * - incident.non_conformance_id → NC 참조 시 NC는 별도 행 생략
 * - nc.repair_history_id → repair 참조 시 NC는 별도 행 생략 (repair가 더 구체적)
 *
 * @see apps/backend/src/modules/equipment/services/equipment-timeline.service.ts
 */
export const TimelineEntryTypeEnum = z.enum([
  // incident_history.incidentType 5종 — SSOT: IncidentTypeEnum
  'damage',
  'malfunction',
  'change',
  'repair',
  'calibration_overdue',
  // repair_history 단독 (incident에 대응 없음)
  'repair_record',
  // non_conformances 단독 (incident/repair에 대응 없음)
  'non_conformance',
]);

export type TimelineEntryType = z.infer<typeof TimelineEntryTypeEnum>;
