import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CableConnectorTypeEnum, SiteEnum, VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';

export const createCableSchema = z.object({
  managementNumber: z
    .string()
    .trim()
    .min(1, VM.required('관리번호'))
    .max(
      VALIDATION_RULES.CABLE_SHORT_TEXT_MAX_LENGTH,
      VM.string.max('관리번호', VALIDATION_RULES.CABLE_SHORT_TEXT_MAX_LENGTH)
    ),
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
});

export type CreateCableInput = z.infer<typeof createCableSchema>;
export const CreateCablePipe = new ZodValidationPipe(createCableSchema);
