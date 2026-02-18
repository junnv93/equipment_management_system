import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';

// ========== Zod 스키마 정의 ==========

/**
 * 부적합 수정 가능한 상태
 */
const updatableStatusValues = ['open', 'analyzing', 'corrected'] as const;

/**
 * 부적합 수정 스키마
 * CAS: version 필드로 동시 수정 충돌 방지
 */
export const updateNonConformanceSchema = z.object({
  ...versionedSchema,
  actionPlan: z.string().optional(),
  analysisContent: z.string().optional(),
  correctionContent: z.string().optional(),
  correctionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)',
    })
    .optional(),
  correctedBy: z.string().uuid({ message: '유효한 조치자 UUID가 아닙니다' }).optional(),
  status: z
    .enum(updatableStatusValues, {
      message: '유효하지 않은 상태입니다 (open, analyzing, corrected)',
    })
    .optional(),
});

export type UpdateNonConformanceInput = z.infer<typeof updateNonConformanceSchema>;
export const UpdateNonConformanceValidationPipe = new ZodValidationPipe(updateNonConformanceSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class UpdateNonConformanceDto extends VersionedDto {
  @ApiPropertyOptional({ description: '조치 계획' })
  actionPlan?: string;

  @ApiPropertyOptional({ description: '원인 분석 내용' })
  analysisContent?: string;

  @ApiPropertyOptional({ description: '조치 내용' })
  correctionContent?: string;

  @ApiPropertyOptional({ description: '조치 완료일 (YYYY-MM-DD)' })
  correctionDate?: string;

  @ApiPropertyOptional({ description: '조치자 UUID' })
  correctedBy?: string;

  @ApiPropertyOptional({
    description: '상태 변경',
    enum: ['open', 'analyzing', 'corrected'],
  })
  status?: 'open' | 'analyzing' | 'corrected';
}
