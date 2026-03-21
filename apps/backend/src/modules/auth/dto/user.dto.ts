import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRoleEnum, USER_ROLE_VALUES, type UserRole } from '../rbac/roles.enum';
import { SITE_VALUES, LOCATION_VALUES } from '@equipment-management/schemas';

/**
 * UserRole Zod 스키마
 */
export const userRoleSchema = UserRoleEnum;

/**
 * 인증 응답 사용자 정보 스키마 (Zod)
 *
 * AuthResponse.user의 구조를 정의합니다.
 * User(schemas)의 단일 role → roles 배열 변환 후 형태.
 */
export const authResponseUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  roles: z.array(userRoleSchema),
  department: z.string().optional(),
  site: z.enum(SITE_VALUES as unknown as [string, ...string[]]).optional(),
  location: z.enum(LOCATION_VALUES as unknown as [string, ...string[]]).optional(),
  position: z.string().optional(),
  teamId: z.string().uuid().optional(),
});

export type AuthResponseUserInput = z.infer<typeof authResponseUserSchema>;

/**
 * 인증 응답 사용자 DTO (Swagger 문서화)
 *
 * AuthResponse.user 필드의 구조를 문서화합니다.
 * auth.service.ts의 UserDto 인터페이스와 동일한 구조를 유지합니다.
 */
export class AuthResponseUserDto implements AuthResponseUserInput {
  @ApiProperty({
    description: '사용자 ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  id: string;

  @ApiProperty({
    description: '이메일 주소',
    example: 'admin@example.com',
  })
  email: string;

  @ApiProperty({
    description: '사용자 이름',
    example: '관리자',
  })
  name: string;

  @ApiProperty({
    description: '사용자 역할 목록',
    enum: USER_ROLE_VALUES,
    isArray: true,
    example: ['lab_manager'],
  })
  roles: UserRole[];

  @ApiPropertyOptional({
    description: '부서명',
    example: 'RF팀',
  })
  department?: string;

  @ApiPropertyOptional({
    description: '사이트',
    enum: SITE_VALUES,
    example: 'suwon',
  })
  site?: string;

  @ApiPropertyOptional({
    description: '위치',
    enum: LOCATION_VALUES,
    example: '수원랩',
  })
  location?: string;

  @ApiPropertyOptional({
    description: '직책',
    example: '선임연구원',
  })
  position?: string;

  @ApiPropertyOptional({
    description: '팀 ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  teamId?: string;
}
