import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';

export const submitValidationSchema = z.object({
  ...versionedSchema,
});

export type SubmitValidationInput = z.infer<typeof submitValidationSchema>;
export const SubmitValidationPipe = new ZodValidationPipe(submitValidationSchema);
