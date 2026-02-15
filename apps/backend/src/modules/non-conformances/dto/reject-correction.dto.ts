import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';

// ========== Zod 스키마 정의 ==========

/**
 * 부적합 조치 반려 스키마
 * rejectedBy는 서버에서 JWT로부터 추출 (Rule 2: Server-Side User Extraction)
 */
export const rejectCorrectionSchema = z.object({
  ...versionedSchema,
  rejectionReason: z.string().min(1, '반려 사유를 입력해주세요'),
});

export type RejectCorrectionInput = z.infer<typeof rejectCorrectionSchema>;
export const RejectCorrectionValidationPipe = new ZodValidationPipe(rejectCorrectionSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class RejectCorrectionDto extends VersionedDto {
  @ApiProperty({ description: '반려 사유' })
  rejectionReason: string;
}
