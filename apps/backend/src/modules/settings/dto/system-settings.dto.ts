import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  systemSettingsSchema,
  DEFAULT_SYSTEM_SETTINGS,
  type SystemSettings,
} from '@equipment-management/schemas';

// Re-export shared types for local consumers
export { DEFAULT_SYSTEM_SETTINGS, type SystemSettings };

/**
 * 업데이트 DTO: 모든 필드를 optional로 래핑 (부분 업데이트 허용)
 */
export const updateSystemSettingsSchema = systemSettingsSchema.partial();

export type UpdateSystemSettingsDto = z.infer<typeof updateSystemSettingsSchema>;

export const UpdateSystemSettingsValidationPipe = new ZodValidationPipe(updateSystemSettingsSchema);
