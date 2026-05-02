import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';

export const rejectRequestSchema = z.object({
  rejectionReason: z
    .string()
    .trim()
    .min(VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH, VM.approval.rejectReason.required)
    .max(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH),
  ...versionedSchema,
});

export class RejectRequestDto extends createZodDto(rejectRequestSchema) {}
export const RejectRequestPipe = new ZodValidationPipe(rejectRequestSchema);
