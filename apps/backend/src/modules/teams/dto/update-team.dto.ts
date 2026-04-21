import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  ClassificationEnum,
  SiteEnum,
  CLASSIFICATION_TO_CODE,
  nullableOptionalUuid,
  VM,
} from '@equipment-management/schemas';

/**
 * 팀 업데이트 스키마
 * ✅ SSOT: ClassificationEnum은 @equipment-management/schemas에서 import
 * ✅ Zod-first 패턴 (NestJS PartialType 대신 직접 Zod schema 정의)
 * ✅ leaderId: nullable() — null 전송 시 팀장 해제
 */
export const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  classification: ClassificationEnum.optional(),
  site: SiteEnum.optional(),
  classificationCode: z
    .enum(Object.values(CLASSIFICATION_TO_CODE) as [string, ...string[]])
    .optional(),
  description: z.string().max(500).optional(),
  leaderId: nullableOptionalUuid(VM.uuid.invalid('팀장')),
});

export class UpdateTeamDto extends createZodDto(updateTeamSchema) {}
export const UpdateTeamValidationPipe = new ZodValidationPipe(updateTeamSchema);
