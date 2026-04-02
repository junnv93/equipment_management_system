import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { MAX_PAGE_SIZE } from '@equipment-management/shared-constants';

// ========== Zod 스키마 정의 ==========

const PendingChecksRoleEnum = z.enum(['lender', 'borrower']);

export const pendingChecksQuerySchema = z.object({
  role: PendingChecksRoleEnum.optional(),
  page: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().min(1).optional()),
  pageSize: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().min(1).max(MAX_PAGE_SIZE).optional()
  ),
});

export type PendingChecksQueryInput = z.infer<typeof pendingChecksQuerySchema>;
export const PendingChecksQueryValidationPipe = new ZodValidationPipe(pendingChecksQuerySchema, {
  targets: ['query'],
});

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class PendingChecksQueryDto {
  @ApiProperty({
    description: '확인 역할 필터 (lender=빌려주는 측, borrower=빌리는 측)',
    enum: PendingChecksRoleEnum.options,
    required: false,
  })
  role?: 'lender' | 'borrower';

  @ApiProperty({
    description: '페이지 번호',
    example: 1,
    default: 1,
    required: false,
  })
  page?: number;

  @ApiProperty({
    description: '페이지 크기',
    example: 20,
    default: 20,
    required: false,
  })
  pageSize?: number;
}
