import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

export const approveEquipmentImportSchema = z.object({
  comment: z.string().optional(),
});

export type ApproveEquipmentImportInput = z.infer<typeof approveEquipmentImportSchema>;
export const ApproveEquipmentImportValidationPipe = new ZodValidationPipe(
  approveEquipmentImportSchema
);

export class ApproveEquipmentImportDto {
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
