import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { SavedViewModuleEnum } from '@equipment-management/schemas';
import type { SavedViewModule } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

/**
 * Saved View 정렬 일괄 갱신
 *
 * - module scope 강제: 한 트랜잭션은 동일 module 의 view 만 다룸 (cross-module 정렬 방지).
 * - 클라이언트가 보낸 모든 id 는 본인이 갱신 권한을 가진 row 여야 함 (service 가 enforce).
 * - sortOrder 는 0 이상 SORT_ORDER_MAX 이하 정수.
 */
export const reorderSavedViewsSchema = z
  .object({
    module: SavedViewModuleEnum,
    orders: z
      .array(
        z.object({
          id: z.string().uuid(),
          sortOrder: z.number().int().min(0).max(VALIDATION_RULES.SORT_ORDER_MAX),
        })
      )
      .min(1, '정렬할 항목이 1개 이상 필요합니다.')
      .max(50, '한 번에 정렬할 수 있는 항목은 50개를 넘을 수 없습니다.'),
  })
  .strict();

export type ReorderSavedViewsInput = z.infer<typeof reorderSavedViewsSchema>;

export class ReorderSavedViewsDto implements ReorderSavedViewsInput {
  @ApiProperty({ description: '대상 module (예: checkouts)', enum: ['checkouts'] })
  module!: SavedViewModule;

  @ApiProperty({
    description: '정렬 갱신 페어 배열',
    type: 'array',
    items: {
      type: 'object',
      properties: { id: { type: 'string' }, sortOrder: { type: 'integer' } },
    },
  })
  orders!: ReorderSavedViewsInput['orders'];
}

export const ReorderSavedViewsValidationPipe = new ZodValidationPipe(reorderSavedViewsSchema);
