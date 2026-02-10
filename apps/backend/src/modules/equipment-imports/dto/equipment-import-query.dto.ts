import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  EQUIPMENT_IMPORT_STATUS_VALUES,
  EQUIPMENT_IMPORT_SOURCE_VALUES,
  type EquipmentImportStatus,
  type EquipmentImportSource,
} from '@equipment-management/schemas';

export const equipmentImportQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.enum(EQUIPMENT_IMPORT_STATUS_VALUES as unknown as [string, ...string[]]).optional(),
  sourceType: z.enum(EQUIPMENT_IMPORT_SOURCE_VALUES as unknown as [string, ...string[]]).optional(),
  site: z.enum(['suwon', 'uiwang', 'pyeongtaek']).optional(),
  teamId: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(['createdAt', 'usagePeriodStart', 'usagePeriodEnd', 'status'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type EquipmentImportQueryInput = z.infer<typeof equipmentImportQuerySchema>;
export const EquipmentImportQueryValidationPipe = new ZodValidationPipe(equipmentImportQuerySchema);

export class EquipmentImportQueryDto {
  @ApiProperty({ description: '페이지 번호', example: 1, required: false })
  page?: number;

  @ApiProperty({ description: '페이지당 항목 수 (최대 100)', example: 20, required: false })
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

  @ApiProperty({ description: '사이트 필터', example: 'suwon', required: false })
  site?: string;

  @ApiProperty({ description: '팀 ID 필터', example: 'uuid', required: false })
  teamId?: string;

  @ApiProperty({
    description: '검색어 (장비명, 업체명, 소유 부서)',
    example: 'EMC',
    required: false,
  })
  search?: string;

  @ApiProperty({
    description: '정렬 기준',
    enum: ['createdAt', 'usagePeriodStart', 'usagePeriodEnd', 'status'],
    default: 'createdAt',
    required: false,
  })
  sortBy?: string;

  @ApiProperty({
    description: '정렬 순서',
    enum: ['asc', 'desc'],
    default: 'desc',
    required: false,
  })
  sortOrder?: 'asc' | 'desc';
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
