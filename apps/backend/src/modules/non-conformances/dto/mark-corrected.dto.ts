import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 정의 ==========

/**
 * 부적합 조치 완료 처리 스키마
 * 수리 완료 시 자동으로 호출됨
 */
export const markCorrectedSchema = z.object({
  correctionContent: z.string().min(10, '조치 내용은 최소 10자 이상이어야 합니다'),
  correctionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)',
  }),
  correctedBy: z.string().uuid({ message: '유효한 조치자 UUID가 아닙니다' }),
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
