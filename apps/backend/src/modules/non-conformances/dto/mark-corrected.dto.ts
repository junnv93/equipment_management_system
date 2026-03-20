import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { VM } from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/**
 * 부적합 조치 완료 처리 스키마
 * 수리 완료 시 자동으로 호출됨
 */
export const markCorrectedSchema = z.object({
  correctionContent: z
    .string()
    .min(
      VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH,
      VM.string.min('조치 내용', VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH)
    ),
  correctionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: VM.date.invalidYMD,
  }),
  correctedBy: z.string().uuid({ message: VM.uuid.invalid('조치자') }),
});

export type MarkCorrectedInput = z.infer<typeof markCorrectedSchema>;
export const MarkCorrectedValidationPipe = new ZodValidationPipe(markCorrectedSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class MarkCorrectedDto {
  @ApiProperty({ description: '조치 내용 (최소 10자)', minLength: 10 })
  correctionContent: string;

  @ApiProperty({ description: '조치 완료일 (YYYY-MM-DD)', example: '2026-01-26' })
  correctionDate: string;

  @ApiProperty({ description: '조치자 UUID' })
  correctedBy: string;
}
