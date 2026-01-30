import { ApiPropertyOptional } from '@nestjs/swagger';
// ✅ Single Source of Truth: 모든 검증은 Zod 스키마를 사용합니다
import {
  EquipmentFilter,
  equipmentFilterSchema,
  EquipmentStatus,
  CalibrationMethod,
  Classification,
} from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

/**
 * 장비 검색 쿼리 DTO
 *
 * ✅ Zod 기반 검증으로 통일:
 * - 모든 검증은 @equipment-management/schemas 패키지의 equipmentFilterSchema 사용
 * - class-validator 제거, Zod 스키마가 단일 소스
 * - DTO 클래스는 Swagger 문서화(@ApiProperty)와 타입 힌트용으로만 사용
 */
export class EquipmentQueryDto implements Partial<EquipmentFilter> {
  @ApiPropertyOptional({
    description: '검색어 (장비명, 관리번호, 일련번호 등)',
    example: 'Receiver',
  })
  search?: string;

  @ApiPropertyOptional({
    description: '장비 상태',
    enum: [
      'available',
      'in_use',
      'checked_out',
      'calibration_scheduled',
      'calibration_overdue',
      'non_conforming',
      'spare',
      'retired',
    ],
    example: 'available',
  })
  status?: EquipmentStatus;

  @ApiPropertyOptional({
    description: '장비 위치',
    example: 'RF 시험실',
  })
  location?: string;

  @ApiPropertyOptional({
    description: '제조사',
    example: 'Anritsu',
  })
  manufacturer?: string;

  @ApiPropertyOptional({
    description: '팀 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  teamId?: string;

  @ApiPropertyOptional({
    description: '사이트',
    enum: ['suwon', 'uiwang'],
    example: 'suwon',
  })
  site?: 'suwon' | 'uiwang';

  @ApiPropertyOptional({
    description: '교정 방법 (외부교정/자체점검/비대상)',
    enum: ['external_calibration', 'self_inspection', 'not_applicable'],
    example: 'external_calibration',
  })
  calibrationMethod?: CalibrationMethod;

  @ApiPropertyOptional({
    description: '장비 분류',
    enum: ['fcc_emc_rf', 'general_emc', 'general_rf', 'sar', 'automotive_emc', 'software'],
    example: 'fcc_emc_rf',
  })
  classification?: Classification;

  @ApiPropertyOptional({
    description: '교정 임박 필터 - N일 이내 교정 예정 (오늘 <= nextCalibrationDate <= 오늘+N일)',
    example: 30,
  })
  calibrationDue?: number;

  @ApiPropertyOptional({
    description: '교정 여유 필터 - N일 이후 교정 예정 (nextCalibrationDate > 오늘+N일)',
    example: 30,
  })
  calibrationDueAfter?: number;

  @ApiPropertyOptional({
    description: '교정 기한 초과 필터 (true: 기한 초과된 장비만)',
    example: true,
  })
  calibrationOverdue?: boolean;

  @ApiPropertyOptional({
    description: '정렬 기준 (필드명.asc 또는 필드명.desc)',
    example: 'name.asc',
  })
  sort?: string;

  @ApiPropertyOptional({
    description: '페이지 번호',
    example: 1,
    default: 1,
  })
  page?: number;

  @ApiPropertyOptional({
    description: '페이지당 항목 수',
    example: 20,
    default: 20,
  })
  pageSize?: number;

  @ApiPropertyOptional({
    description: '공용장비 필터 (true: 공용장비만, false: 일반장비만)',
    example: true,
  })
  isShared?: boolean;
}

// Zod 검증 파이프 생성
export const EquipmentQueryValidationPipe = new ZodValidationPipe(equipmentFilterSchema);
