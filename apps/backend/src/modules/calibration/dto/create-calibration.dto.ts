import {
  IsString,
  IsOptional,
  IsDate,
  IsUUID,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEnum,
  IsNumber,
  Min,
  IsBoolean,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  CalibrationMethodEnum,
  CalibrationStatusEnum,
  CalibrationApprovalStatusEnum,
  CalibrationRegisteredByRoleEnum,
} from '../../../types';

export class CreateCalibrationDto {
  @ApiProperty({
    description: '장비 ID',
    example: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
  })
  @IsUUID('4')
  @IsNotEmpty()
  equipmentId: string;

  @ApiProperty({
    description: '교정 담당자 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID('4')
  @IsNotEmpty()
  calibrationManagerId: string;

  @ApiProperty({
    description: '교정 일자',
    example: '2023-05-20',
  })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  calibrationDate: Date;

  @ApiProperty({
    description: '다음 교정 예정일',
    example: '2024-05-20',
  })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  nextCalibrationDate: Date;

  @ApiProperty({
    description: '교정 방법',
    enum: CalibrationMethodEnum,
    example: 'external_calibration',
  })
  @IsEnum(CalibrationMethodEnum)
  @IsNotEmpty()
  calibrationMethod: string;

  @ApiProperty({
    description: '교정 상태',
    enum: CalibrationStatusEnum,
    example: 'scheduled',
    default: 'scheduled',
  })
  @IsEnum(CalibrationStatusEnum)
  @IsNotEmpty()
  status: string = 'scheduled';

  @ApiProperty({
    description: '교정 기관/업체',
    example: '한국계측기술원',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  calibrationAgency: string;

  @ApiProperty({
    description: '교정 인증서 번호',
    example: 'CERT-2023-12345',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  certificationNumber?: string;

  @ApiProperty({
    description: '교정 비용',
    example: 500000,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  cost?: number;

  @ApiProperty({
    description: '교정 결과 (합격/불합격)',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPassed?: boolean;

  @ApiProperty({
    description: '교정 결과 메모',
    example: '모든 파라미터가 허용 오차 범위 내에 있습니다.',
    required: false,
  })
  @IsString()
  @IsOptional()
  resultNotes?: string;

  @ApiProperty({
    description: '교정 보고서 파일 경로',
    example: '/reports/calibration/EQ-RF-001-2023.pdf',
    required: false,
  })
  @IsString()
  @IsOptional()
  reportFilePath?: string;

  @ApiProperty({
    description: '추가 정보',
    example: '온도 23±2°C, 습도 50±10%RH 환경에서 교정 수행',
    required: false,
  })
  @IsString()
  @IsOptional()
  additionalInfo?: string;

  @ApiProperty({
    description: '중간점검 일정',
    example: '2024-06-15',
    required: false,
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  intermediateCheckDate?: Date;

  @ApiProperty({
    description: '등록자 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  registeredBy?: string;

  @ApiProperty({
    description: '등록자 역할',
    enum: CalibrationRegisteredByRoleEnum,
    example: 'test_operator',
    required: false,
  })
  @IsEnum(CalibrationRegisteredByRoleEnum)
  @IsOptional()
  registeredByRole?: string;

  @ApiProperty({
    description: '등록자 코멘트 (기술책임자 직접 등록 시 필수)',
    example: '교정 결과 검토 완료',
    required: false,
  })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.registeredByRole === 'technical_manager')
  @IsNotEmpty({ message: '기술책임자는 등록자 코멘트를 반드시 입력해야 합니다.' })
  registrarComment?: string;
}
