import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  VALIDATION_RULES,
} from '@equipment-management/shared-constants';
import {
  CalibrationApprovalStatusEnum,
  CalibrationSortEnum,
  CALIBRATION_STATUS_VALUES,
  type CalibrationSortValue,
  type CalibrationStatus,
  SiteEnum,
  type Site,
  optionalUuid,
  optionalTrimmedString,
  optionalCsvEnum,
} from '@equipment-management/schemas';

/**
 * 교정 기한 상태 (날짜 기반 가상 상태)
 *
 * equipment.status 컬럼이 아닌 equipment.nextCalibrationDate 기반:
 * - overdue: nextCalibrationDate < today (교정 기한 초과)
 * - upcoming: today ≤ nextCalibrationDate ≤ today+30일 (교정 예정)
 * - normal: nextCalibrationDate > today+30일 또는 null (정상)
 *
 * 이유: CalibrationOverdueScheduler가 calibration_overdue → non_conforming으로
 * 자동 전환하므로 equipment.status로는 교정 기한 초과 장비를 식별할 수 없음.
 */
export const CalibrationDueStatusEnum = z.enum(['overdue', 'upcoming', 'normal']);
export type CalibrationDueStatus = z.infer<typeof CalibrationDueStatusEnum>;

// ========== Zod 스키마 정의 ==========

/**
 * 교정 조회 쿼리 스키마
 */
export const calibrationQuerySchema = z.object({
  equipmentId: optionalUuid(),
  calibrationManagerId: optionalUuid(),
  statuses: optionalCsvEnum(
    CALIBRATION_STATUS_VALUES,
    VALIDATION_RULES.LONG_CSV_MAX_LENGTH,
    '교정 상태 목록'
  ),
  methods: optionalTrimmedString(VALIDATION_RULES.LONG_CSV_MAX_LENGTH, '교정 방법 목록'),
  calibrationAgency: optionalTrimmedString(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH, '교정 기관'),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  nextFromDate: z.coerce.date().optional(),
  nextToDate: z.coerce.date().optional(),
  isPassed: optionalTrimmedString(VALIDATION_RULES.SHORT_TEXT_MAX_LENGTH, '교정 합격 여부'),
  search: optionalTrimmedString(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH, '검색어'),
  approvalStatus: CalibrationApprovalStatusEnum.optional(),
  teamId: optionalUuid(),
  site: SiteEnum.optional(),
  calibrationDueStatus: CalibrationDueStatusEnum.optional(),
  sort: CalibrationSortEnum.optional().default('calibrationDate.desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).optional().default(DEFAULT_PAGE_SIZE),
});

export type CalibrationQueryInput = z.infer<typeof calibrationQuerySchema>;
export const CalibrationQueryValidationPipe = new ZodValidationPipe(calibrationQuerySchema, {
  targets: ['query'],
});

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class CalibrationQueryDto {
  @ApiPropertyOptional({
    description: '장비 ID',
    example: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
  })
  equipmentId?: string;

  @ApiPropertyOptional({
    description: '교정 담당자 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  calibrationManagerId?: string;

  @ApiPropertyOptional({
    description:
      '교정 상태 (여러 상태 가능, 쉼표로 구분 — optionalCsvEnum 토큰 검증 후 CalibrationStatus[] 변환)',
    example: 'scheduled,in_progress,completed',
  })
  statuses?: CalibrationStatus[];

  @ApiPropertyOptional({
    description: '교정 방법 (여러 방법 가능, 쉼표로 구분)',
    example: 'external_calibration,calibration',
  })
  methods?: string;

  @ApiPropertyOptional({
    description: '교정 기관/업체',
    example: '한국계측기술원',
  })
  calibrationAgency?: string;

  @ApiPropertyOptional({
    description: '교정일 시작 기간',
    example: '2023-01-01',
  })
  fromDate?: Date;

  @ApiPropertyOptional({
    description: '교정일 종료 기간',
    example: '2023-12-31',
  })
  toDate?: Date;

  @ApiPropertyOptional({
    description: '다음 교정 예정일 시작',
    example: '2023-01-01',
  })
  nextFromDate?: Date;

  @ApiPropertyOptional({
    description: '다음 교정 예정일 종료',
    example: '2023-12-31',
  })
  nextToDate?: Date;

  @ApiPropertyOptional({
    description: '교정 결과 (합격/불합격)',
    example: 'true',
  })
  isPassed?: string;

  @ApiPropertyOptional({
    description: '검색어 (인증서 번호, 메모 등)',
    example: 'CERT-2023',
  })
  search?: string;

  @ApiPropertyOptional({
    description: '승인 상태',
    enum: CalibrationApprovalStatusEnum.options,
    example: 'pending_approval',
  })
  approvalStatus?: string;

  @ApiPropertyOptional({
    description: '팀 ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  teamId?: string;

  @ApiPropertyOptional({
    description: '사이트 필터',
    enum: SiteEnum.options,
    example: 'suwon',
  })
  site?: Site;

  @ApiPropertyOptional({
    description: '교정 기한 상태 필터 (날짜 기반: overdue/upcoming/normal)',
    enum: CalibrationDueStatusEnum.options,
    example: 'overdue',
  })
  calibrationDueStatus?: CalibrationDueStatus;

  @ApiPropertyOptional({
    description: '정렬 기준 (필드명.asc 또는 필드명.desc)',
    enum: CalibrationSortEnum.options,
    example: 'calibrationDate.desc',
  })
  sort?: CalibrationSortValue = 'calibrationDate.desc';

  @ApiPropertyOptional({
    description: '페이지 번호',
    example: 1,
    default: 1,
  })
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지당 항목 수',
    example: 20,
    default: 20,
  })
  pageSize?: number = DEFAULT_PAGE_SIZE;
}
