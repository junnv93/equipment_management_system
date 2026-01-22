import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 정의 ==========

/**
 * 교정계획서 승인 스키마
 */
export const approveCalibrationPlanSchema = z.object({
  approvedBy: z.string().min(1, '승인자 ID를 입력해주세요'),
});

export type ApproveCalibrationPlanInput = z.infer<typeof approveCalibrationPlanSchema>;
export const ApproveCalibrationPlanValidationPipe = new ZodValidationPipe(
  approveCalibrationPlanSchema
);

/**
 * 교정계획서 반려 스키마
 */
export const rejectCalibrationPlanSchema = z.object({
  rejectedBy: z.string().min(1, '승인자 ID를 입력해주세요'),
  rejectionReason: z.string().min(1, '반려 사유는 필수입니다'),
});

export type RejectCalibrationPlanInput = z.infer<typeof rejectCalibrationPlanSchema>;
export const RejectCalibrationPlanValidationPipe = new ZodValidationPipe(
  rejectCalibrationPlanSchema
);

/**
 * 교정계획서 제출 스키마
 */
export const submitCalibrationPlanSchema = z.object({
  memo: z.string().optional(),
});

export type SubmitCalibrationPlanInput = z.infer<typeof submitCalibrationPlanSchema>;
export const SubmitCalibrationPlanValidationPipe = new ZodValidationPipe(
  submitCalibrationPlanSchema
);

/**
 * 교정계획서 항목 확인 스키마
 */
export const confirmPlanItemSchema = z.object({
  confirmedBy: z.string().min(1, '확인자 ID를 입력해주세요'),
});

export type ConfirmPlanItemInput = z.infer<typeof confirmPlanItemSchema>;
export const ConfirmPlanItemValidationPipe = new ZodValidationPipe(confirmPlanItemSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class ApproveCalibrationPlanDto {
  @ApiProperty({
    description: '승인자 ID (시험소장)',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  approvedBy: string;
}

export class RejectCalibrationPlanDto {
  @ApiProperty({
    description: '승인자 ID (시험소장)',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  rejectedBy: string;

  @ApiProperty({
    description: '반려 사유 (필수)',
    example: '교정 예정일 재검토 필요',
  })
  rejectionReason: string;
}

export class SubmitCalibrationPlanDto {
  @ApiPropertyOptional({
    description: '제출 메모',
  })
  memo?: string;
}

export class ConfirmPlanItemDto {
  @ApiProperty({
    description: '확인자 ID (기술책임자)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  confirmedBy: string;
}
