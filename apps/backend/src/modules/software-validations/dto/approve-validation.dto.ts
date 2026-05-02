import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';

export const approveValidationSchema = z.object({
  ...versionedSchema,
  /** 기술책임자 검토 코멘트 — ISO/IEC 17025 §6.2.2 audit trail (optional) */
  approvalComment: z.string().trim().max(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH).optional(),
});

export type ApproveValidationInput = z.infer<typeof approveValidationSchema>;
export const ApproveValidationPipe = new ZodValidationPipe(approveValidationSchema);

/**
 * 품질책임자 승인용 DTO — 기술책임자(`approve`)와 분리.
 * ISO/IEC 17025 §6.2.2: 책임/시점 다른 별도 audit trail 컬럼(`quality_approval_comment`).
 */
export const qualityApproveValidationSchema = z.object({
  ...versionedSchema,
  /** 품질책임자 검토 코멘트 — ISO/IEC 17025 §6.2.2 audit trail (optional) */
  qualityApprovalComment: z.string().trim().max(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH).optional(),
});

export type QualityApproveValidationInput = z.infer<typeof qualityApproveValidationSchema>;
export const QualityApproveValidationPipe = new ZodValidationPipe(qualityApproveValidationSchema);

export const rejectValidationSchema = z.object({
  ...versionedSchema,
  rejectionReason: z
    .string()
    .trim()
    .min(
      VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH,
      VM.string.min('반려 사유', VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH)
    )
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('반려 사유', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    ),
});

export type RejectValidationInput = z.infer<typeof rejectValidationSchema>;
export const RejectValidationPipe = new ZodValidationPipe(rejectValidationSchema);
