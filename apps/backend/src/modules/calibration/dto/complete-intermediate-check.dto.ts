import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';

export const completeIntermediateCheckSchema = z.object({
  notes: z.string().optional(),
  ...versionedSchema,
});

export class CompleteIntermediateCheckDto extends createZodDto(completeIntermediateCheckSchema) {}
export const CompleteIntermediateCheckPipe = new ZodValidationPipe(completeIntermediateCheckSchema);
