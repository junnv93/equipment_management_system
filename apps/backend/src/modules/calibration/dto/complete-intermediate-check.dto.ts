import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { VM } from '@equipment-management/schemas';

export const completeIntermediateCheckSchema = z.object({
  notes: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('비고', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional(),
  ...versionedSchema,
});

export class CompleteIntermediateCheckDto extends createZodDto(completeIntermediateCheckSchema) {}
export const CompleteIntermediateCheckPipe = new ZodValidationPipe(completeIntermediateCheckSchema);
