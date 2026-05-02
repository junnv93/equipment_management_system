import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';

export const approveInspectionSchema = z.object({
  ...versionedSchema,
});

export type ApproveInspectionInput = z.infer<typeof approveInspectionSchema>;
export const ApproveInspectionPipe = new ZodValidationPipe(approveInspectionSchema);

export const rejectInspectionSchema = z.object({
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

export type RejectInspectionInput = z.infer<typeof rejectInspectionSchema>;
export const RejectInspectionPipe = new ZodValidationPipe(rejectInspectionSchema);
