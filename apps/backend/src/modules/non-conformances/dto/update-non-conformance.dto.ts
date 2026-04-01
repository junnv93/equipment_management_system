import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';
import { NonConformanceStatusEnum, VM, uuidString } from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/** 사용자가 직접 변경할 수 있는 상태 (closed는 승인 프로세스에서만 설정) */
const UpdatableNonConformanceStatusEnum = NonConformanceStatusEnum.extract(['open', 'corrected']);

/**
 * 부적합 수정 스키마
 * CAS: version 필드로 동시 수정 충돌 방지
 */
export const updateNonConformanceSchema = z.object({
  ...versionedSchema,
  cause: z.string().min(1).optional(),
  actionPlan: z.string().optional(),
  correctionContent: z.string().optional(),
  correctionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: VM.date.invalidYMD,
    })
    .optional(),
  correctedBy: uuidString(VM.uuid.invalid('조치자')).optional(),
  status: UpdatableNonConformanceStatusEnum.optional(),
});

export type UpdateNonConformanceInput = z.infer<typeof updateNonConformanceSchema>;
export const UpdateNonConformanceValidationPipe = new ZodValidationPipe(updateNonConformanceSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class UpdateNonConformanceDto extends VersionedDto {
  @ApiPropertyOptional({ description: '원인' })
  cause?: string;

  @ApiPropertyOptional({ description: '조치 계획' })
  actionPlan?: string;

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
