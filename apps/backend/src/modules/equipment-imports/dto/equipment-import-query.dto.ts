import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  EQUIPMENT_IMPORT_STATUS_VALUES,
  EQUIPMENT_IMPORT_SOURCE_VALUES,
  EquipmentImportSortEnum,
  type EquipmentImportSortValue,
  type EquipmentImportSortField,
  SiteEnum,
  SortOrderEnum,
  type EquipmentImportStatus,
  type EquipmentImportSource,
  type Site,
  type SortOrder,
  optionalUuid,
  optionalTrimmedString,
} from '@equipment-management/schemas';
import { MAX_PAGE_SIZE, VALIDATION_RULES } from '@equipment-management/shared-constants';

export const equipmentImportQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).optional(),
  status: z.enum(EQUIPMENT_IMPORT_STATUS_VALUES).optional(),
  sourceType: z.enum(EQUIPMENT_IMPORT_SOURCE_VALUES).optional(),
  site: SiteEnum.optional(),
  teamId: optionalUuid(),
  search: optionalTrimmedString(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH, '검색어'),
  /**
   * 신규 결합형 sort enum (`'createdAt.desc'` 등) — 시스템 일관성 SSOT.
   * 미제공 시 legacy sortBy + sortOrder 분리형으로 fallback.
   * 자세한 내용은 `equipment-import-sort-mapper.ts`.
   */
  sort: EquipmentImportSortEnum.optional(),
  /** @deprecated 결합형 `sort` 권장. frontend migration 완료 시 제거 (tech-debt 등록). */
  sortBy: z
    .enum(['createdAt', 'usagePeriodStart', 'usagePeriodEnd', 'status'])
    .optional()
    .default('createdAt'),
  /** @deprecated 결합형 `sort` 권장. frontend migration 완료 시 제거 (tech-debt 등록). */
  sortOrder: SortOrderEnum.optional().default('desc'),
});

export type EquipmentImportQueryInput = z.infer<typeof equipmentImportQuerySchema>;
export const EquipmentImportQueryValidationPipe = new ZodValidationPipe(
  equipmentImportQuerySchema,
  { targets: ['query'] }
);

export class EquipmentImportQueryDto {
  @ApiProperty({ description: '페이지 번호', example: 1, required: false })
  page?: number;

  @ApiProperty({
    description: `페이지당 항목 수 (최대 ${MAX_PAGE_SIZE})`,
    example: 20,
    required: false,
  })
  limit?: number;

  @ApiProperty({
    description: '반입 상태 필터',
    enum: EQUIPMENT_IMPORT_STATUS_VALUES,
    required: false,
  })
  status?: EquipmentImportStatus;

  @ApiProperty({
    description: '출처 타입 필터 (NEW)',
    enum: EQUIPMENT_IMPORT_SOURCE_VALUES,
    example: 'rental',
    required: false,
  })
  sourceType?: EquipmentImportSource;

  @ApiProperty({
    description: '사이트 필터',
    enum: SiteEnum.options,
    example: 'suwon',
    required: false,
  })
  site?: Site;

  @ApiProperty({ description: '팀 ID 필터', example: 'uuid', required: false })
  teamId?: string;

  @ApiProperty({
    description: '검색어 (장비명, 업체명, 소유 부서)',
    example: 'EMC',
    required: false,
  })
  search?: string;

  @ApiProperty({
    description:
      '신규 결합형 정렬 기준 (`field.dir`, 예: `createdAt.desc`) — 시스템 일관성 SSOT. 미제공 시 legacy sortBy + sortOrder 사용',
    enum: EquipmentImportSortEnum.options,
    example: 'createdAt.desc',
    required: false,
  })
  sort?: EquipmentImportSortValue;

  /** @deprecated 결합형 `sort` 권장. */
  @ApiProperty({
    description: '@deprecated 정렬 기준 (legacy 분리형 — 결합형 `sort` 사용 권장)',
    enum: ['createdAt', 'usagePeriodStart', 'usagePeriodEnd', 'status'],
    default: 'createdAt',
    required: false,
  })
  sortBy?: EquipmentImportSortField;

  /** @deprecated 결합형 `sort` 권장. */
  @ApiProperty({
    description: '@deprecated 정렬 순서 (legacy 분리형 — 결합형 `sort` 사용 권장)',
    enum: SortOrderEnum.options,
    default: 'desc',
    required: false,
  })
  sortOrder?: SortOrder;
}

// ============================================================================
// DEPRECATED: Legacy rental import query DTO (backward compatibility)
// ============================================================================

/**
 * @deprecated Use EquipmentImportQueryDto instead
 */
export const rentalImportQuerySchema = equipmentImportQuerySchema;
export type RentalImportQueryInput = EquipmentImportQueryInput;
export const RentalImportQueryValidationPipe = EquipmentImportQueryValidationPipe;
export class RentalImportQueryDto extends EquipmentImportQueryDto {}
