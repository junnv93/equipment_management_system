import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { SharedSourceEnum, SiteEnum, VM } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';

export const createSharedEquipmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, VM.required('장비명'))
    .max(
      VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH,
      VM.string.max('장비명', VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH)
    ),
  managementNumber: z
    .string()
    .trim()
    .min(1, VM.required('관리번호'))
    .max(
      VALIDATION_RULES.MANAGEMENT_NUMBER_MAX_LENGTH,
      VM.string.max('관리번호', VALIDATION_RULES.MANAGEMENT_NUMBER_MAX_LENGTH)
    ),
  sharedSource: SharedSourceEnum,
  site: SiteEnum,
  modelName: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH,
      VM.string.max('모델명', VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH)
    )
    .optional(),
  manufacturer: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH,
      VM.string.max('제조사', VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH)
    )
    .optional(),
  location: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH,
      VM.string.max('위치', VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH)
    )
    .optional(),
  calibrationCycle: z.coerce.number().int().positive().optional(),
});

export class CreateSharedEquipmentDto extends createZodDto(createSharedEquipmentSchema) {}

export const CreateSharedEquipmentValidationPipe = new ZodValidationPipe(
  createSharedEquipmentSchema
);
