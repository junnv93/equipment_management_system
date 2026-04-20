import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { VM } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 정의 ==========

/**
 * 교정계획서 검토 요청 스키마 (기술책임자 → 품질책임자)
 * ⚠️ submittedBy는 서버에서 JWT로 추출 (클라이언트 전송 금지)
 */
export const submitForReviewSchema = z.object({
  casVersion: z.number().int().positive(VM.number.positive('casVersion')),
  memo: z.string().optional(),
});

export type SubmitForReviewInput = z.infer<typeof submitForReviewSchema>;
/** 서비스 내부용 (controller가 userId 주입) */
export type SubmitForReviewPayload = SubmitForReviewInput & { submittedBy: string };
export const SubmitForReviewValidationPipe = new ZodValidationPipe(submitForReviewSchema);

/**
 * 교정계획서 검토 완료 스키마 (품질책임자)
 * ⚠️ reviewedBy는 서버에서 JWT로 추출
 */
export const reviewCalibrationPlanSchema = z.object({
  casVersion: z.number().int().positive(VM.number.positive('casVersion')),
  reviewComment: z.string().optional(),
});

export type ReviewCalibrationPlanInput = z.infer<typeof reviewCalibrationPlanSchema>;
/** 서비스 내부용 (controller가 userId 주입) */
export type ReviewCalibrationPlanPayload = ReviewCalibrationPlanInput & { reviewedBy: string };
export const ReviewCalibrationPlanValidationPipe = new ZodValidationPipe(
  reviewCalibrationPlanSchema
);

/**
 * 교정계획서 최종 승인 스키마 (시험소장)
 * ⚠️ approvedBy는 서버에서 JWT로 추출
 */
export const approveCalibrationPlanSchema = z.object({
  casVersion: z.number().int().positive(VM.number.positive('casVersion')),
});

export type ApproveCalibrationPlanInput = z.infer<typeof approveCalibrationPlanSchema>;
/** 서비스 내부용 (controller가 userId 주입) */
export type ApproveCalibrationPlanPayload = ApproveCalibrationPlanInput & { approvedBy: string };
export const ApproveCalibrationPlanValidationPipe = new ZodValidationPipe(
  approveCalibrationPlanSchema
);

/**
 * 교정계획서 반려 스키마 (품질책임자 또는 시험소장)
 * ⚠️ rejectedBy는 서버에서 JWT로 추출
 */
export const rejectCalibrationPlanSchema = z.object({
  casVersion: z.number().int().positive(VM.number.positive('casVersion')),
  rejectionReason: z.string().min(1, VM.approval.rejectReason.required),
});

export type RejectCalibrationPlanInput = z.infer<typeof rejectCalibrationPlanSchema>;
/** 서비스 내부용 (controller가 userId 주입) */
export type RejectCalibrationPlanPayload = RejectCalibrationPlanInput & { rejectedBy: string };
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
 * ⚠️ confirmedBy는 서버에서 JWT로 추출
 */
export const confirmPlanItemSchema = z.object({
  casVersion: z.number().int().positive(VM.number.positive('casVersion')).optional(),
});

export type ConfirmPlanItemInput = z.infer<typeof confirmPlanItemSchema>;
/** 서비스 내부용 (controller가 userId 주입) */
export type ConfirmPlanItemPayload = ConfirmPlanItemInput & { confirmedBy: string };
export const ConfirmPlanItemValidationPipe = new ZodValidationPipe(confirmPlanItemSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

/**
 * 검토 요청 DTO (기술책임자 → 품질책임자)
 * submittedBy는 서버에서 JWT로 추출
 */
export class SubmitForReviewDto {
  @ApiProperty({ description: 'CAS 버전 (동시 수정 방지)', example: 1 })
  casVersion: number;

  @ApiPropertyOptional({ description: '검토 요청 메모' })
  memo?: string;
}

/**
 * 검토 완료 DTO (품질책임자)
 * reviewedBy는 서버에서 JWT로 추출
 */
export class ReviewCalibrationPlanDto {
  @ApiProperty({ description: 'CAS 버전 (동시 수정 방지)', example: 1 })
  casVersion: number;

  @ApiPropertyOptional({
    description: '검토 의견',
    example: '모든 항목 검토 완료, 승인 요청합니다.',
  })
  reviewComment?: string;
}

/**
 * 최종 승인 DTO (시험소장)
 * approvedBy는 서버에서 JWT로 추출
 */
export class ApproveCalibrationPlanDto {
  @ApiProperty({ description: 'CAS 버전 (동시 수정 방지)', example: 1 })
  casVersion: number;
}

/**
 * 반려 DTO (품질책임자 또는 시험소장)
 * rejectedBy는 서버에서 JWT로 추출
 */
export class RejectCalibrationPlanDto {
  @ApiProperty({ description: 'CAS 버전 (동시 수정 방지)', example: 1 })
  casVersion: number;

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
  @ApiPropertyOptional({ description: '제출 메모' })
  memo?: string;
}

/**
 * 항목 확인 DTO
 * confirmedBy는 서버에서 JWT로 추출
 */
export class ConfirmPlanItemDto {
  @ApiPropertyOptional({ description: 'CAS 버전 (동시 수정 방지)', example: 1 })
  casVersion?: number;
}

/**
 * 일괄 확인 스키마 — actualCalibrationId가 연결된 모든 미확인 항목을 한 번에 확인.
 * ⚠️ confirmedBy는 서버에서 JWT로 추출
 */
export const confirmAllPlanItemsSchema = z.object({
  casVersion: z.number().int().positive(VM.number.positive('casVersion')),
});

export type ConfirmAllPlanItemsInput = z.infer<typeof confirmAllPlanItemsSchema>;
/** 서비스 내부용 (controller가 userId 주입) */
export type ConfirmAllPlanItemsPayload = ConfirmAllPlanItemsInput & { confirmedBy: string };
export const ConfirmAllPlanItemsValidationPipe = new ZodValidationPipe(confirmAllPlanItemsSchema);

/** 일괄 확인 DTO (Swagger 문서화용) */
export class ConfirmAllPlanItemsDto {
  @ApiProperty({ description: 'CAS 버전 (동시 수정 방지)', example: 1 })
  casVersion: number;
}

/** 일괄 확인 응답 */
export interface ConfirmAllPlanItemsResult {
  confirmedCount: number;
}
