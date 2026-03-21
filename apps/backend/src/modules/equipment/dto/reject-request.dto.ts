import { z } from 'zod';
import { VM } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';

export const rejectRequestSchema = z.object({
  rejectionReason: z.string().min(1, VM.approval.rejectReason.required).max(500),
  ...versionedSchema,
});

export type RejectRequestDto = z.infer<typeof rejectRequestSchema>;
export const RejectRequestPipe = new ZodValidationPipe(rejectRequestSchema);
