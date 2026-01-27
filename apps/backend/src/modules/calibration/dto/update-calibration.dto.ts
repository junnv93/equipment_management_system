import { PartialType, OmitType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CreateCalibrationDto, calibrationBaseSchema } from './create-calibration.dto';
import { CalibrationStatusEnum } from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/**
 * 교정 수정 스키마 (base 스키마에서 파생 - Zod v4에서는 refine 후 omit 불가)
 */
export const updateCalibrationSchema = calibrationBaseSchema
  .omit({ equipmentId: true })
  .partial()
  .extend({
    status: CalibrationStatusEnum.optional(),
    isPassed: z.boolean().optional(),
    resultNotes: z.string().optional(),
  });

export type UpdateCalibrationInput = z.infer<typeof updateCalibrationSchema>;
export const UpdateCalibrationValidationPipe = new ZodValidationPipe(updateCalibrationSchema);

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
  status?: string;

  @ApiProperty({
    description: '교정 결과 (합격/불합격)',
    example: true,
    required: false,
  })
  isPassed?: boolean;

  @ApiProperty({
    description: '교정 결과 메모',
    example: '모든 파라미터가 허용 오차 범위 내에 있습니다.',
    required: false,
  })
  resultNotes?: string;
}
