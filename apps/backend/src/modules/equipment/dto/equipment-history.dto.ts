import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';

/**
 * 장비 위치 변동 이력 생성 DTO
 */
export class CreateLocationHistoryDto {
  @ApiProperty({
    description: '변동 일시',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsDateString()
  changedAt: string;

  @ApiProperty({
    description: '설치 위치',
    example: 'RF1 Room',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  newLocation: string;

  @ApiPropertyOptional({
    description: '비고',
    example: '장비 이동 - 공간 확보를 위한 재배치',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * 장비 위치 변동 이력 응답 DTO
 */
export class LocationHistoryResponseDto {
  @ApiProperty({ description: 'UUID' })
  id: string;

  @ApiProperty({ description: '장비 ID' })
  equipmentId: string;

  @ApiProperty({ description: '변동 일시' })
  changedAt: Date;

  @ApiProperty({ description: '설치 위치' })
  newLocation: string;

  @ApiPropertyOptional({ description: '비고' })
  notes?: string;

  @ApiPropertyOptional({ description: '변경자 ID' })
  changedBy?: string;

  @ApiPropertyOptional({ description: '변경자 이름' })
  changedByName?: string;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;
}

/**
 * 장비 유지보수 내역 생성 DTO
 */
export class CreateMaintenanceHistoryDto {
  @ApiProperty({
    description: '수행 일시',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsDateString()
  performedAt: string;

  @ApiProperty({
    description: '주요 내용',
    example: '분기별 정기 점검 - 정상 동작 확인',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  content: string;
}

/**
 * 장비 유지보수 내역 응답 DTO
 */
export class MaintenanceHistoryResponseDto {
  @ApiProperty({ description: 'UUID' })
  id: string;

  @ApiProperty({ description: '장비 ID' })
  equipmentId: string;

  @ApiProperty({ description: '수행 일시' })
  performedAt: Date;

  @ApiProperty({ description: '주요 내용' })
  content: string;

  @ApiPropertyOptional({ description: '수행자 ID' })
  performedBy?: string;

  @ApiPropertyOptional({ description: '수행자 이름' })
  performedByName?: string;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;
}

/**
 * 장비 손상/오작동/변경/수리 내역 유형
 */
export enum IncidentTypeEnum {
  DAMAGE = 'damage',
  MALFUNCTION = 'malfunction',
  CHANGE = 'change',
  REPAIR = 'repair',
}

/**
 * 장비 손상/오작동/변경/수리 내역 생성 DTO
 */
export class CreateIncidentHistoryDto {
  @ApiProperty({
    description: '발생 일시',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsDateString()
  occurredAt: string;

  @ApiProperty({
    description: '유형',
    enum: IncidentTypeEnum,
    example: IncidentTypeEnum.DAMAGE,
  })
  @IsEnum(IncidentTypeEnum)
  incidentType: IncidentTypeEnum;

  @ApiProperty({
    description: '주요 내용',
    example: '전원부 손상으로 인한 전원 보드 교체 필요',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  content: string;
}

/**
 * 장비 손상/오작동/변경/수리 내역 응답 DTO
 */
export class IncidentHistoryResponseDto {
  @ApiProperty({ description: 'UUID' })
  id: string;

  @ApiProperty({ description: '장비 ID' })
  equipmentId: string;

  @ApiProperty({ description: '발생 일시' })
  occurredAt: Date;

  @ApiProperty({
    description: '유형',
    enum: IncidentTypeEnum,
  })
  incidentType: IncidentTypeEnum;

  @ApiProperty({ description: '주요 내용' })
  content: string;

  @ApiPropertyOptional({ description: '보고자 ID' })
  reportedBy?: string;

  @ApiPropertyOptional({ description: '보고자 이름' })
  reportedByName?: string;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;
}

/**
 * 유형별 한글 라벨
 */
export const INCIDENT_TYPE_LABELS: Record<IncidentTypeEnum, string> = {
  [IncidentTypeEnum.DAMAGE]: '손상',
  [IncidentTypeEnum.MALFUNCTION]: '오작동',
  [IncidentTypeEnum.CHANGE]: '변경',
  [IncidentTypeEnum.REPAIR]: '수리',
};
