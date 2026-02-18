import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

export const rejectRequestSchema = z.object({
  rejectionReason: z.string().min(1).max(500),
});

export type RejectRequestDto = z.infer<typeof rejectRequestSchema>;
export const RejectRequestPipe = new ZodValidationPipe(rejectRequestSchema);
