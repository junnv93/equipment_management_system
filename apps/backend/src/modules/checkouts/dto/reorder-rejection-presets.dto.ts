import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';

/**
 * 반려 사유 프리셋 일괄 정렬 스키마.
 *
 * ✅ MANAGE_SYSTEM_SETTINGS 권한 필수 (controller decorator).
 * ✅ max BULK_OPERATION_MAX_COUNT(50) 건.
 * ✅ transaction 내 bulk UPDATE — service-layer에서 처리.
 */
export const reorderRejectionPresetsSchema = z.object({
  orders: z
    .array(
      z.object({
        id: z.string().uuid('반려 사유 프리셋 ID 형식이 올바르지 않습니다'),
        sortOrder: z.number().int().min(0).max(VALIDATION_RULES.SORT_ORDER_MAX),
      })
    )
    .min(1, VM.array.min('반려 사유 프리셋 정렬 목록', 1))
    .max(
      VALIDATION_RULES.BULK_OPERATION_MAX_COUNT,
      VM.array.max('반려 사유 프리셋 정렬 목록', VALIDATION_RULES.BULK_OPERATION_MAX_COUNT)
    ),
});

export type ReorderRejectionPresetsInput = z.infer<typeof reorderRejectionPresetsSchema>;
export const ReorderRejectionPresetsValidationPipe = new ZodValidationPipe(
  reorderRejectionPresetsSchema
);

export class ReorderRejectionPresetsDto {
  @ApiProperty({
    description: '반려 사유 프리셋 정렬 목록 (id + 새 sortOrder)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid', description: '반려 사유 프리셋 UUID' },
        sortOrder: {
          type: 'integer',
          description: '반려 사유 프리셋 새 sortOrder',
          minimum: 0,
          maximum: VALIDATION_RULES.SORT_ORDER_MAX,
        },
      },
    },
  })
  orders: Array<{ id: string; sortOrder: number }>;
}
