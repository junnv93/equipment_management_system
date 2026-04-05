import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CableConnectorTypeEnum, SiteEnum, VM } from '@equipment-management/schemas';

export const createCableSchema = z.object({
  managementNumber: z
    .string()
    .min(1, VM.required('관리번호'))
    .max(20, VM.string.max('관리번호', 20)),
  length: z.string().max(20, VM.string.max('길이', 20)).optional(),
  connectorType: CableConnectorTypeEnum.optional(),
  frequencyRangeMin: z.number().int().nonnegative().optional(),
  frequencyRangeMax: z.number().int().nonnegative().optional(),
  serialNumber: z.string().max(100, VM.string.max('시리얼번호', 100)).optional(),
  location: z.string().max(50, VM.string.max('위치', 50)).optional(),
  site: SiteEnum.optional(),
});

export type CreateCableInput = z.infer<typeof createCableSchema>;
export const CreateCablePipe = new ZodValidationPipe(createCableSchema);
