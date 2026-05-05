import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  AUDIT_ACTION_VALUES,
  AUDIT_ENTITY_TYPE_VALUES,
  VM,
  optionalUuid,
  optionalIsoDateString,
  optionalCursor,
} from '@equipment-management/schemas';
import { MAX_PAGE_SIZE, VALIDATION_RULES } from '@equipment-management/shared-constants';

/**
 * 감사 로그 목록 조회 쿼리 스키마
 *
 * ✅ SSOT: AUDIT_ACTION_VALUES, AUDIT_ENTITY_TYPE_VALUES는 enums.ts에서 import
 * ✅ SSOT: 날짜 / cursor는 optionalIsoDateString / optionalCursor (verify-zod Step 20)
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
  startDate: optionalIsoDateString('시작일'),
  endDate: optionalIsoDateString('종료일'),
  page: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().min(1).optional()),
  limit: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().min(1).max(MAX_PAGE_SIZE).optional()
  ),
  cursor: optionalCursor(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH),
});

export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;

export const AuditLogQueryValidationPipe = new ZodValidationPipe(auditLogQuerySchema, {
  targets: ['query'],
});
