import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  ClassificationEnum, // ← TeamTypeEnum → ClassificationEnum
  SiteEnum,
  type Classification, // ← TeamType → Classification
  type ClassificationCode,
  type Site,
} from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/**
 * 팀 업데이트 스키마
 * ✅ SSOT: ClassificationEnum은 @equipment-management/schemas에서 import
 * ✅ Zod-first 패턴 (NestJS PartialType 대신 직접 Zod schema 정의)
 * ✅ leaderId: nullable() — null 전송 시 팀장 해제
 */
export const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  classification: ClassificationEnum.optional(), // ← type → classification
  site: SiteEnum.optional(),
  classificationCode: z.enum(['E', 'R', 'W', 'S', 'A', 'P']).optional(),
  description: z.string().max(500).optional(),
  leaderId: z.string().uuid().nullable().optional(),
});

export type UpdateTeamDto = z.infer<typeof updateTeamSchema>;
export const UpdateTeamValidationPipe = new ZodValidationPipe(updateTeamSchema);

// ========== Swagger 문서화용 클래스 ==========

export class UpdateTeamSwaggerDto {
  @ApiPropertyOptional({ description: '팀 이름', example: 'FCC EMC/RF 테스트팀' })
  name?: string;

  @ApiPropertyOptional({
    description: '팀 분류 (장비 분류와 동일, 소문자_언더스코어)',
    enum: ['fcc_emc_rf', 'general_emc', 'general_rf', 'sar', 'automotive_emc', 'software'], // ← 소문자
  })
  classification?: Classification; // ← type → classification

  @ApiPropertyOptional({
    description: '팀 소속 사이트',
    enum: ['suwon', 'uiwang', 'pyeongtaek'],
  })
  site?: Site;

  @ApiPropertyOptional({
    description: '분류코드',
    enum: ['E', 'R', 'W', 'S', 'A', 'P'],
  })
  classificationCode?: ClassificationCode;

  @ApiPropertyOptional({ description: '팀 설명' })
  description?: string;

  @ApiPropertyOptional({
    description: '팀장 ID (null = 팀장 해제)',
    nullable: true,
  })
  leaderId?: string | null;
}
