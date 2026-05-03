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
import { VALIDATION_RULES } from '@equipment-management/shared-constants';

/**
 * 팀 업데이트 스키마
 * ✅ SSOT: ClassificationEnum은 @equipment-management/schemas에서 import
 * ✅ Zod-first 패턴 (NestJS PartialType 대신 직접 Zod schema 정의)
 * ✅ leaderId: nullable() — null 전송 시 팀장 해제
 */
export const updateTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, VM.team.name.required)
    .max(
      VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH,
      VM.string.max('팀 이름', VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH)
    )
    .optional(),
  classification: ClassificationEnum.optional(),
  site: SiteEnum.optional(),
  classificationCode: z
    .enum(Object.values(CLASSIFICATION_TO_CODE) as [string, ...string[]])
    .optional(),
  description: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('팀 설명', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional(),
  leaderId: nullableOptionalUuid(VM.uuid.invalid('팀장')),
});

export class UpdateTeamDto extends createZodDto(updateTeamSchema) {}
export const UpdateTeamValidationPipe = new ZodValidationPipe(updateTeamSchema);
