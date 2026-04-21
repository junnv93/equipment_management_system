import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { DIGEST_TIME_OPTIONS } from '@equipment-management/shared-constants';

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
    // frequency는 항상 'daily' 고정 (UI 노출 안 함) — 클라이언트에서 전송하지 않음
    digestTime: z.enum(DIGEST_TIME_OPTIONS).optional(),
  })
  .strict();

export class UpdateNotificationSettingsDto extends createZodDto(updateNotificationSettingsSchema) {}
export const UpdateNotificationSettingsPipe = new ZodValidationPipe(
  updateNotificationSettingsSchema
);
