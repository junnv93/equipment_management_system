import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';
import { NonConformanceStatusEnum } from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/** 사용자가 직접 변경할 수 있는 상태 (closed는 승인 프로세스에서만 설정) */
const UpdatableNonConformanceStatusEnum = NonConformanceStatusEnum.extract([
  'open',
  'analyzing',
  'corrected',
]);

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
  status: UpdatableNonConformanceStatusEnum.optional(),
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
    enum: UpdatableNonConformanceStatusEnum.options,
  })
  status?: z.infer<typeof UpdatableNonConformanceStatusEnum>;
}
