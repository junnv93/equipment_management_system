import { IsString, IsOptional, IsInt, IsDate, IsBoolean, IsUUID, IsNotEmpty, Min, Max, Length, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { EquipmentStatusEnum, CalibrationMethodEnum } from '../../../types';

export class CreateEquipmentDto {
  @ApiProperty({
    description: '장비 이름',
    example: 'RF 신호 분석기'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: '관리 번호 (고유)',
    example: 'EQP-2023-001'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  managementNumber: string;

  @ApiProperty({
    description: '자산 번호',
    example: 'AST-10542',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  assetNumber?: string;

  @ApiProperty({
    description: '모델명',
    example: 'MS2090A',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  modelName?: string;

  @ApiProperty({
    description: '제조사',
    example: 'Anritsu',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  manufacturer?: string;

  @ApiProperty({
    description: '일련번호',
    example: 'SN123456789',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  serialNumber?: string;

  @ApiProperty({
    description: '위치',
    example: 'RF 시험실 2층',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  location?: string;

  @ApiProperty({
    description: '교정 주기 (월)',
    example: 12,
    required: false
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(60)
  calibrationCycle?: number;

  @ApiProperty({
    description: '최근 교정일',
    example: '2023-01-15',
    required: false
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  lastCalibrationDate?: Date;

  @ApiProperty({
    description: '다음 교정 예정일',
    example: '2024-01-15',
    required: false
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  nextCalibrationDate?: Date;

  @ApiProperty({
    description: '교정기관',
    example: '한국계측기술원',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  calibrationAgency?: string;

  @ApiProperty({
    description: '중간점검 필요 여부',
    example: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  needsIntermediateCheck?: boolean;

  @ApiProperty({
    description: '교정 방법',
    enum: CalibrationMethodEnum,
    example: 'external_calibration',
    required: false
  })
  @IsString()
  @IsOptional()
  calibrationMethod?: string;

  @ApiProperty({
    description: '구매 연도',
    example: 2023,
    required: false
  })
  @IsInt()
  @IsOptional()
  @Min(1990)
  @Max(2100)
  purchaseYear?: number;

  @ApiProperty({
    description: '팀 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false
  })
  @IsUUID('4')
  @IsOptional()
  teamId?: string;

  @ApiProperty({
    description: '장비 관리자 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false
  })
  @IsUUID('4')
  @IsOptional()
  managerId?: string;

  @ApiProperty({
    description: '공급사',
    example: '테크원',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  supplier?: string;

  @ApiProperty({
    description: '연락처',
    example: '02-123-4567',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  contactInfo?: string;

  @ApiProperty({
    description: '소프트웨어 버전',
    example: 'v2.1.0',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  softwareVersion?: string;

  @ApiProperty({
    description: '펌웨어 버전',
    example: 'v1.5.2',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  firmwareVersion?: string;

  @ApiProperty({
    description: '매뉴얼 위치',
    example: '공유 드라이브/매뉴얼/RF분석기',
    required: false
  })
  @IsString()
  @IsOptional()
  manualLocation?: string;

  @ApiProperty({
    description: '부속품',
    example: '전원 케이블, 안테나, 케이스',
    required: false
  })
  @IsString()
  @IsOptional()
  accessories?: string;

  @ApiProperty({
    description: '주요 기능',
    example: 'RF 스펙트럼 분석, 신호 측정',
    required: false
  })
  @IsString()
  @IsOptional()
  mainFeatures?: string;

  @ApiProperty({
    description: '기술 담당자',
    example: '김기술',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  technicalManager?: string;

  @ApiProperty({
    description: '장비 상태',
    enum: EquipmentStatusEnum,
    example: 'available',
    required: false,
    default: 'available'
  })
  @IsString()
  @IsOptional()
  status?: string;
} 