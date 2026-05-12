import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { SavedViewScopeEnum } from '@equipment-management/schemas';
import type { SavedViewScope } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { versionedSchema, VersionedDto } from '../../../common/dto/base-versioned.dto';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

/**
 * Saved View 갱신 입력 — CAS (Optimistic Locking)
 *
 * `version` 필수 — 클라이언트가 직전 조회한 version 을 전송해야 동시 수정 충돌 감지 가능.
 * `ownerId` / `id` 등 식별자는 path/JWT 에서 추출 (Body 에서 받지 않음).
 *
 * Partial 갱신: name/params/scope/teamId 모두 optional. 전달된 필드만 갱신.
 * scope 변경 시 teamId 정합성은 service 가 enforce.
 */
export const updateSavedViewSchema = z
  .object({
    ...versionedSchema,
    name: z.string().trim().min(1).max(80).optional(),
    params: z.string().max(VALIDATION_RULES.LONG_CSV_MAX_LENGTH).optional(),
    scope: SavedViewScopeEnum.optional(),
    teamId: z.string().uuid().nullable().optional(),
  })
  .strict();

export type UpdateSavedViewInput = z.infer<typeof updateSavedViewSchema>;

export class UpdateSavedViewDto extends VersionedDto implements UpdateSavedViewInput {
  @ApiProperty({ description: '표시 이름', required: false, minLength: 1, maxLength: 80 })
  name?: string;

  @ApiProperty({ description: 'URL search params 직렬화 문자열', required: false })
  params?: string;

  @ApiProperty({ description: '공유 scope', required: false, enum: ['PRIVATE', 'TEAM', 'GLOBAL'] })
  scope?: SavedViewScope;

  @ApiProperty({
    description: 'scope=TEAM 일 때 필수. PRIVATE/GLOBAL 전환 시 null.',
    required: false,
    nullable: true,
    type: 'string',
    format: 'uuid',
  })
  teamId?: string | null;
}

export const UpdateSavedViewValidationPipe = new ZodValidationPipe(updateSavedViewSchema);
