import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { UserRoleEnum, UserRoleValues } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

export const simulateRoleAuditSchema = z.object({
  simulatedRole: UserRoleEnum.refine((role) => role !== UserRoleValues.SYSTEM_ADMIN, {
    message: 'system_admin cannot be simulated',
  }),
  path: z.string().trim().min(1).max(2000),
});

export class SimulateRoleAuditDto extends createZodDto(simulateRoleAuditSchema) {}

export const SimulateRoleAuditPipe = new ZodValidationPipe(simulateRoleAuditSchema);
