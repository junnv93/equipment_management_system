import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VM } from '@equipment-management/schemas';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';

export const approveValidationSchema = z.object({
  ...versionedSchema,
  comment: z.string().optional(),
});

export type ApproveValidationInput = z.infer<typeof approveValidationSchema>;
export const ApproveValidationPipe = new ZodValidationPipe(approveValidationSchema);

export const rejectValidationSchema = z.object({
  ...versionedSchema,
  rejectionReason: z.string().min(1, VM.required('반려 사유')),
});

export type RejectValidationInput = z.infer<typeof rejectValidationSchema>;
export const RejectValidationPipe = new ZodValidationPipe(rejectValidationSchema);
