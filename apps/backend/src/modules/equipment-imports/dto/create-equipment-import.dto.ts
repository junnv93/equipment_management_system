import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  CLASSIFICATION_LABELS,
  type Classification,
  EQUIPMENT_IMPORT_SOURCE_VALUES,
  type EquipmentImportSource,
  VM,
} from '@equipment-management/schemas';

const classificationValues = Object.keys(CLASSIFICATION_LABELS) as [string, ...string[]];

/**
 * 장비 반입 생성 스키마 (Discriminated Union)
 *
 * sourceType에 따라 조건부 필드 validation:
 * - rental: vendorName 필수
 * - internal_shared: ownerDepartment 필수
 *
 * 주의: Zod v4에서 refinement가 있는 스키마에 .extend() 후 .omit() 불가.
 * baseImportSchemaRaw(refinement 없음)로 extend → 각 스키마에 refinement 개별 적용.
 */
const baseImportSchemaRaw = z.object({
  equipmentName: z.string().min(1, VM.equipmentImport.name.required).max(100),
  modelName: z.string().max(100).optional(),
  manufacturer: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  description: z.string().optional(),
  classification: z.enum(classificationValues, {
    message: VM.equipmentImport.classification.invalid,
  }),
  usagePeriodStart: z.string().datetime({ message: VM.date.invalid }),
  usagePeriodEnd: z.string().datetime({ message: VM.date.invalid }),
  reason: z.string().min(1, VM.equipmentImport.reason.required),
});

const dateRangeCheck = (data: { usagePeriodStart: string; usagePeriodEnd: string }): boolean =>
  new Date(data.usagePeriodEnd) > new Date(data.usagePeriodStart);
const dateRangeParams = {
  message: 'Usage end date must be after the start date.',
  path: ['usagePeriodEnd'] as string[],
};

// Rental import schema (외부 렌탈 업체)
const rentalImportSchemaRaw = baseImportSchemaRaw.extend({
  sourceType: z.literal('rental'),
  vendorName: z.string().min(1, VM.equipmentImport.rentalCompany.required).max(100),
  vendorContact: z.string().max(100).optional(),
  externalIdentifier: z.string().max(100).optional(),
  // Internal shared fields should be undefined for rental
  ownerDepartment: z.undefined().optional(),
  internalContact: z.undefined().optional(),
  borrowingJustification: z.undefined().optional(),
});
const rentalImportSchema = rentalImportSchemaRaw.refine(dateRangeCheck, dateRangeParams);

// Internal shared import schema (내부 공용장비)
const internalSharedImportSchema = baseImportSchemaRaw
  .extend({
    sourceType: z.literal('internal_shared'),
    ownerDepartment: z.string().min(1, VM.equipmentImport.ownerDepartment.required).max(100),
    internalContact: z.string().max(100).optional(),
    borrowingJustification: z.string().optional(),
    externalIdentifier: z.string().max(100).optional(),
    // Vendor fields should be undefined for internal shared
    vendorName: z.undefined().optional(),
    vendorContact: z.undefined().optional(),
  })
  .refine(dateRangeCheck, dateRangeParams);

// Discriminated union schema
export const createEquipmentImportSchema = z.discriminatedUnion('sourceType', [
  rentalImportSchema,
  internalSharedImportSchema,
]);

export type CreateEquipmentImportInput = z.infer<typeof createEquipmentImportSchema>;
export const CreateEquipmentImportValidationPipe = new ZodValidationPipe(
  createEquipmentImportSchema
);

// Base DTO class for Swagger documentation
export class CreateEquipmentImportDto {
  @ApiProperty({
    description: '장비 반입 출처 타입',
    enum: EQUIPMENT_IMPORT_SOURCE_VALUES,
    example: 'rental',
  })
  sourceType: EquipmentImportSource;

  @ApiProperty({ description: '장비명', example: 'EMC 수신기' })
  equipmentName: string;

  @ApiProperty({ description: '모델명', example: 'ESR26', required: false })
  modelName?: string;

  @ApiProperty({ description: '제조사', example: 'R&S', required: false })
  manufacturer?: string;

  @ApiProperty({ description: '일련번호', example: 'SN12345', required: false })
  serialNumber?: string;

  @ApiProperty({ description: '장비 설명', required: false })
  description?: string;

  @ApiProperty({ description: '분류', example: 'fcc_emc_rf' })
  classification: Classification;

  @ApiProperty({ description: '사용 시작일 (ISO)', example: '2026-03-01T00:00:00Z' })
  usagePeriodStart: string;

  @ApiProperty({ description: '사용 종료일 (ISO)', example: '2026-06-01T00:00:00Z' })
  usagePeriodEnd: string;

  @ApiProperty({ description: '반입 사유', example: '정기 교정 기간 중 대체 장비 필요' })
  reason: string;

  // Rental fields (sourceType='rental' required)
  @ApiProperty({
    description: '렌탈 업체명 (rental 타입 필수)',
    example: 'ABC 장비렌탈',
    required: false,
  })
  vendorName?: string;

  @ApiProperty({
    description: '업체 연락처 (rental 타입)',
    example: '02-1234-5678',
    required: false,
  })
  vendorContact?: string;

  @ApiProperty({
    description: '업체 장비번호 (rental 타입)',
    example: 'RNT-2026-001',
    required: false,
  })
  externalIdentifier?: string;

  // Internal shared fields (sourceType='internal_shared' required)
  @ApiProperty({
    description: '소유 부서 (internal_shared 타입 필수)',
    example: 'Safety Lab',
    required: false,
  })
  ownerDepartment?: string;

  @ApiProperty({
    description: '내부 담당자 연락처 (internal_shared 타입)',
    example: 'John Doe (ext. 1234)',
    required: false,
  })
  internalContact?: string;

  @ApiProperty({
    description: '상세 반입 사유 (internal_shared 타입)',
    example: '특수 EMC 시험을 위해 Safety Lab의 Spectrum Analyzer 필요',
    required: false,
  })
  borrowingJustification?: string;
}

// ============================================================================
// DEPRECATED: Legacy rental import DTO (backward compatibility)
// ============================================================================

/**
 * @deprecated Use CreateEquipmentImportDto instead
 */
export const createRentalImportSchema = rentalImportSchemaRaw
  .omit({ sourceType: true })
  .refine(dateRangeCheck, dateRangeParams);
export type CreateRentalImportInput = z.infer<typeof createRentalImportSchema>;
export const CreateRentalImportValidationPipe = new ZodValidationPipe(createRentalImportSchema);

/**
 * @deprecated Use CreateEquipmentImportDto instead
 */
export class CreateRentalImportDto {
  @ApiProperty({ description: '장비명', example: 'EMC 수신기' })
  equipmentName: string;

  @ApiProperty({ description: '모델명', example: 'ESR26', required: false })
  modelName?: string;

  @ApiProperty({ description: '제조사', example: 'R&S', required: false })
  manufacturer?: string;

  @ApiProperty({ description: '일련번호', example: 'SN12345', required: false })
  serialNumber?: string;

  @ApiProperty({ description: '장비 설명', required: false })
  description?: string;

  @ApiProperty({ description: '분류', example: 'fcc_emc_rf' })
  classification: Classification;

  @ApiProperty({ description: '렌탈 업체명', example: 'ABC 장비렌탈' })
  vendorName: string;

  @ApiProperty({ description: '업체 연락처', example: '02-1234-5678', required: false })
  vendorContact?: string;

  @ApiProperty({ description: '업체 장비번호', example: 'RNT-2026-001', required: false })
  externalIdentifier?: string;

  @ApiProperty({ description: '사용 시작일 (ISO)', example: '2026-03-01T00:00:00Z' })
  usagePeriodStart: string;

  @ApiProperty({ description: '사용 종료일 (ISO)', example: '2026-06-01T00:00:00Z' })
  usagePeriodEnd: string;

  @ApiProperty({ description: '반입 사유', example: '정기 교정 기간 중 대체 장비 필요' })
  reason: string;
}
