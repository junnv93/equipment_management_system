import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { AUDIT_ACTION_VALUES, AUDIT_ENTITY_TYPE_VALUES } from '@equipment-management/schemas';

/**
 * 감사 로그 목록 조회 쿼리 스키마
 *
 * ✅ SSOT: AUDIT_ACTION_VALUES, AUDIT_ENTITY_TYPE_VALUES는 enums.ts에서 import
 */
export const auditLogQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  entityType: z
    .enum([...AUDIT_ENTITY_TYPE_VALUES] as [string, ...string[]], {
      message: '유효하지 않은 엔티티 타입입니다.',
    })
    .optional(),
  entityId: z.string().uuid().optional(),
  action: z
    .enum([...AUDIT_ACTION_VALUES] as [string, ...string[]], {
      message: '유효하지 않은 액션입니다.',
    })
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().min(1).optional()),
  limit: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().min(1).max(100).optional()
  ),
});

export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;

export const AuditLogQueryValidationPipe = new ZodValidationPipe(auditLogQuerySchema, {
  targets: ['query'],
});
