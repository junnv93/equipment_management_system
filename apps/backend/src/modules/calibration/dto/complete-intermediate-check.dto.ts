import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';

export const completeIntermediateCheckSchema = z.object({
  notes: z.string().optional(),
  ...versionedSchema,
});

export type CompleteIntermediateCheckDto = z.infer<typeof completeIntermediateCheckSchema>;
export const CompleteIntermediateCheckPipe = new ZodValidationPipe(completeIntermediateCheckSchema);
