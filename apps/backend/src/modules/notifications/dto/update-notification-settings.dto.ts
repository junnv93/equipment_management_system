import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

export const updateNotificationSettingsSchema = z
  .object({
    inAppEnabled: z.boolean().optional(),
    emailEnabled: z.boolean().optional(),
    checkoutEnabled: z.boolean().optional(),
    calibrationEnabled: z.boolean().optional(),
    calibrationPlanEnabled: z.boolean().optional(),
    nonConformanceEnabled: z.boolean().optional(),
    disposalEnabled: z.boolean().optional(),
    equipmentImportEnabled: z.boolean().optional(),
    equipmentEnabled: z.boolean().optional(),
    systemEnabled: z.boolean().optional(),
    frequency: z.enum(['immediate', 'daily', 'weekly']).optional(),
    digestTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: '시간은 HH:MM 형식이어야 합니다 (예: 09:00)',
      })
      .optional(),
  })
  .strict();

export type UpdateNotificationSettingsDto = z.infer<typeof updateNotificationSettingsSchema>;
export const UpdateNotificationSettingsPipe = new ZodValidationPipe(
  updateNotificationSettingsSchema
);
