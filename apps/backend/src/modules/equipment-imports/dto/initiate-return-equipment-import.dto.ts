import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';

export const initiateReturnEquipmentImportSchema = z.object({
  ...versionedSchema,
});

export type InitiateReturnEquipmentImportInput = z.infer<
  typeof initiateReturnEquipmentImportSchema
>;
export const InitiateReturnEquipmentImportValidationPipe = new ZodValidationPipe(
  initiateReturnEquipmentImportSchema
);

export class InitiateReturnEquipmentImportDto extends VersionedDto {}
