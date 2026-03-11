import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';

// ========== Zod 스키마 정의 ==========

/**
 * 보정계수 승인 스키마
 */
export const approveCalibrationFactorSchema = z.object({
  // approverId: 서버에서 JWT 추출 (Rule 2: 클라이언트 body 신뢰 금지)
  approverComment: z.string().min(1, '승인 시 승인자 코멘트는 필수입니다'),
  ...versionedSchema,
});

export type ApproveCalibrationFactorInput = z.infer<typeof approveCalibrationFactorSchema>;
export const ApproveCalibrationFactorValidationPipe = new ZodValidationPipe(
  approveCalibrationFactorSchema
);

/**
 * 보정계수 반려 스키마
 */
export const rejectCalibrationFactorSchema = z.object({
  // approverId: 서버에서 JWT 추출 (Rule 2: 클라이언트 body 신뢰 금지)
  rejectionReason: z.string().min(1, '반려 사유는 필수입니다'),
  ...versionedSchema,
});

export type RejectCalibrationFactorInput = z.infer<typeof rejectCalibrationFactorSchema>;
export const RejectCalibrationFactorValidationPipe = new ZodValidationPipe(
  rejectCalibrationFactorSchema
);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class ApproveCalibrationFactorDto {
  // approverId: 서버에서 JWT 추출 (Rule 2)

  @ApiProperty({
    description: '승인자 코멘트',
    example: '보정계수 검토 완료',
  })
  approverComment: string;

  @ApiProperty({
    description: 'Optimistic locking version (필수)',
    example: 1,
    required: true,
    type: 'integer',
    minimum: 1,
  })
  version: number;
}

export class RejectCalibrationFactorDto {
  // approverId: 서버에서 JWT 추출 (Rule 2)

  @ApiProperty({
    description: '반려 사유',
    example: '보정계수 값이 기준 범위를 벗어났습니다.',
  })
  rejectionReason: string;

  @ApiProperty({
    description: 'Optimistic locking version (필수)',
    example: 1,
    required: true,
    type: 'integer',
    minimum: 1,
  })
  version: number;
}
