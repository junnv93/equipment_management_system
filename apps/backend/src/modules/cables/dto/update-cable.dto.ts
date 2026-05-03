import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  CableConnectorTypeEnum,
  CableStatusEnum,
  SiteEnum,
  VM,
} from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';

export const updateCableSchema = z.object({
  ...versionedSchema,
  managementNumber: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.CABLE_SHORT_TEXT_MAX_LENGTH,
      VM.string.max('관리번호', VALIDATION_RULES.CABLE_SHORT_TEXT_MAX_LENGTH)
    )
    .optional(),
  length: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.CABLE_SHORT_TEXT_MAX_LENGTH,
      VM.string.max('길이', VALIDATION_RULES.CABLE_SHORT_TEXT_MAX_LENGTH)
    )
    .optional(),
  connectorType: CableConnectorTypeEnum.optional(),
  frequencyRangeMin: z.number().int().nonnegative().optional(),
  frequencyRangeMax: z.number().int().nonnegative().optional(),
  serialNumber: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.CABLE_SERIAL_NUMBER_MAX_LENGTH,
      VM.string.max('시리얼번호', VALIDATION_RULES.CABLE_SERIAL_NUMBER_MAX_LENGTH)
    )
    .optional(),
  location: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.CABLE_LOCATION_MAX_LENGTH,
      VM.string.max('위치', VALIDATION_RULES.CABLE_LOCATION_MAX_LENGTH)
    )
    .optional(),
  site: SiteEnum.optional(),
  status: CableStatusEnum.optional(),
});

export type UpdateCableInput = z.infer<typeof updateCableSchema>;
export const UpdateCablePipe = new ZodValidationPipe(updateCableSchema);
