import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 정의 ==========

/**
 * 부적합 종료 스키마
 */
export const closeNonConformanceSchema = z.object({
  closedBy: z.string().uuid({ message: '유효한 종료 승인자 UUID가 아닙니다' }),
  closureNotes: z.string().optional(),
});

export type CloseNonConformanceInput = z.infer<typeof closeNonConformanceSchema>;
export const CloseNonConformanceValidationPipe = new ZodValidationPipe(closeNonConformanceSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class CloseNonConformanceDto {
  @ApiProperty({ description: '종료 승인자 UUID (기술책임자)' })
  closedBy: string;

  @ApiPropertyOptional({ description: '종료 메모' })
  closureNotes?: string;
}
