import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  CalibrationMethodEnum,
  CalibrationStatusEnum,
  CalibrationRegisteredByRoleEnum,
  CalibrationResultEnum,
} from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/**
 * 교정 기본 스키마 (refinement 없음 - omit/pick 등을 위한 base)
 */
export const calibrationBaseSchema = z.object({
  equipmentId: z.string().uuid('유효한 UUID 형식이 아닙니다'),
  calibrationManagerId: z.string().uuid('유효한 UUID 형식이 아닙니다'),
  calibrationDate: z.coerce.date({ message: '유효한 날짜 형식이 아닙니다' }),
  nextCalibrationDate: z.coerce.date({ message: '유효한 날짜 형식이 아닙니다' }),
  calibrationMethod: CalibrationMethodEnum,
  status: CalibrationStatusEnum.default(CalibrationStatusEnum.enum.scheduled),
  calibrationAgency: z.string().min(1, '교정 기관을 입력해주세요').max(100),
  certificationNumber: z.string().max(100).optional(),
  certificatePath: z.string().max(500).optional(), // 교정성적서 파일 경로
  result: CalibrationResultEnum.optional(), // 교정 결과 (SSOT)
  cost: z.number().min(0).optional(),
  isPassed: z.boolean().optional(),
  resultNotes: z.string().optional(),
  reportFilePath: z.string().optional(),
  additionalInfo: z.string().optional(),
  intermediateCheckDate: z.coerce.date().optional(),
  registeredBy: z.string().uuid().optional(),
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
  { message: '기술책임자는 등록자 코멘트를 반드시 입력해야 합니다.', path: ['registrarComment'] }
);

export type CreateCalibrationInput = z.infer<typeof createCalibrationSchema>;
export const CreateCalibrationValidationPipe = new ZodValidationPipe(createCalibrationSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class CreateCalibrationDto {
  @ApiProperty({
    description: '장비 ID',
    example: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
  })
  equipmentId: string;

  @ApiProperty({
    description: '교정 담당자 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  calibrationManagerId: string;

  @ApiProperty({
    description: '교정 일자',
    example: '2023-05-20',
  })
  calibrationDate: Date;

  @ApiProperty({
    description: '다음 교정 예정일',
    example: '2024-05-20',
  })
  nextCalibrationDate: Date;

  @ApiProperty({
    description: '교정 방법',
    enum: CalibrationMethodEnum.options,
    example: 'external_calibration',
  })
  calibrationMethod: string;

  @ApiProperty({
    description: '교정 상태',
    enum: CalibrationStatusEnum.options,
    example: 'scheduled',
    default: 'scheduled',
  })
  status: string = 'scheduled';

  @ApiProperty({
    description: '교정 기관/업체',
    example: '한국계측기술원',
  })
  calibrationAgency: string;

  @ApiProperty({
    description: '교정 인증서 번호',
    example: 'CERT-2023-12345',
    required: false,
  })
  certificationNumber?: string;

  @ApiProperty({
    description: '교정성적서 파일 경로',
    example: '/uploads/calibration/cert-2023-12345.pdf',
    required: false,
  })
  certificatePath?: string;

  @ApiProperty({
    description: '교정 결과',
    enum: ['pass', 'fail', 'conditional'],
    example: 'pass',
    required: false,
  })
  result?: string;

  @ApiProperty({
    description: '교정 비용',
    example: 500000,
    required: false,
  })
  cost?: number;

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

  @ApiProperty({
    description: '교정 보고서 파일 경로',
    example: '/reports/calibration/EQ-RF-001-2023.pdf',
    required: false,
  })
  reportFilePath?: string;

  @ApiProperty({
    description: '추가 정보',
    example: '온도 23±2°C, 습도 50±10%RH 환경에서 교정 수행',
    required: false,
  })
  additionalInfo?: string;

  @ApiProperty({
    description: '중간점검 일정',
    example: '2024-06-15',
    required: false,
  })
  intermediateCheckDate?: Date;

  @ApiProperty({
    description: '등록자 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  registeredBy?: string;

  @ApiProperty({
    description: '등록자 역할',
    enum: CalibrationRegisteredByRoleEnum.options,
    example: 'test_engineer',
    required: false,
  })
  registeredByRole?: string;

  @ApiProperty({
    description: '등록자 코멘트 (기술책임자 직접 등록 시 필수)',
    example: '교정 결과 검토 완료',
    required: false,
  })
  registrarComment?: string;
}
