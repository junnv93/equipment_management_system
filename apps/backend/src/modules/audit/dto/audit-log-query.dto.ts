import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  AUDIT_ACTION_VALUES,
  AUDIT_ENTITY_TYPE_VALUES,
  VM,
  optionalUuid,
} from '@equipment-management/schemas';

/**
 * 감사 로그 목록 조회 쿼리 스키마
 *
 * ✅ SSOT: AUDIT_ACTION_VALUES, AUDIT_ENTITY_TYPE_VALUES는 enums.ts에서 import
 */
export const auditLogQuerySchema = z.object({
  userId: optionalUuid(),
  entityType: z
    .enum(AUDIT_ENTITY_TYPE_VALUES, {
      message: VM.audit.entityType.invalid,
    })
    .optional(),
  entityId: optionalUuid(),
  action: z
    .enum(AUDIT_ACTION_VALUES, {
      message: VM.audit.action.invalid,
    })
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().min(1).optional()),
  limit: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().min(1).max(100).optional()
  ),
  cursor: z.string().optional(),
});

export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;

export const AuditLogQueryValidationPipe = new ZodValidationPipe(auditLogQuerySchema, {
  targets: ['query'],
});
