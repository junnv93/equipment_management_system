import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

export const confirmSelfInspectionSchema = z.object({
  version: z.number().int().min(1),
});

export type ConfirmSelfInspectionInput = z.infer<typeof confirmSelfInspectionSchema>;
export const ConfirmSelfInspectionPipe = new ZodValidationPipe(confirmSelfInspectionSchema);
