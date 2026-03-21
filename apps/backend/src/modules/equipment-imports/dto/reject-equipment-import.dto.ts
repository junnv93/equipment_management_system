import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';
import { VM } from '@equipment-management/schemas';

export const rejectEquipmentImportSchema = z.object({
  ...versionedSchema,
  rejectionReason: z.string().min(1, VM.approval.rejectReason.required),
});

export type RejectEquipmentImportInput = z.infer<typeof rejectEquipmentImportSchema>;
export const RejectEquipmentImportValidationPipe = new ZodValidationPipe(
  rejectEquipmentImportSchema
);

export class RejectEquipmentImportDto extends VersionedDto {
  @ApiProperty({ description: '반려 사유', example: '장비 사양이 요구사항과 맞지 않습니다.' })
  rejectionReason: string;
}

// ============================================================================
// DEPRECATED: Legacy rental import DTO (backward compatibility)
// ============================================================================

/**
 * @deprecated Use RejectEquipmentImportDto instead
 */
export const rejectRentalImportSchema = rejectEquipmentImportSchema;
export type RejectRentalImportInput = RejectEquipmentImportInput;
export const RejectRentalImportValidationPipe = RejectEquipmentImportValidationPipe;
export class RejectRentalImportDto extends RejectEquipmentImportDto {}
