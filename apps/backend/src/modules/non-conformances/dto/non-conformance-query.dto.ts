import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
// ✅ SSOT: NonConformanceStatus는 schemas 패키지에서 import
import {
  NON_CONFORMANCE_STATUS_VALUES,
  NON_CONFORMANCE_TYPE_VALUES,
  NonConformanceStatusValues,
} from '@equipment-management/schemas';

// Re-export for backward compatibility (service, tests에서 사용)
export const NonConformanceStatus = NonConformanceStatusValues;

// ========== Zod 스키마 정의 ==========

/**
 * 부적합 조회 쿼리 스키마
 */
export const nonConformanceQuerySchema = z.object({
  equipmentId: z.string().uuid({ message: '유효한 장비 UUID가 아닙니다' }).optional(),
  status: z
    .enum(NON_CONFORMANCE_STATUS_VALUES as unknown as [string, ...string[]], {
      message: '유효하지 않은 상태입니다 (open, analyzing, corrected, closed)',
    })
    .optional(),
  ncType: z
    .enum(NON_CONFORMANCE_TYPE_VALUES as unknown as [string, ...string[]], {
      message: '유효하지 않은 유형입니다',
    })
    .optional(),
  site: z.enum(['suwon', 'uiwang', 'pyeongtaek']).optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    (val) => (val ? Number(val) : 20),
    z.number().int().min(1).max(100).default(20)
  ),
});

export type NonConformanceQueryInput = z.infer<typeof nonConformanceQuerySchema>;
export const NonConformanceQueryValidationPipe = new ZodValidationPipe(nonConformanceQuerySchema, {
  targets: ['query'],
});

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class NonConformanceQueryDto {
  @ApiPropertyOptional({ description: '장비 UUID 필터' })
  equipmentId?: string;

  @ApiPropertyOptional({
    description: '상태 필터',
    enum: NON_CONFORMANCE_STATUS_VALUES,
  })
  status?: string;

  @ApiPropertyOptional({
    description: '부적합 유형 필터',
    enum: NON_CONFORMANCE_TYPE_VALUES,
  })
  ncType?: string;

  @ApiPropertyOptional({
    description: '사이트 필터 (장비 소속 사이트)',
    enum: ['suwon', 'uiwang', 'pyeongtaek'],
  })
  site?: string;

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
