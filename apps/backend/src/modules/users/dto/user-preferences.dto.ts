import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  displayPreferencesSchema,
  DEFAULT_DISPLAY_PREFERENCES,
} from '@equipment-management/schemas';

// Re-export for local consumers
export { DEFAULT_DISPLAY_PREFERENCES };

/**
 * 업데이트 DTO: 모든 필드를 optional로 래핑 (부분 업데이트 허용)
 */
const updateDisplayPreferencesSchema = displayPreferencesSchema.partial();

export type DisplayPreferencesDto = typeof updateDisplayPreferencesSchema._output;

export const UpdatePreferencesValidationPipe = new ZodValidationPipe(
  updateDisplayPreferencesSchema
);
