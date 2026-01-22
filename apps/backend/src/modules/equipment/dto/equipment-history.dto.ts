import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 정의 ==========

/**
 * 위치 변동 이력 생성 스키마
 */
export const createLocationHistorySchema = z.object({
  changedAt: z.string().datetime({ message: '유효한 날짜 형식이 아닙니다' }),
  newLocation: z
    .string()
    .min(1, '위치를 입력해주세요')
    .max(100, '위치는 최대 100자까지 입력 가능합니다'),
  notes: z.string().optional(),
});

export type CreateLocationHistoryInput = z.infer<typeof createLocationHistorySchema>;
export const CreateLocationHistoryValidationPipe = new ZodValidationPipe(
  createLocationHistorySchema
);

/**
 * 장비 위치 변동 이력 생성 DTO (Swagger 문서화용)
 */
export class CreateLocationHistoryDto {
  @ApiProperty({
    description: '변동 일시',
    example: '2024-01-15T00:00:00.000Z',
  })
  changedAt: string;

  @ApiProperty({
    description: '설치 위치',
    example: 'RF1 Room',
    maxLength: 100,
  })
  newLocation: string;

  @ApiPropertyOptional({
    description: '비고',
    example: '장비 이동 - 공간 확보를 위한 재배치',
  })
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
 * 유지보수 내역 생성 스키마
 */
export const createMaintenanceHistorySchema = z.object({
  performedAt: z.string().datetime({ message: '유효한 날짜 형식이 아닙니다' }),
  content: z.string().min(1, '내용을 입력해주세요'),
});

export type CreateMaintenanceHistoryInput = z.infer<typeof createMaintenanceHistorySchema>;
export const CreateMaintenanceHistoryValidationPipe = new ZodValidationPipe(
  createMaintenanceHistorySchema
);

/**
 * 장비 유지보수 내역 생성 DTO (Swagger 문서화용)
 */
export class CreateMaintenanceHistoryDto {
  @ApiProperty({
    description: '수행 일시',
    example: '2024-01-15T00:00:00.000Z',
  })
  performedAt: string;

  @ApiProperty({
    description: '주요 내용',
    example: '분기별 정기 점검 - 정상 동작 확인',
    minLength: 1,
  })
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
 * 손상/오작동/변경/수리 내역 생성 스키마
 */
export const createIncidentHistorySchema = z.object({
  occurredAt: z.string().datetime({ message: '유효한 날짜 형식이 아닙니다' }),
  incidentType: z.nativeEnum(IncidentTypeEnum, { message: '유효한 유형을 선택해주세요' }),
  content: z.string().min(1, '내용을 입력해주세요'),
});

export type CreateIncidentHistoryInput = z.infer<typeof createIncidentHistorySchema>;
export const CreateIncidentHistoryValidationPipe = new ZodValidationPipe(
  createIncidentHistorySchema
);

/**
 * 장비 손상/오작동/변경/수리 내역 생성 DTO (Swagger 문서화용)
 */
export class CreateIncidentHistoryDto {
  @ApiProperty({
    description: '발생 일시',
    example: '2024-01-15T00:00:00.000Z',
  })
  occurredAt: string;

  @ApiProperty({
    description: '유형',
    enum: IncidentTypeEnum,
    example: IncidentTypeEnum.DAMAGE,
  })
  incidentType: IncidentTypeEnum;

  @ApiProperty({
    description: '주요 내용',
    example: '전원부 손상으로 인한 전원 보드 교체 필요',
    minLength: 1,
  })
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
