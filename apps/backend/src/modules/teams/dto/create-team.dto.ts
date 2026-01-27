import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { SiteEnum, Site } from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

// 팀 타입 열거형 (분류코드와 매핑)
// RF→E, EMC→R, SAR→S, AUTO→A, SOFTWARE→P
export const TeamTypeEnum = z.enum(['RF', 'SAR', 'EMC', 'AUTO', 'SOFTWARE']);
export type TeamType = z.infer<typeof TeamTypeEnum>;

// 분류코드 열거형
export const ClassificationCodeEnum = z.enum(['E', 'R', 'S', 'A', 'P']);
export type ClassificationCode = z.infer<typeof ClassificationCodeEnum>;

/**
 * 팀 생성 스키마
 * ✅ Best Practice: 팀은 반드시 하나의 사이트에 소속됨
 * ✅ 팀이 장비 분류코드를 결정 (classificationCode)
 */
export const createTeamSchema = z.object({
  name: z.string().min(1, '팀 이름을 입력해주세요').max(100),
  type: TeamTypeEnum,
  site: SiteEnum, // ✅ 필수: 팀 소속 사이트
  classificationCode: ClassificationCodeEnum.optional(), // 분류코드 (E, R, S, A, P)
  description: z.string().max(500).optional(),
  leaderId: z.string().uuid().optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export const CreateTeamValidationPipe = new ZodValidationPipe(createTeamSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class CreateTeamDto {
  @ApiProperty({
    description: '팀 이름',
    example: 'RF 테스트팀',
  })
  name: string;

  @ApiProperty({
    description: '팀 타입 (분류코드 결정: RF→E, EMC→R, SAR→S, AUTO→A, SOFTWARE→P)',
    enum: ['RF', 'SAR', 'EMC', 'AUTO', 'SOFTWARE'],
    example: 'RF',
  })
  type: TeamType;

  @ApiProperty({
    description: '팀 소속 사이트',
    enum: ['suwon', 'uiwang', 'pyeongtaek'],
    example: 'suwon',
  })
  site: Site;

  @ApiPropertyOptional({
    description: '분류코드 (E, R, S, A, P)',
    enum: ['E', 'R', 'S', 'A', 'P'],
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
