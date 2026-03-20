import { PartialType, OmitType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CreateCalibrationDto, calibrationBaseSchema } from './create-calibration.dto';
import { CalibrationStatusEnum, type CalibrationStatus } from '@equipment-management/schemas';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';

// ========== Zod 스키마 정의 ==========

/**
 * 교정 수정 스키마 (base 스키마에서 파생 - Zod v4에서는 refine 후 omit 불가)
 *
 * ✅ CAS: version 필드 추가 (optional — 내부 호출(certificatePath 등)에서는 version 없이 사용)
 */
export const updateCalibrationSchema = calibrationBaseSchema
  .omit({ equipmentId: true })
  .partial()
  .extend({
    status: CalibrationStatusEnum.optional(),
    version: versionedSchema.version,
  });

export type UpdateCalibrationInput = z.infer<typeof updateCalibrationSchema>;
export const UpdateCalibrationValidationPipe = new ZodValidationPipe(updateCalibrationSchema);

export const internalUpdateCalibrationSchema = updateCalibrationSchema.extend({
  version: versionedSchema.version.optional(),
});
export type InternalUpdateCalibrationInput = z.infer<typeof internalUpdateCalibrationSchema>;

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class UpdateCalibrationDto extends PartialType(
  OmitType(CreateCalibrationDto, ['equipmentId'] as const)
) {
  @ApiProperty({
    description: '교정 상태',
    enum: CalibrationStatusEnum.options,
    example: 'completed',
    required: false,
  })
  status?: CalibrationStatus;

  @ApiProperty({
    description: 'Optimistic locking version (CAS 보호 시 필수)',
    example: 1,
    required: false,
    type: 'integer',
    minimum: 1,
  })
  version?: number;
}
