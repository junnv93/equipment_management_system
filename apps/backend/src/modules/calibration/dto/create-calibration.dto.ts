import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import {
  ManagementMethodEnum,
  type ManagementMethod,
  CalibrationStatusEnum,
  type CalibrationStatus,
  CalibrationRegisteredByRoleEnum,
  type CalibrationRegisteredByRole,
  CalibrationResultEnum,
  type CalibrationResult,
  VM,
  optionalUuid,
  uuidString,
} from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/**
 * 교정 기본 스키마 (refinement 없음 - omit/pick 등을 위한 base)
 */
export const calibrationBaseSchema = z.object({
  equipmentId: uuidString(VM.uuid.generic),
  calibrationManagerId: optionalUuid(), // FE 미전송 시 registeredBy 폴백
  planItemId: optionalUuid(), // 교정계획 항목 직접 링크 (plan-item 진입점)
  calibrationDate: z.coerce.date({ message: VM.date.invalid }),
  nextCalibrationDate: z.coerce.date({ message: VM.date.invalid }).optional(),
  managementMethod: ManagementMethodEnum.optional().default('external_calibration'),
  status: CalibrationStatusEnum.default(CalibrationStatusEnum.enum.scheduled),
  calibrationAgency: z.string().min(1, VM.calibration.agency.required).max(100),
  certificateNumber: z.string().max(100).optional(),
  result: CalibrationResultEnum.optional(),
  notes: z.string().optional(),
  intermediateCheckDate: z.coerce.date().optional(),
  registeredBy: optionalUuid(),
  registeredByRole: CalibrationRegisteredByRoleEnum.optional(),
  registrarComment: z.string().optional(),
});

/**
 * 교정 생성 스키마 (refinement 포함)
 */
export const createCalibrationSchema = calibrationBaseSchema.refine(
  (data) => {
    // 기술책임자가 직접 등록할 경우 코멘트 필수
    if (data.registeredByRole === CalibrationRegisteredByRoleEnum.enum.technical_manager) {
      return !!data.registrarComment;
    }
    return true;
  },
  { message: VM.calibration.techManagerComment, path: ['registrarComment'] }
);

export type CreateCalibrationInput = z.infer<typeof createCalibrationSchema>;

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class CreateCalibrationDto {
  @ApiProperty({ description: '장비 ID', example: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p' })
  equipmentId: string;

  @ApiProperty({ description: '교정 담당자 ID', required: false })
  calibrationManagerId?: string;

  @ApiProperty({ description: '교정계획 항목 ID (plan-item 진입점)', required: false })
  planItemId?: string;

  @ApiProperty({ description: '교정 일자', example: '2023-05-20' })
  calibrationDate: Date;

  @ApiProperty({
    description: '다음 교정 예정일 (미전송 시 백엔드에서 자동 계산)',
    example: '2024-05-20',
    required: false,
  })
  nextCalibrationDate?: Date;

  @ApiProperty({
    description: '교정 방법',
    enum: ManagementMethodEnum.options,
    required: false,
    default: 'external_calibration',
  })
  managementMethod?: ManagementMethod;

  @ApiProperty({
    description: '교정 상태',
    enum: CalibrationStatusEnum.options,
    default: 'scheduled',
    required: false,
  })
  status?: CalibrationStatus;

  @ApiProperty({ description: '교정 기관/업체', example: '한국계측기술원' })
  calibrationAgency: string;

  @ApiProperty({ description: '교정성적서 번호', required: false })
  certificateNumber?: string;

  @ApiProperty({
    description: '교정 결과',
    enum: CalibrationResultEnum.options,
    required: false,
  })
  result?: CalibrationResult;

  @ApiProperty({ description: '교정 결과 메모', required: false })
  notes?: string;

  @ApiProperty({ description: '중간점검 일정', required: false })
  intermediateCheckDate?: Date;

  @ApiProperty({ description: '등록자 ID', required: false })
  registeredBy?: string;

  @ApiProperty({
    description: '등록자 역할',
    enum: CalibrationRegisteredByRoleEnum.options,
    required: false,
  })
  registeredByRole?: CalibrationRegisteredByRole;

  @ApiProperty({ description: '등록자 코멘트', required: false })
  registrarComment?: string;
}
