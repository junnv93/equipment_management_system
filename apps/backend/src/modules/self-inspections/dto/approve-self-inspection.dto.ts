import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VM } from '@equipment-management/schemas';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';

export const approveSelfInspectionSchema = z.object({
  ...versionedSchema,
});

export type ApproveSelfInspectionInput = z.infer<typeof approveSelfInspectionSchema>;
export const ApproveSelfInspectionPipe = new ZodValidationPipe(approveSelfInspectionSchema);

export const rejectSelfInspectionSchema = z.object({
  ...versionedSchema,
  rejectionReason: z.string().min(1, VM.required('반려 사유')),
});

export type RejectSelfInspectionInput = z.infer<typeof rejectSelfInspectionSchema>;
export const RejectSelfInspectionPipe = new ZodValidationPipe(rejectSelfInspectionSchema);
