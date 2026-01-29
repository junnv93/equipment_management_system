import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 정의 ==========

/**
 * 교정계획서 검토 요청 스키마 (기술책임자 → 품질책임자)
 */
export const submitForReviewSchema = z.object({
  submittedBy: z.string().uuid('작성자 ID는 UUID 형식이어야 합니다'),
  memo: z.string().optional(),
});

export type SubmitForReviewInput = z.infer<typeof submitForReviewSchema>;
export const SubmitForReviewValidationPipe = new ZodValidationPipe(submitForReviewSchema);

/**
 * 교정계획서 검토 완료 스키마 (품질책임자)
 */
export const reviewCalibrationPlanSchema = z.object({
  reviewedBy: z.string().uuid('검토자 ID는 UUID 형식이어야 합니다'),
  reviewComment: z.string().optional(),
});

export type ReviewCalibrationPlanInput = z.infer<typeof reviewCalibrationPlanSchema>;
export const ReviewCalibrationPlanValidationPipe = new ZodValidationPipe(
  reviewCalibrationPlanSchema
);

/**
 * 교정계획서 최종 승인 스키마 (시험소장)
 */
export const approveCalibrationPlanSchema = z.object({
  approvedBy: z.string().uuid('승인자 ID는 UUID 형식이어야 합니다'),
});

export type ApproveCalibrationPlanInput = z.infer<typeof approveCalibrationPlanSchema>;
export const ApproveCalibrationPlanValidationPipe = new ZodValidationPipe(
  approveCalibrationPlanSchema
);

/**
 * 교정계획서 반려 스키마 (품질책임자 또는 시험소장)
 */
export const rejectCalibrationPlanSchema = z.object({
  rejectedBy: z.string().uuid('반려자 ID는 UUID 형식이어야 합니다'),
  rejectionReason: z.string().min(1, '반려 사유는 필수입니다'),
});

export type RejectCalibrationPlanInput = z.infer<typeof rejectCalibrationPlanSchema>;
export const RejectCalibrationPlanValidationPipe = new ZodValidationPipe(
  rejectCalibrationPlanSchema
);

/**
 * 교정계획서 제출 스키마 (기존 호환성 유지)
 * @deprecated submitForReviewSchema 사용 권장
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
  confirmedBy: z.string().uuid('확인자 ID는 UUID 형식이어야 합니다'),
});

export type ConfirmPlanItemInput = z.infer<typeof confirmPlanItemSchema>;
export const ConfirmPlanItemValidationPipe = new ZodValidationPipe(confirmPlanItemSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

/**
 * 검토 요청 DTO (기술책임자 → 품질책임자)
 */
export class SubmitForReviewDto {
  @ApiProperty({
    description: '작성자 ID (기술책임자)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  submittedBy: string;

  @ApiPropertyOptional({
    description: '검토 요청 메모',
  })
  memo?: string;
}

/**
 * 검토 완료 DTO (품질책임자)
 */
export class ReviewCalibrationPlanDto {
  @ApiProperty({
    description: '검토자 ID (품질책임자)',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  reviewedBy: string;

  @ApiPropertyOptional({
    description: '검토 의견',
    example: '모든 항목 검토 완료, 승인 요청합니다.',
  })
  reviewComment?: string;
}

/**
 * 최종 승인 DTO (시험소장)
 */
export class ApproveCalibrationPlanDto {
  @ApiProperty({
    description: '승인자 ID (시험소장)',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  approvedBy: string;
}

/**
 * 반려 DTO (품질책임자 또는 시험소장)
 */
export class RejectCalibrationPlanDto {
  @ApiProperty({
    description: '반려자 ID (품질책임자 또는 시험소장)',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  rejectedBy: string;

  @ApiProperty({
    description: '반려 사유 (필수)',
    example: '교정 예정일 재검토 필요',
  })
  rejectionReason: string;
}

/**
 * 제출 DTO (기존 호환성)
 * @deprecated SubmitForReviewDto 사용 권장
 */
export class SubmitCalibrationPlanDto {
  @ApiPropertyOptional({
    description: '제출 메모',
  })
  memo?: string;
}

/**
 * 항목 확인 DTO
 */
export class ConfirmPlanItemDto {
  @ApiProperty({
    description: '확인자 ID (기술책임자)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  confirmedBy: string;
}
