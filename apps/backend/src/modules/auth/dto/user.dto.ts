import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../rbac/roles.enum';

/**
 * UserRole Zod 스키마
 */
export const userRoleSchema = z.enum([
  UserRole.TEST_ENGINEER,
  UserRole.TECHNICAL_MANAGER,
  UserRole.LAB_MANAGER,
]);

/**
 * 사용자 정보 스키마 (Zod)
 */
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  roles: z.array(userRoleSchema),
  department: z.string().optional(),
  employeeId: z.string().optional(),
});

export type UserInput = z.infer<typeof userSchema>;

/**
 * 사용자 DTO
 *
 * 사용자 정보를 표현하는 DTO입니다.
 * 인증 응답에서 사용됩니다.
 */
export class UserDto implements UserInput {
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
    enum: UserRole,
    isArray: true,
    example: [UserRole.LAB_MANAGER],
  })
  roles: UserRole[];

  @ApiPropertyOptional({
    description: '부서명',
    example: 'RF팀',
  })
  department?: string;

  @ApiPropertyOptional({
    description: '직원 ID',
    example: 'EMP001',
  })
  employeeId?: string;
}
