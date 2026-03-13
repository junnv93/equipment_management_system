import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

export const completeIntermediateCheckSchema = z.object({
  notes: z.string().optional(),
});

export type CompleteIntermediateCheckDto = z.infer<typeof completeIntermediateCheckSchema>;
export const CompleteIntermediateCheckPipe = new ZodValidationPipe(completeIntermediateCheckSchema);
