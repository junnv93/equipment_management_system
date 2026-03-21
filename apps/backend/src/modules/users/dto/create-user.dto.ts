import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  UserRoleEnum,
  SiteEnum,
  LocationEnum,
  type UserRole,
  type Site,
  VM,
  type Location,
  optionalUuid,
} from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

/**
 * 사용자 생성 스키마 (Zod)
 *
 * Best Practice: class-validator 대신 Zod를 사용하여 검증과 타입 정의를 통합합니다.
 */
export const createUserSchema = z.object({
  id: optionalUuid(),
  email: z.string().email({ message: VM.email.invalid }),
  name: z
    .string({ message: VM.string.nonempty('이름') })
    .min(1, { message: VM.user.name.required })
    .max(100, { message: VM.string.max('이름', 100) }),
  role: UserRoleEnum,
  site: SiteEnum.optional(),
  location: LocationEnum.optional(),
  teamId: optionalUuid(), // UUID 형식 + HTML 폼 빈 문자열 안전
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
    enum: UserRoleEnum.options,
    example: 'test_engineer',
  })
  role: UserRole;

  @ApiPropertyOptional({
    description: '사이트 정보',
    enum: SiteEnum.options,
    example: 'suwon',
  })
  site?: Site;

  @ApiPropertyOptional({
    description: '위치 정보',
    enum: LocationEnum.options,
    example: '수원랩',
  })
  location?: Location;

  @ApiPropertyOptional({
    description: '소속 팀 ID (UUID)',
    example: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1',
  })
  teamId?: string;

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
