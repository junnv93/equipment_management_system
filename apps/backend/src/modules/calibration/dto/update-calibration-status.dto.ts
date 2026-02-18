import { z } from 'zod';
import { CalibrationStatusEnum } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

export const updateCalibrationStatusSchema = z.object({
  status: CalibrationStatusEnum,
});

export type UpdateCalibrationStatusDto = z.infer<typeof updateCalibrationStatusSchema>;
export const UpdateCalibrationStatusPipe = new ZodValidationPipe(updateCalibrationStatusSchema);
