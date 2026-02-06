import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  IncidentTypeEnum,
  INCIDENT_TYPE_VALUES,
  type IncidentType,
} from '@equipment-management/schemas';

// Re-export for backward compatibility
export { IncidentTypeEnum, INCIDENT_TYPE_VALUES, type IncidentType };

// ========== Zod 스키마 정의 ==========

/**
 * 날짜 문자열 검증 스키마
 * - ISO 8601 datetime 형식 ('2024-01-15T00:00:00.000Z')
 * - 또는 날짜 전용 형식 ('2024-01-15')
 */
const dateStringSchema = z.string().refine(
  (val) => {
    // ISO 8601 datetime 또는 날짜 전용 형식 허용
    const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    return isoDateTimeRegex.test(val) && !isNaN(Date.parse(val));
  },
  { message: '유효한 날짜 형식이 아닙니다 (YYYY-MM-DD 또는 ISO 8601)' }
);

/**
 * 위치 변동 이력 생성 스키마
 */
export const createLocationHistorySchema = z.object({
  changedAt: dateStringSchema,
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
  performedAt: dateStringSchema,
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
 * 손상/오작동/변경/수리 내역 생성 스키마
 */
export const createIncidentHistorySchema = z.object({
  occurredAt: dateStringSchema,
  incidentType: IncidentTypeEnum,
  content: z.string().min(1, '내용을 입력해주세요').max(500, '내용은 500자 이하로 입력해주세요'),

  // 부적합 생성 관련 필드 (선택)
  createNonConformance: z.boolean().optional(),
  changeEquipmentStatus: z.boolean().optional(),
  actionPlan: z.string().max(500, '조치 계획은 500자 이하로 입력해주세요').optional(),
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
    enum: INCIDENT_TYPE_VALUES,
    example: 'damage',
  })
  incidentType: IncidentType;

  @ApiProperty({
    description: '주요 내용',
    example: '전원부 손상으로 인한 전원 보드 교체 필요',
    minLength: 1,
    maxLength: 500,
  })
  content: string;

  @ApiPropertyOptional({
    description: '부적합으로 등록 여부 (damage/malfunction 유형만 가능)',
    example: true,
  })
  createNonConformance?: boolean;

  @ApiPropertyOptional({
    description: '장비 상태를 non_conforming으로 변경 여부',
    example: false,
  })
  changeEquipmentStatus?: boolean;

  @ApiPropertyOptional({
    description: '조치 계획 (부적합 생성 시)',
    example: '외부 수리 예정',
    maxLength: 500,
  })
  actionPlan?: string;
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
    enum: INCIDENT_TYPE_VALUES,
  })
  incidentType: IncidentType;

  @ApiProperty({ description: '주요 내용' })
  content: string;

  @ApiPropertyOptional({ description: '보고자 ID' })
  reportedBy?: string;

  @ApiPropertyOptional({ description: '보고자 이름' })
  reportedByName?: string;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiPropertyOptional({ description: '연결된 부적합 ID (부적합 생성된 경우)' })
  nonConformanceId?: string;
}
