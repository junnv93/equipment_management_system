import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { SavedViewModuleEnum, MAX_SAVED_VIEWS_PER_MODULE } from '@equipment-management/schemas';
import type { SavedViewModule } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

/**
 * localStorage 백업 → 서버 일괄 import (1회성).
 *
 * - 모든 row 는 scope=PRIVATE 으로 강제 등록 (legacy localStorage 는 개인 뷰).
 * - 사용자당 module 별 MAX_SAVED_VIEWS_PER_MODULE 한도 service 가 enforce.
 * - 멱등성: 빈 배열 허용 → no-op (frontend 측에서 localStorage clear 만 안전 트리거).
 */
export const bulkImportSavedViewsSchema = z
  .object({
    module: SavedViewModuleEnum,
    views: z
      .array(
        z.object({
          name: z.string().trim().min(1).max(80),
          params: z.string().max(VALIDATION_RULES.LONG_CSV_MAX_LENGTH),
          sortOrder: z.number().int().min(0).max(VALIDATION_RULES.SORT_ORDER_MAX).optional(),
        })
      )
      .max(
        MAX_SAVED_VIEWS_PER_MODULE,
        `사용자당 module 별 ${MAX_SAVED_VIEWS_PER_MODULE}개를 초과할 수 없습니다.`
      ),
  })
  .strict();

export type BulkImportSavedViewsInput = z.infer<typeof bulkImportSavedViewsSchema>;

export class BulkImportSavedViewsDto implements BulkImportSavedViewsInput {
  @ApiProperty({ description: '대상 module (예: checkouts)', enum: ['checkouts'] })
  module!: SavedViewModule;

  @ApiProperty({
    description: 'localStorage 백업 view 목록 (최대 5개, 모두 PRIVATE scope 로 저장)',
    type: 'array',
  })
  views!: BulkImportSavedViewsInput['views'];
}

export const BulkImportSavedViewsValidationPipe = new ZodValidationPipe(bulkImportSavedViewsSchema);
