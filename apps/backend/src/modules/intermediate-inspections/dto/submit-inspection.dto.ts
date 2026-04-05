import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';

export const submitInspectionSchema = z.object({
  ...versionedSchema,
});

export type SubmitInspectionInput = z.infer<typeof submitInspectionSchema>;
export const SubmitInspectionPipe = new ZodValidationPipe(submitInspectionSchema);
