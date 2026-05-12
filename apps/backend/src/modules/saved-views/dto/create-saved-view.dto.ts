import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { SavedViewScopeEnum, SavedViewModuleEnum } from '@equipment-management/schemas';
import type { SavedViewScope, SavedViewModule } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

/**
 * Saved View 생성 입력
 *
 * - `ownerId` 는 클라이언트에서 받지 않는다 (Rule 2 — JWT 추출).
 * - `params` 는 URL search string 형식 그대로 (백엔드는 형식 검증 없음, 클라이언트 책임).
 * - `scope=TEAM` 일 때만 `teamId` 필수, PRIVATE/GLOBAL 은 null/생략.
 */
export const createSavedViewSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Saved View 이름은 비울 수 없습니다.')
      .max(80, 'Saved View 이름은 80자를 넘을 수 없습니다.'),
    params: z
      .string()
      .max(
        VALIDATION_RULES.LONG_CSV_MAX_LENGTH,
        'URL params 가 너무 깁니다. 1000자 이내로 입력하세요.'
      ),
    module: SavedViewModuleEnum,
    scope: SavedViewScopeEnum,
    /** scope=TEAM 일 때만 사용. PRIVATE/GLOBAL 시 null 또는 omit. */
    teamId: z.string().uuid().nullable().optional(),
  })
  .strict();

export type CreateSavedViewInput = z.infer<typeof createSavedViewSchema>;

export class CreateSavedViewDto implements CreateSavedViewInput {
  @ApiProperty({ description: 'Saved View 표시 이름', minLength: 1, maxLength: 80 })
  name!: string;

  @ApiProperty({
    description: 'URL search params 직렬화 문자열 (예: status=APPROVED&purpose=CAL)',
    maxLength: VALIDATION_RULES.LONG_CSV_MAX_LENGTH,
  })
  params!: string;

  @ApiProperty({ description: '뷰가 속한 도메인 모듈 (MVP: checkouts)', enum: ['checkouts'] })
  module!: SavedViewModule;

  @ApiProperty({ description: '공유 scope', enum: ['PRIVATE', 'TEAM', 'GLOBAL'] })
  scope!: SavedViewScope;

  @ApiProperty({
    description: 'scope=TEAM 일 때 필수. 본인 팀과 일치해야 함.',
    required: false,
    nullable: true,
    type: 'string',
    format: 'uuid',
  })
  teamId?: string | null;
}

export const CreateSavedViewValidationPipe = new ZodValidationPipe(createSavedViewSchema);
