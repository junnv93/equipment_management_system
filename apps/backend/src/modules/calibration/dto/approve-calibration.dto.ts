import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 정의 ==========

/**
 * 교정 승인 스키마
 */
export const approveCalibrationSchema = z.object({
  approverId: z.string().uuid('유효한 UUID 형식이 아닙니다'),
  approverComment: z.string().min(1, '승인 시 승인자 코멘트는 필수입니다.'),
});

export type ApproveCalibrationInput = z.infer<typeof approveCalibrationSchema>;
export const ApproveCalibrationValidationPipe = new ZodValidationPipe(approveCalibrationSchema);

/**
 * 교정 반려 스키마
 */
export const rejectCalibrationSchema = z.object({
  approverId: z.string().uuid('유효한 UUID 형식이 아닙니다'),
  rejectionReason: z.string().min(1, '반려 사유는 필수입니다.'),
});

export type RejectCalibrationInput = z.infer<typeof rejectCalibrationSchema>;
export const RejectCalibrationValidationPipe = new ZodValidationPipe(rejectCalibrationSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class ApproveCalibrationDto {
  @ApiProperty({
    description: '승인자 ID (기술책임자)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  approverId: string;

  @ApiProperty({
    description: '승인자 코멘트 (기술책임자 승인 시 필수)',
    example: '교정 결과 확인 완료',
  })
  approverComment: string;
}

export class RejectCalibrationDto {
  @ApiProperty({
    description: '승인자 ID (기술책임자)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  approverId: string;

  @ApiProperty({
    description: '반려 사유',
    example: '교정 성적서 첨부가 누락되었습니다.',
  })
  rejectionReason: string;
}
