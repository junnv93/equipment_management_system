import { IsString, IsOptional, IsInt, IsEnum, IsUUID, Min, Max, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
// import { CalibrationMethodEnum, CalibrationStatusEnum } from '@equipment-management/schemas';
import { CalibrationMethodEnum, CalibrationStatusEnum } from '../../../types';

export class CalibrationQueryDto {
  @ApiPropertyOptional({
    description: '장비 ID',
    example: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
  })
  @IsUUID('4')
  @IsOptional()
  equipmentId?: string;

  @ApiPropertyOptional({
    description: '교정 담당자 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID('4')
  @IsOptional()
  calibrationManagerId?: string;

  @ApiPropertyOptional({
    description: '교정 상태 (여러 상태 가능, 쉼표로 구분)',
    example: 'scheduled,in_progress,completed',
  })
  @IsOptional()
  @IsString()
  statuses?: string;

  @ApiPropertyOptional({
    description: '교정 방법 (여러 방법 가능, 쉼표로 구분)',
    example: 'external_calibration,internal_calibration',
  })
  @IsOptional()
  @IsString()
  methods?: string;

  @ApiPropertyOptional({
    description: '교정 기관/업체',
    example: '한국계측기술원',
  })
  @IsString()
  @IsOptional()
  calibrationAgency?: string;

  @ApiPropertyOptional({
    description: '교정일 시작 기간',
    example: '2023-01-01',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fromDate?: Date;

  @ApiPropertyOptional({
    description: '교정일 종료 기간',
    example: '2023-12-31',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  toDate?: Date;

  @ApiPropertyOptional({
    description: '다음 교정 예정일 시작',
    example: '2023-01-01',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  nextFromDate?: Date;

  @ApiPropertyOptional({
    description: '다음 교정 예정일 종료',
    example: '2023-12-31',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  nextToDate?: Date;

  @ApiPropertyOptional({
    description: '교정 결과 (합격/불합격)',
    example: 'true',
  })
  @IsOptional()
  isPassed?: string;

  @ApiPropertyOptional({
    description: '검색어 (인증서 번호, 메모 등)',
    example: 'CERT-2023',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: '정렬 기준 (필드명.asc 또는 필드명.desc)',
    example: 'calibrationDate.desc',
  })
  @IsString()
  @IsOptional()
  sort?: string = 'calibrationDate.desc';

  @ApiPropertyOptional({
    description: '페이지 번호',
    example: 1,
    default: 1,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지당 항목 수',
    example: 20,
    default: 20,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize?: number = 20;
}
