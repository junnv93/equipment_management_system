import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VM } from '@equipment-management/schemas';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';

export const approveInspectionSchema = z.object({
  ...versionedSchema,
});

export type ApproveInspectionInput = z.infer<typeof approveInspectionSchema>;
export const ApproveInspectionPipe = new ZodValidationPipe(approveInspectionSchema);

export const rejectInspectionSchema = z.object({
  ...versionedSchema,
  rejectionReason: z.string().min(1, VM.required('반려 사유')),
});

export type RejectInspectionInput = z.infer<typeof rejectInspectionSchema>;
export const RejectInspectionPipe = new ZodValidationPipe(rejectInspectionSchema);
