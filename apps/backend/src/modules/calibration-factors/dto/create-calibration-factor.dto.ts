import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  CalibrationFactorTypeEnum,
  CalibrationFactorTypeValues,
  CALIBRATION_FACTOR_TYPE_VALUES,
  type CalibrationFactorType,
  VM,
  uuidString,
} from '@equipment-management/schemas';

// Re-export for backward compatibility
export {
  CalibrationFactorTypeEnum,
  CalibrationFactorTypeValues,
  CALIBRATION_FACTOR_TYPE_VALUES,
  type CalibrationFactorType,
};

// ========== Zod 스키마 정의 ==========

/**
 * 보정계수 생성 스키마
 */
export const createCalibrationFactorSchema = z.object({
  equipmentId: uuidString(VM.uuid.invalid('장비')),
  calibrationId: uuidString(VM.uuid.invalid('교정')).optional(),
  factorType: CalibrationFactorTypeEnum,
  factorName: z
    .string()
    .min(1, VM.calibrationFactor.name.required)
    .max(200, VM.string.max('보정계수 이름', 200)),
  factorValue: z.number({ message: VM.calibrationFactor.value.invalid }),
  unit: z.string().min(1, VM.calibrationFactor.unit.required).max(20, VM.string.max('단위', 20)),
  parameters: z.record(z.string(), z.unknown()).optional(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: VM.date.invalidYMD,
  }),
  expiryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: VM.date.invalidYMD,
    })
    .optional(),
  // 서버에서 JWT를 통해 추출하므로 클라이언트 전송 불필요 (하위 호환성을 위해 optional 유지)
  requestedBy: uuidString(VM.uuid.invalid('요청자')).optional(),
});

export type CreateCalibrationFactorInput = z.infer<typeof createCalibrationFactorSchema>;
export const CreateCalibrationFactorValidationPipe = new ZodValidationPipe(
  createCalibrationFactorSchema
);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class CreateCalibrationFactorDto {
  @ApiProperty({
    description: '장비 UUID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  equipmentId: string;

  @ApiProperty({
    description: '연관 교정 기록 UUID (선택)',
    example: '550e8400-e29b-41d4-a716-446655440002',
    required: false,
  })
  calibrationId?: string;

  @ApiProperty({
    description: '보정계수 타입',
    enum: CALIBRATION_FACTOR_TYPE_VALUES,
    example: 'antenna_gain',
  })
  factorType: CalibrationFactorType;

  @ApiProperty({
    description: '보정계수 이름 (사용자 정의)',
    example: '3GHz 안테나 이득',
  })
  factorName: string;

  @ApiProperty({
    description: '보정계수 값',
    example: 12.5,
  })
  factorValue: number;

  @ApiProperty({
    description: '단위 (dB, dBi, dBm 등)',
    example: 'dBi',
  })
  unit: string;

  @ApiProperty({
    description: '다중 파라미터 (주파수별 값 등)',
    example: { frequency: '3GHz', temperature: '25C', values: [1.2, 1.3, 1.4] },
    required: false,
  })
  parameters?: Record<string, unknown>;

  @ApiProperty({
    description: '적용 시작일 (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  effectiveDate: string;

  @ApiProperty({
    description: '만료일 (YYYY-MM-DD, 선택)',
    example: '2025-01-15',
    required: false,
  })
  expiryDate?: string;

  @ApiProperty({
    description: '요청자 UUID (서버에서 JWT로 자동 추출, 클라이언트 전송 불필요)',
    example: '550e8400-e29b-41d4-a716-446655440003',
    required: false,
  })
  requestedBy?: string;
}
