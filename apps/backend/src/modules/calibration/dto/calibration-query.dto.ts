import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@equipment-management/shared-constants';
import { CalibrationApprovalStatusEnum, SiteEnum, type Site } from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/**
 * 교정 조회 쿼리 스키마
 */
export const calibrationQuerySchema = z.object({
  equipmentId: z.string().uuid().optional(),
  calibrationManagerId: z.string().uuid().optional(),
  statuses: z.string().optional(),
  methods: z.string().optional(),
  calibrationAgency: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  nextFromDate: z.coerce.date().optional(),
  nextToDate: z.coerce.date().optional(),
  isPassed: z.string().optional(),
  search: z.string().optional(),
  approvalStatus: CalibrationApprovalStatusEnum.optional(),
  teamId: z.string().uuid().optional(),
  site: SiteEnum.optional(),
  sort: z.string().default('calibrationDate.desc'),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    (val) => (val ? Number(val) : DEFAULT_PAGE_SIZE),
    z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE)
  ),
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
    description: '교정 상태 (여러 상태 가능, 쉼표로 구분)',
    example: 'scheduled,in_progress,completed',
  })
  statuses?: string;

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
    description: '정렬 기준 (필드명.asc 또는 필드명.desc)',
    example: 'calibrationDate.desc',
  })
  sort?: string = 'calibrationDate.desc';

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
