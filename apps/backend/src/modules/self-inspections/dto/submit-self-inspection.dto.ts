import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';

export const submitSelfInspectionSchema = z.object({
  ...versionedSchema,
});

export type SubmitSelfInspectionInput = z.infer<typeof submitSelfInspectionSchema>;
export const SubmitSelfInspectionPipe = new ZodValidationPipe(submitSelfInspectionSchema);
