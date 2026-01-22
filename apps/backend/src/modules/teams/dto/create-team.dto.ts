import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { TeamEnum, TeamId } from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/**
 * 팀 생성 스키마
 */
export const createTeamSchema = z.object({
  id: TeamEnum,
  name: z.string().min(1, '팀 이름을 입력해주세요').max(100),
  description: z.string().max(500).optional(),
  leaderId: z.string().uuid().optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export const CreateTeamValidationPipe = new ZodValidationPipe(createTeamSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class CreateTeamDto {
  @ApiProperty({
    description: '팀 ID',
    enum: TeamEnum.enum,
    example: 'rf',
  })
  id: TeamId;

  @ApiProperty({
    description: '팀 이름',
    example: 'RF 테스트팀',
  })
  name: string;

  @ApiProperty({
    description: '팀 설명',
    required: false,
    example: 'RF 관련 장비 관리 및 테스트를 담당하는 팀입니다.',
  })
  description?: string;

  @ApiProperty({
    description: '팀장 ID',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  leaderId?: string;
}
