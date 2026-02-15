import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';

// ========== Zod 스키마 정의 ==========

/**
 * 부적합 종료 스키마
 * closedBy는 서버에서 JWT로부터 추출 (Rule 2: Server-Side User Extraction)
 */
export const closeNonConformanceSchema = z.object({
  ...versionedSchema,
  closureNotes: z.string().optional(),
});

export type CloseNonConformanceInput = z.infer<typeof closeNonConformanceSchema>;
export const CloseNonConformanceValidationPipe = new ZodValidationPipe(closeNonConformanceSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class CloseNonConformanceDto extends VersionedDto {
  @ApiPropertyOptional({ description: '종료 메모' })
  closureNotes?: string;
}
