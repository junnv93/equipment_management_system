import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 정의 ==========

/**
 * 부적합 생성 스키마
 */
export const createNonConformanceSchema = z.object({
  equipmentId: z.string().uuid({ message: '유효한 장비 UUID가 아닙니다' }),
  discoveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)',
  }),
  discoveredBy: z.string().uuid({ message: '유효한 발견자 UUID가 아닙니다' }),
  cause: z.string().min(1, '부적합 원인을 입력해주세요'),
  actionPlan: z.string().optional(),
});

export type CreateNonConformanceInput = z.infer<typeof createNonConformanceSchema>;
export const CreateNonConformanceValidationPipe = new ZodValidationPipe(createNonConformanceSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class CreateNonConformanceDto {
  @ApiProperty({ description: '장비 UUID' })
  equipmentId: string;

  @ApiProperty({ description: '발견일 (YYYY-MM-DD)' })
  discoveryDate: string;

  @ApiProperty({ description: '발견자 UUID' })
  discoveredBy: string;

  @ApiProperty({ description: '부적합 원인' })
  cause: string;

  @ApiPropertyOptional({ description: '조치 계획' })
  actionPlan?: string;
}
