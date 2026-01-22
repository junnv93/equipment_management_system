import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRoleEnum, TeamEnum, SiteEnum } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

/**
 * 사용자 생성 스키마 (Zod)
 *
 * Best Practice: class-validator 대신 Zod를 사용하여 검증과 타입 정의를 통합합니다.
 */
export const createUserSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요.' }),
  name: z
    .string({ message: '이름은 필수입니다.' })
    .min(1, { message: '이름을 입력해주세요.' })
    .max(100, { message: '이름은 100자 이내로 입력해주세요.' }),
  role: UserRoleEnum,
  site: SiteEnum.optional(),
  location: z.enum(['수원랩', '의왕랩']).optional(),
  teamId: TeamEnum.optional(),
  department: z.string().max(100).optional(),
  position: z.string().max(100).optional(),
  phoneNumber: z.string().max(20).optional(),
  isActive: z.boolean().optional().default(true),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * 사용자 생성 DTO
 *
 * Swagger 문서화를 위한 클래스 정의입니다.
 */
export class CreateUserDto {
  @ApiPropertyOptional({
    description: '사용자 ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id?: string;

  @ApiProperty({
    description: '이메일 주소',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: '사용자 이름',
    example: '홍길동',
  })
  name: string;

  @ApiProperty({
    description: '사용자 역할',
    enum: ['test_engineer', 'technical_manager', 'lab_manager'],
    example: 'test_engineer',
  })
  role: 'test_engineer' | 'technical_manager' | 'lab_manager';

  @ApiPropertyOptional({
    description: '사이트 정보',
    enum: ['suwon', 'uiwang'],
    example: 'suwon',
  })
  site?: 'suwon' | 'uiwang';

  @ApiPropertyOptional({
    description: '위치 정보',
    enum: ['수원랩', '의왕랩'],
    example: '수원랩',
  })
  location?: '수원랩' | '의왕랩';

  @ApiPropertyOptional({
    description: '소속 팀 ID',
    enum: ['rf', 'sar', 'emc', 'auto'],
    example: 'rf',
  })
  teamId?: 'rf' | 'sar' | 'emc' | 'auto';

  @ApiPropertyOptional({
    description: '부서명',
    example: '개발팀',
  })
  department?: string;

  @ApiPropertyOptional({
    description: '직위/직책',
    example: '선임연구원',
  })
  position?: string;

  @ApiPropertyOptional({
    description: '전화번호',
    example: '010-1234-5678',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: '활성 상태',
    default: true,
    example: true,
  })
  isActive?: boolean;
}

// Zod 검증 파이프 생성
export const CreateUserValidationPipe = new ZodValidationPipe(createUserSchema);
