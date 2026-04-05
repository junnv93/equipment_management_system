import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VM, uuidString } from '@equipment-management/schemas';

export const linkEquipmentSchema = z.object({
  equipmentId: uuidString(VM.uuid.invalid('장비')),
  notes: z.string().max(500, VM.string.max('비고', 500)).optional(),
});

export type LinkEquipmentInput = z.infer<typeof linkEquipmentSchema>;
export const LinkEquipmentPipe = new ZodValidationPipe(linkEquipmentSchema);
