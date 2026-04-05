import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { optionalUuid, VM } from '@equipment-management/schemas';

const dataPointSchema = z.object({
  frequencyMhz: z.number().int().positive(),
  lossDb: z.string().min(1, VM.required('손실값')).max(20, VM.string.max('손실값', 20)),
});

export const createMeasurementSchema = z.object({
  measurementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD여야 합니다'),
  measurementEquipmentId: optionalUuid(),
  notes: z.string().optional(),
  dataPoints: z.array(dataPointSchema).min(1, '최소 1개의 데이터 포인트가 필요합니다'),
});

export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>;
export const CreateMeasurementPipe = new ZodValidationPipe(createMeasurementSchema);
