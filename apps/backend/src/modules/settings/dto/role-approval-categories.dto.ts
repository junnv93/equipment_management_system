import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { roleApprovalCategoriesSettingsSchema } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

export const updateRoleApprovalCategoriesSchema = z.object({
  roleCategories: roleApprovalCategoriesSettingsSchema,
});

export class UpdateRoleApprovalCategoriesDto extends createZodDto(
  updateRoleApprovalCategoriesSchema
) {}

export const UpdateRoleApprovalCategoriesValidationPipe = new ZodValidationPipe(
  updateRoleApprovalCategoriesSchema
);
