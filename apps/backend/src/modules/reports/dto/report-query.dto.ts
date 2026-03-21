import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  REPORT_FORMAT_VALUES,
  REPORT_PERIOD_VALUES,
  AUDIT_ACTION_VALUES,
  AUDIT_ENTITY_TYPE_VALUES,
  SiteEnum,
  optionalUuid,
} from '@equipment-management/schemas';

// ── 통계 엔드포인트 공통 날짜 스키마 ─────────────────────────────────────────

const dateRangeFields = {
  startDate: z.string().optional(),
  endDate: z.string().optional(),
};

// ── 통계 쿼리 스키마 ─────────────────────────────────────────────────────────

export const equipmentUsageQuerySchema = z.object({
  ...dateRangeFields,
  equipmentId: optionalUuid(),
});
export type EquipmentUsageQueryInput = z.infer<typeof equipmentUsageQuerySchema>;
export const EquipmentUsageQueryPipe = new ZodValidationPipe(equipmentUsageQuerySchema, {
  targets: ['query'],
});

export const calibrationStatusQuerySchema = z.object({
  status: z.string().optional(),
  timeframe: z.enum(REPORT_PERIOD_VALUES).optional(),
});
export type CalibrationStatusQueryInput = z.infer<typeof calibrationStatusQuerySchema>;
export const CalibrationStatusQueryPipe = new ZodValidationPipe(calibrationStatusQuerySchema, {
  targets: ['query'],
});

export const checkoutStatisticsQuerySchema = z.object({
  ...dateRangeFields,
});
export type CheckoutStatisticsQueryInput = z.infer<typeof checkoutStatisticsQuerySchema>;
export const CheckoutStatisticsQueryPipe = new ZodValidationPipe(checkoutStatisticsQuerySchema, {
  targets: ['query'],
});

export const utilizationRateQuerySchema = z.object({
  period: z.enum(REPORT_PERIOD_VALUES).default('month'),
  equipmentId: optionalUuid(),
});
export type UtilizationRateQueryInput = z.infer<typeof utilizationRateQuerySchema>;
export const UtilizationRateQueryPipe = new ZodValidationPipe(utilizationRateQuerySchema, {
  targets: ['query'],
});

export const equipmentDowntimeQuerySchema = z.object({
  ...dateRangeFields,
  equipmentId: optionalUuid(),
});
export type EquipmentDowntimeQueryInput = z.infer<typeof equipmentDowntimeQuerySchema>;
export const EquipmentDowntimeQueryPipe = new ZodValidationPipe(equipmentDowntimeQuerySchema, {
  targets: ['query'],
});

// ── 내보내기 쿼리 스키마 ─────────────────────────────────────────────────────

const exportBaseFields = {
  format: z.enum(REPORT_FORMAT_VALUES),
  ...dateRangeFields,
};

export const exportEquipmentUsageQuerySchema = z.object({
  ...exportBaseFields,
});
export type ExportEquipmentUsageQueryInput = z.infer<typeof exportEquipmentUsageQuerySchema>;
export const ExportEquipmentUsageQueryPipe = new ZodValidationPipe(
  exportEquipmentUsageQuerySchema,
  { targets: ['query'] }
);

export const exportEquipmentInventoryQuerySchema = z.object({
  format: z.enum(REPORT_FORMAT_VALUES),
  site: SiteEnum.optional(),
  status: z.string().optional(),
  teamId: optionalUuid(),
});
export type ExportEquipmentInventoryQueryInput = z.infer<
  typeof exportEquipmentInventoryQuerySchema
>;
export const ExportEquipmentInventoryQueryPipe = new ZodValidationPipe(
  exportEquipmentInventoryQuerySchema,
  { targets: ['query'] }
);

export const exportCalibrationStatusQuerySchema = z.object({
  ...exportBaseFields,
  status: z.string().optional(),
});
export type ExportCalibrationStatusQueryInput = z.infer<typeof exportCalibrationStatusQuerySchema>;
export const ExportCalibrationStatusQueryPipe = new ZodValidationPipe(
  exportCalibrationStatusQuerySchema,
  { targets: ['query'] }
);

export const exportUtilizationQuerySchema = z.object({
  ...exportBaseFields,
  period: z.string().optional(),
  site: SiteEnum.optional(),
});
export type ExportUtilizationQueryInput = z.infer<typeof exportUtilizationQuerySchema>;
export const ExportUtilizationQueryPipe = new ZodValidationPipe(exportUtilizationQuerySchema, {
  targets: ['query'],
});

export const exportTeamEquipmentQuerySchema = z.object({
  format: z.enum(REPORT_FORMAT_VALUES),
  site: SiteEnum.optional(),
  teamId: optionalUuid(),
});
export type ExportTeamEquipmentQueryInput = z.infer<typeof exportTeamEquipmentQuerySchema>;
export const ExportTeamEquipmentQueryPipe = new ZodValidationPipe(exportTeamEquipmentQuerySchema, {
  targets: ['query'],
});

export const exportMaintenanceQuerySchema = z.object({
  ...exportBaseFields,
  equipmentId: optionalUuid(),
});
export type ExportMaintenanceQueryInput = z.infer<typeof exportMaintenanceQuerySchema>;
export const ExportMaintenanceQueryPipe = new ZodValidationPipe(exportMaintenanceQuerySchema, {
  targets: ['query'],
});

export const exportAuditLogsQuerySchema = z.object({
  format: z.enum(REPORT_FORMAT_VALUES),
  userId: optionalUuid(),
  entityType: z.enum(AUDIT_ENTITY_TYPE_VALUES).optional(),
  action: z.enum(AUDIT_ACTION_VALUES as readonly [string, ...string[]]).optional(),
  ...dateRangeFields,
});
export type ExportAuditLogsQueryInput = z.infer<typeof exportAuditLogsQuerySchema>;
export const ExportAuditLogsQueryPipe = new ZodValidationPipe(exportAuditLogsQuerySchema, {
  targets: ['query'],
});
