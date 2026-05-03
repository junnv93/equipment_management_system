import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { VM } from '@equipment-management/schemas';

export const approveEquipmentImportSchema = z.object({
  ...versionedSchema,
  comment: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('승인 코멘트', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional(),
});

export type ApproveEquipmentImportInput = z.infer<typeof approveEquipmentImportSchema>;
export const ApproveEquipmentImportValidationPipe = new ZodValidationPipe(
  approveEquipmentImportSchema
);

export class ApproveEquipmentImportDto extends VersionedDto {
  @ApiProperty({ description: '승인 코멘트', required: false })
  comment?: string;
}

// ============================================================================
// DEPRECATED: Legacy rental import DTO (backward compatibility)
// ============================================================================

/**
 * @deprecated Use ApproveEquipmentImportDto instead
 */
export const approveRentalImportSchema = approveEquipmentImportSchema;
export type ApproveRentalImportInput = ApproveEquipmentImportInput;
export const ApproveRentalImportValidationPipe = ApproveEquipmentImportValidationPipe;
export class ApproveRentalImportDto extends ApproveEquipmentImportDto {}
