import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  NonConformanceTypeEnum,
  NON_CONFORMANCE_TYPE_VALUES,
  type NonConformanceType,
  VM,
} from '@equipment-management/schemas';

// Re-export for backward compatibility
export { NonConformanceTypeEnum, NON_CONFORMANCE_TYPE_VALUES, type NonConformanceType };

// ========== Zod 스키마 정의 ==========

/**
 * 부적합 생성 스키마
 */
export const createNonConformanceSchema = z.object({
  equipmentId: z.string().uuid({ message: VM.uuid.invalid('장비') }),
  discoveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: VM.date.invalidYMD,
  }),
  discoveredBy: z.string().uuid({ message: VM.uuid.invalid('발견자') }),
  cause: z.string().min(1, VM.nonConformance.cause.required),
  ncType: NonConformanceTypeEnum,
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

  @ApiProperty({
    description: '부적합 유형',
    enum: NON_CONFORMANCE_TYPE_VALUES,
    example: 'damage',
  })
  ncType: NonConformanceType;

  @ApiPropertyOptional({ description: '조치 계획' })
  actionPlan?: string;
}
