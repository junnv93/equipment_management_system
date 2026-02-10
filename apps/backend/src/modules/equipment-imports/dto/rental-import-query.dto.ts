import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { RENTAL_IMPORT_STATUS_VALUES } from '@equipment-management/schemas';

export const rentalImportQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(RENTAL_IMPORT_STATUS_VALUES as unknown as [string, ...string[]]).optional(),
  site: z.string().optional(),
  teamId: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(['createdAt', 'usagePeriodStart', 'usagePeriodEnd', 'status'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type RentalImportQueryInput = z.infer<typeof rentalImportQuerySchema>;
export const RentalImportQueryValidationPipe = new ZodValidationPipe(rentalImportQuerySchema);

export class RentalImportQueryDto {
  @ApiProperty({ description: '페이지 번호', default: 1, required: false })
  page?: number;

  @ApiProperty({ description: '페이지 크기', default: 20, required: false })
  limit?: number;

  @ApiProperty({ description: '상태 필터', required: false })
  status?: string;

  @ApiProperty({ description: '사이트 필터', required: false })
  site?: string;

  @ApiProperty({ description: '팀 ID 필터', required: false })
  teamId?: string;

  @ApiProperty({ description: '검색어 (장비명, 업체명)', required: false })
  search?: string;

  @ApiProperty({ description: '정렬 필드', default: 'createdAt', required: false })
  sortBy?: string;

  @ApiProperty({ description: '정렬 방향', default: 'desc', required: false })
  sortOrder?: string;
}
