import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EquipmentStatus } from '../enum/equipment-status.enum';

export class CreateEquipmentDto {
  @ApiProperty({
    example: '오실로스코프',
    description: '장비 이름',
  })
  @IsNotEmpty({ message: '장비 이름은 필수 입력항목입니다.' })
  @IsString({ message: '장비 이름은 문자열이어야 합니다.' })
  @MaxLength(100, { message: '장비 이름은 최대 100자까지 입력 가능합니다.' })
  name: string;

  @ApiProperty({
    example: '측정기기',
    description: '장비 유형',
  })
  @IsNotEmpty({ message: '장비 유형은 필수 입력항목입니다.' })
  @IsString({ message: '장비 유형은 문자열이어야 합니다.' })
  type: string;

  @ApiProperty({
    example: '전자',
    description: '장비 카테고리',
  })
  @IsNotEmpty({ message: '장비 카테고리는 필수 입력항목입니다.' })
  @IsString({ message: '장비 카테고리는 문자열이어야 합니다.' })
  category: string;

  @ApiProperty({
    enum: EquipmentStatus,
    description: '장비 상태',
    required: false,
    default: EquipmentStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(EquipmentStatus, { message: '유효한 장비 상태가 아닙니다.' })
  status?: EquipmentStatus;

  @ApiProperty({
    example: '연구실 1',
    description: '장비 위치',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '장비 위치는 문자열이어야 합니다.' })
  location?: string;

  @ApiProperty({
    example: 'OSC-1234-5678',
    description: '장비 시리얼 번호',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '시리얼 번호는 문자열이어야 합니다.' })
  serialNumber?: string;

  @ApiProperty({
    example: '고용량 데이터 측정용 오실로스코프',
    description: '장비 설명',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '장비 설명은 문자열이어야 합니다.' })
  description?: string;

  @ApiProperty({
    example: 'Tektronix',
    description: '제조사',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '제조사는 문자열이어야 합니다.' })
  manufacturer?: string;

  @ApiProperty({
    example: 'MDO3104',
    description: '모델 번호',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '모델 번호는 문자열이어야 합니다.' })
  modelNumber?: string;

  @ApiProperty({
    example: '2023-01-01',
    description: '구매 날짜 (ISO 형식: YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: '구매 날짜는 YYYY-MM-DD 형식이어야 합니다.' })
  purchaseDate?: string;

  @ApiProperty({
    example: '2028-01-01',
    description: '보증 만료 날짜 (ISO 형식: YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: '보증 만료 날짜는 YYYY-MM-DD 형식이어야 합니다.' })
  warrantyExpirationDate?: string;

  @ApiProperty({
    example: '2024-06-01',
    description: '교정 만료 날짜 (ISO 형식: YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: '교정 만료 날짜는 YYYY-MM-DD 형식이어야 합니다.' })
  calibrationDueDate?: string;

  @ApiProperty({
    example: '연간 정기 유지보수 필요',
    description: '유지보수 정보',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '유지보수 정보는 문자열이어야 합니다.' })
  maintenanceInfo?: string;
}
