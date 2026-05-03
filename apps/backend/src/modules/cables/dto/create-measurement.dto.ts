import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { optionalUuid, VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';

const dataPointSchema = z.object({
  frequencyMhz: z.number().int().positive(),
  lossDb: z
    .string()
    .min(1, VM.required('손실값'))
    .max(
      VALIDATION_RULES.CABLE_SHORT_TEXT_MAX_LENGTH,
      VM.string.max('손실값', VALIDATION_RULES.CABLE_SHORT_TEXT_MAX_LENGTH)
    ),
});

export const createMeasurementSchema = z.object({
  measurementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, VM.date.invalidYMD),
  measurementEquipmentId: optionalUuid(),
  notes: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('비고', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional(),
  dataPoints: z.array(dataPointSchema).min(1, VM.array.min('데이터 포인트', 1)),
});

export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>;
export const CreateMeasurementPipe = new ZodValidationPipe(createMeasurementSchema);
