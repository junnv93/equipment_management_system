import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsNumber,
  IsObject,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// 보정계수 타입 enum
export enum CalibrationFactorType {
  ANTENNA_GAIN = 'antenna_gain',
  CABLE_LOSS = 'cable_loss',
  PATH_LOSS = 'path_loss',
  AMPLIFIER_GAIN = 'amplifier_gain',
  OTHER = 'other',
}

export class CreateCalibrationFactorDto {
  @ApiProperty({
    description: '장비 UUID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID('4')
  @IsNotEmpty()
  equipmentId: string;

  @ApiProperty({
    description: '연관 교정 기록 UUID (선택)',
    example: '550e8400-e29b-41d4-a716-446655440002',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  calibrationId?: string;

  @ApiProperty({
    description: '보정계수 타입',
    enum: CalibrationFactorType,
    example: 'antenna_gain',
  })
  @IsEnum(CalibrationFactorType)
  @IsNotEmpty()
  factorType: CalibrationFactorType;

  @ApiProperty({
    description: '보정계수 이름 (사용자 정의)',
    example: '3GHz 안테나 이득',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  factorName: string;

  @ApiProperty({
    description: '보정계수 값',
    example: 12.5,
  })
  @IsNumber()
  @IsNotEmpty()
  factorValue: number;

  @ApiProperty({
    description: '단위 (dB, dBi, dBm 등)',
    example: 'dBi',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  unit: string;

  @ApiProperty({
    description: '다중 파라미터 (주파수별 값 등)',
    example: { frequency: '3GHz', temperature: '25C', values: [1.2, 1.3, 1.4] },
    required: false,
  })
  @IsObject()
  @IsOptional()
  parameters?: Record<string, unknown>;

  @ApiProperty({
    description: '적용 시작일 (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @IsDateString()
  @IsNotEmpty()
  effectiveDate: string;

  @ApiProperty({
    description: '만료일 (YYYY-MM-DD, 선택)',
    example: '2025-01-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiProperty({
    description: '요청자 UUID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsUUID('4')
  @IsNotEmpty()
  requestedBy: string;
}
