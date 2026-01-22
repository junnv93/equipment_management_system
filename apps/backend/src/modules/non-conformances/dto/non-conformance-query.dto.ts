import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Enum 정의 ==========

export enum NonConformanceStatus {
  OPEN = 'open',
  ANALYZING = 'analyzing',
  CORRECTED = 'corrected',
  CLOSED = 'closed',
}

// ========== Zod 스키마 정의 ==========

/**
 * 부적합 조회 쿼리 스키마
 */
export const nonConformanceQuerySchema = z.object({
  equipmentId: z.string().uuid({ message: '유효한 장비 UUID가 아닙니다' }).optional(),
  status: z
    .nativeEnum(NonConformanceStatus, {
      message: '유효하지 않은 상태입니다 (open, analyzing, corrected, closed)',
    })
    .optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    (val) => (val ? Number(val) : 20),
    z.number().int().min(1).max(100).default(20)
  ),
});

export type NonConformanceQueryInput = z.infer<typeof nonConformanceQuerySchema>;
export const NonConformanceQueryValidationPipe = new ZodValidationPipe(nonConformanceQuerySchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class NonConformanceQueryDto {
  @ApiPropertyOptional({ description: '장비 UUID 필터' })
  equipmentId?: string;

  @ApiPropertyOptional({
    description: '상태 필터',
    enum: NonConformanceStatus,
  })
  status?: string;

  @ApiPropertyOptional({ description: '검색어 (원인 내용)' })
  search?: string;

  @ApiPropertyOptional({
    description: '정렬 (예: discoveryDate.desc)',
    default: 'discoveryDate.desc',
  })
  sort?: string;

  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지당 항목 수', default: 20 })
  pageSize?: number = 20;
}
