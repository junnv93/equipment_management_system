import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  TeamTypeEnum,
  ClassificationCodeEnum,
  SiteEnum,
  type TeamType,
  type ClassificationCode,
  type Site,
} from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/**
 * 팀 생성 스키마
 * ✅ SSOT: enums are imported from @equipment-management/schemas
 * ✅ Best Practice: 팀은 반드시 하나의 사이트에 소속됨
 * ✅ 팀이 장비 분류코드를 결정 (classificationCode)
 */
export const createTeamSchema = z.object({
  name: z.string().min(1, '팀 이름을 입력해주세요').max(100),
  type: TeamTypeEnum,
  site: SiteEnum,
  classificationCode: ClassificationCodeEnum.optional(),
  description: z.string().max(500).optional(),
  leaderId: z.string().uuid().optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export const CreateTeamValidationPipe = new ZodValidationPipe(createTeamSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class CreateTeamDto {
  @ApiProperty({
    description: '팀 이름',
    example: 'FCC EMC/RF 테스트팀',
  })
  name: string;

  @ApiProperty({
    description: '팀 타입 (분류코드 결정)',
    enum: [
      'FCC_EMC_RF',
      'GENERAL_EMC',
      'GENERAL_RF',
      'SAR',
      'AUTOMOTIVE_EMC',
      'SOFTWARE',
      'RF',
      'EMC',
      'AUTO',
    ],
    example: 'FCC_EMC_RF',
  })
  type: TeamType;

  @ApiProperty({
    description: '팀 소속 사이트',
    enum: ['suwon', 'uiwang', 'pyeongtaek'],
    example: 'suwon',
  })
  site: Site;

  @ApiPropertyOptional({
    description: '분류코드 (E, R, W, S, A, P)',
    enum: ['E', 'R', 'W', 'S', 'A', 'P'],
    example: 'E',
  })
  classificationCode?: ClassificationCode;

  @ApiPropertyOptional({
    description: '팀 설명',
    example: 'FCC EMC/RF 시험 장비 관리 팀',
  })
  description?: string;

  @ApiPropertyOptional({
    description: '팀장 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  leaderId?: string;
}
