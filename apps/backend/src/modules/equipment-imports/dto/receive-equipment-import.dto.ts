import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CalibrationMethodEnum } from '@equipment-management/schemas';

export const receiveEquipmentImportSchema = z
  .object({
    receivingCondition: z.object({
      appearance: z.enum(['normal', 'abnormal'], { message: '외관 상태를 선택해주세요' }),
      operation: z.enum(['normal', 'abnormal'], { message: '작동 상태를 선택해주세요' }),
      accessories: z.enum(['complete', 'incomplete'], {
        message: '부속품 상태를 선택해주세요',
      }),
      notes: z.string().optional(),
    }),

    // 교정 정보 추가 (선택적)
    calibrationInfo: z
      .object({
        calibrationMethod: CalibrationMethodEnum,
        calibrationCycle: z.number().int().positive().optional(),
        lastCalibrationDate: z.string().optional(), // ISO 8601 형식
        calibrationAgency: z.string().min(1).optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      // 외부 교정 선택 시 모든 교정 필드 필수
      if (data.calibrationInfo?.calibrationMethod === 'external_calibration') {
        return (
          data.calibrationInfo.calibrationCycle &&
          data.calibrationInfo.lastCalibrationDate &&
          data.calibrationInfo.calibrationAgency
        );
      }
      return true;
    },
    {
      message: '외부 교정 선택 시 교정 주기, 최종 교정일, 교정 기관을 모두 입력해야 합니다.',
    }
  );

export type ReceiveEquipmentImportInput = z.infer<typeof receiveEquipmentImportSchema>;
export const ReceiveEquipmentImportValidationPipe = new ZodValidationPipe(
  receiveEquipmentImportSchema
);

export class ReceiveEquipmentImportDto {
  @ApiProperty({
    description: '수령 시 상태점검 결과',
    example: {
      appearance: 'normal',
      operation: 'normal',
      accessories: 'complete',
      notes: '양호한 상태',
    },
  })
  receivingCondition: {
    appearance: 'normal' | 'abnormal';
    operation: 'normal' | 'abnormal';
    accessories: 'complete' | 'incomplete';
    notes?: string;
  };

  @ApiProperty({
    description: '교정 정보 (선택적, 외부 교정 시 필수)',
    required: false,
    example: {
      calibrationMethod: 'external_calibration',
      calibrationCycle: 12,
      lastCalibrationDate: '2026-02-09',
      calibrationAgency: 'ABC 교정사',
    },
  })
  calibrationInfo?: {
    calibrationMethod: string;
    calibrationCycle?: number;
    lastCalibrationDate?: string;
    calibrationAgency?: string;
  };
}

// ============================================================================
// DEPRECATED: Legacy rental import DTO (backward compatibility)
// ============================================================================

/**
 * @deprecated Use ReceiveEquipmentImportDto instead
 */
export const receiveRentalImportSchema = receiveEquipmentImportSchema;
export type ReceiveRentalImportInput = ReceiveEquipmentImportInput;
export const ReceiveRentalImportValidationPipe = ReceiveEquipmentImportValidationPipe;
export class ReceiveRentalImportDto extends ReceiveEquipmentImportDto {}
