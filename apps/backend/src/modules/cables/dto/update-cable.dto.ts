import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  CableConnectorTypeEnum,
  CableStatusEnum,
  SiteEnum,
  VM,
} from '@equipment-management/schemas';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';

export const updateCableSchema = z.object({
  ...versionedSchema,
  managementNumber: z.string().max(20, VM.string.max('관리번호', 20)).optional(),
  length: z.string().max(20, VM.string.max('길이', 20)).optional(),
  connectorType: CableConnectorTypeEnum.optional(),
  frequencyRangeMin: z.number().int().nonnegative().optional(),
  frequencyRangeMax: z.number().int().nonnegative().optional(),
  serialNumber: z.string().max(100, VM.string.max('시리얼번호', 100)).optional(),
  location: z.string().max(50, VM.string.max('위치', 50)).optional(),
  site: SiteEnum.optional(),
  status: CableStatusEnum.optional(),
});

export type UpdateCableInput = z.infer<typeof updateCableSchema>;
export const UpdateCablePipe = new ZodValidationPipe(updateCableSchema);
