import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { SharedSourceEnum, SiteEnum } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

export const createSharedEquipmentSchema = z.object({
  name: z.string().min(1),
  managementNumber: z.string().min(1),
  sharedSource: SharedSourceEnum,
  site: SiteEnum,
  modelName: z.string().optional(),
  manufacturer: z.string().optional(),
  location: z.string().optional(),
  calibrationCycle: z.coerce.number().int().positive().optional(),
});

export class CreateSharedEquipmentDto extends createZodDto(createSharedEquipmentSchema) {}

export const CreateSharedEquipmentValidationPipe = new ZodValidationPipe(
  createSharedEquipmentSchema
);
