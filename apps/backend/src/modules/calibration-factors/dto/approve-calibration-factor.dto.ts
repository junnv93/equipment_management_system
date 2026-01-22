import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 정의 ==========

/**
 * 보정계수 승인 스키마
 */
export const approveCalibrationFactorSchema = z.object({
  approverId: z.string().uuid({ message: '유효한 승인자 UUID가 아닙니다' }),
  approverComment: z.string().min(1, '승인 시 승인자 코멘트는 필수입니다'),
});

export type ApproveCalibrationFactorInput = z.infer<typeof approveCalibrationFactorSchema>;
export const ApproveCalibrationFactorValidationPipe = new ZodValidationPipe(
  approveCalibrationFactorSchema
);

/**
 * 보정계수 반려 스키마
 */
export const rejectCalibrationFactorSchema = z.object({
  approverId: z.string().uuid({ message: '유효한 승인자 UUID가 아닙니다' }),
  rejectionReason: z.string().min(1, '반려 사유는 필수입니다'),
});

export type RejectCalibrationFactorInput = z.infer<typeof rejectCalibrationFactorSchema>;
export const RejectCalibrationFactorValidationPipe = new ZodValidationPipe(
  rejectCalibrationFactorSchema
);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class ApproveCalibrationFactorDto {
  @ApiProperty({
    description: '승인자 ID (기술책임자)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  approverId: string;

  @ApiProperty({
    description: '승인자 코멘트',
    example: '보정계수 검토 완료',
  })
  approverComment: string;
}

export class RejectCalibrationFactorDto {
  @ApiProperty({
    description: '승인자 ID (기술책임자)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  approverId: string;

  @ApiProperty({
    description: '반려 사유',
    example: '보정계수 값이 기준 범위를 벗어났습니다.',
  })
  rejectionReason: string;
}
