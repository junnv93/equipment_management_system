import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { DEFAULT_CALIBRATION_ALERT_DAYS } from '@equipment-management/schemas';

// Re-export for local consumers
export { DEFAULT_CALIBRATION_ALERT_DAYS };

export const updateCalibrationSettingsSchema = z.object({
  alertDays: z.array(z.number().int().min(0).max(365)).min(1).max(10),
});

export type UpdateCalibrationSettingsDto = z.infer<typeof updateCalibrationSettingsSchema>;

export const UpdateCalibrationSettingsValidationPipe = new ZodValidationPipe(
  updateCalibrationSettingsSchema
);
