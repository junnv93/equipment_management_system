import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  SharedSourceEnum,
  SiteEnum,
  type SharedSource,
  type Site,
} from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ============================================================================
// Zod 스키마 (SSOT)
// ============================================================================

export const createSharedEquipmentSchema = z.object({
  name: z.string().min(1),
  managementNumber: z.string().min(1),
  sharedSource: SharedSourceEnum,
  site: SiteEnum,
  modelName: z.string().optional(),
  manufacturer: z.string().optional(),
  location: z.string().optional(),
  calibrationCycle: z.coerce.number().int().positive().optional(),
});

export type CreateSharedEquipmentDto = z.infer<typeof createSharedEquipmentSchema>;

export const CreateSharedEquipmentValidationPipe = new ZodValidationPipe(
  createSharedEquipmentSchema
);

// ============================================================================
// Swagger DTO 클래스 (문서화 전용)
// ============================================================================

export class CreateSharedEquipmentSwaggerDto {
  @ApiProperty({ description: '장비명', example: '주파수 분석기' })
  name: string;

  @ApiProperty({ description: '관리번호', example: 'SUW-E0001' })
  managementNumber: string;

  @ApiProperty({ description: '공용장비 출처', enum: SharedSourceEnum.options })
  sharedSource: SharedSource;

  @ApiProperty({ description: '사이트', enum: SiteEnum.options })
  site: Site;

  @ApiPropertyOptional({ description: '모델명' })
  modelName?: string;

  @ApiPropertyOptional({ description: '제조사' })
  manufacturer?: string;

  @ApiPropertyOptional({ description: '보관 위치' })
  location?: string;

  @ApiPropertyOptional({ description: '교정 주기 (개월)', example: 12 })
  calibrationCycle?: number;
}
