import { z } from 'zod';
import { CalibrationStatusEnum } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';

export const updateCalibrationStatusSchema = z.object({
  status: CalibrationStatusEnum,
  ...versionedSchema,
});

export type UpdateCalibrationStatusDto = z.infer<typeof updateCalibrationStatusSchema>;
export const UpdateCalibrationStatusPipe = new ZodValidationPipe(updateCalibrationStatusSchema);
