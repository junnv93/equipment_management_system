import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';

export const createDestinationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, VM.string.min('반출지명', 1))
    .max(
      VALIDATION_RULES.DESTINATION_MAX_LENGTH,
      VM.string.max('반출지명', VALIDATION_RULES.DESTINATION_MAX_LENGTH)
    ),
});

export type CreateDestinationInput = z.infer<typeof createDestinationSchema>;
export const CreateDestinationValidationPipe = new ZodValidationPipe(createDestinationSchema);

export class CreateDestinationDto {
  @ApiProperty({
    description: '반출지명 (SSOT: VALIDATION_RULES.DESTINATION_MAX_LENGTH)',
    example: '한국산업기술원 3동',
    maxLength: VALIDATION_RULES.DESTINATION_MAX_LENGTH,
  })
  name: string;
}
