import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';
import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';

export const cancelEquipmentImportSchema = z.object({
  ...versionedSchema,
  reason: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('취소 사유', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional(),
});

export type CancelEquipmentImportInput = z.infer<typeof cancelEquipmentImportSchema>;
export const CancelEquipmentImportValidationPipe = new ZodValidationPipe(
  cancelEquipmentImportSchema
);

export class CancelEquipmentImportDto extends VersionedDto {
  @ApiProperty({ description: '취소 사유', required: false })
  reason?: string;
}
