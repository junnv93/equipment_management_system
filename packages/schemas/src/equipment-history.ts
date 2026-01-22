import { z } from 'zod';
import { IncidentTypeEnum } from './enums';

/**
 * 장비 위치 변동 이력 스키마
 */
export const locationHistorySchema = z.object({
  id: z.string().uuid(),
  equipmentId: z.string().uuid(),
  changedAt: z.coerce.date(),
  newLocation: z.string().max(100),
  notes: z.string().optional(),
  changedBy: z.string().uuid().optional(),
  createdAt: z.coerce.date(),
});

export const createLocationHistorySchema = z.object({
  changedAt: z.coerce.date(),
  newLocation: z.string().min(1).max(100),
  notes: z.string().optional(),
});

export type LocationHistory = z.infer<typeof locationHistorySchema>;
export type CreateLocationHistoryInput = z.infer<typeof createLocationHistorySchema>;

/**
 * 장비 유지보수 내역 스키마
 */
export const maintenanceHistorySchema = z.object({
  id: z.string().uuid(),
  equipmentId: z.string().uuid(),
  performedAt: z.coerce.date(),
  content: z.string(),
  performedBy: z.string().uuid().optional(),
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
  id: z.string().uuid(),
  equipmentId: z.string().uuid(),
  occurredAt: z.coerce.date(),
  incidentType: IncidentTypeEnum,
  content: z.string(),
  reportedBy: z.string().uuid().optional(),
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
