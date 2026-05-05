import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ApprovalCategoryEnum, uuidString } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

const isoDateString = z.string().datetime();

export const createApprovalDelegationSchema = z.object({
  delegatorId: uuidString(),
  delegateeId: uuidString(),
  category: ApprovalCategoryEnum,
  startsAt: isoDateString,
  endsAt: isoDateString,
  reason: z.string().trim().max(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH).optional(),
});

export const approvalDelegationIdParamSchema = z.object({
  id: uuidString(),
});

export class CreateApprovalDelegationDto extends createZodDto(createApprovalDelegationSchema) {}

export const CreateApprovalDelegationValidationPipe = new ZodValidationPipe(
  createApprovalDelegationSchema
);
