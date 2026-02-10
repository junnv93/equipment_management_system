import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CLASSIFICATION_LABELS, type Classification } from '@equipment-management/schemas';

const classificationValues = Object.keys(CLASSIFICATION_LABELS) as [string, ...string[]];

export const createRentalImportSchema = z.object({
  equipmentName: z.string().min(1, '장비명을 입력해주세요').max(100),
  modelName: z.string().max(100).optional(),
  manufacturer: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  description: z.string().optional(),
  classification: z.enum(classificationValues, {
    message: '유효하지 않은 분류입니다.',
  }),
  vendorName: z.string().min(1, '렌탈 업체명을 입력해주세요').max(100),
  vendorContact: z.string().max(100).optional(),
  externalIdentifier: z.string().max(100).optional(),
  usagePeriodStart: z.string().datetime({ message: '유효한 날짜 형식이 아닙니다' }),
  usagePeriodEnd: z.string().datetime({ message: '유효한 날짜 형식이 아닙니다' }),
  reason: z.string().min(1, '반입 사유를 입력해주세요'),
});

export type CreateRentalImportInput = z.infer<typeof createRentalImportSchema>;
export const CreateRentalImportValidationPipe = new ZodValidationPipe(createRentalImportSchema);

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
