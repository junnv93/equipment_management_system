import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 정의 ==========

/**
 * 팀 조회 쿼리 스키마
 */
export const teamQuerySchema = z.object({
  ids: z.string().optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    (val) => (val ? Number(val) : 20),
    z.number().int().min(1).max(100).default(20)
  ),
});

export type TeamQueryInput = z.infer<typeof teamQuerySchema>;
export const TeamQueryValidationPipe = new ZodValidationPipe(teamQuerySchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class TeamQueryDto {
  @ApiPropertyOptional({
    description: '팀 ID 필터 (쉼표로 구분된 여러 값 가능)',
    example: 'rf,sar',
  })
  ids?: string;

  @ApiPropertyOptional({
    description: '검색어 (팀 이름, 설명 등)',
    example: 'RF',
  })
  search?: string;

  @ApiPropertyOptional({
    description: '정렬 기준 (예: name.asc,createdAt.desc)',
    example: 'name.asc',
  })
  sort?: string;

  @ApiPropertyOptional({
    description: '페이지 번호',
    default: 1,
  })
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지 크기',
    default: 20,
  })
  pageSize?: number = 20;
}
