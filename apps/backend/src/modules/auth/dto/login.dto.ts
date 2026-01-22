import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

/**
 * 로그인 스키마 (Zod)
 *
 * Best Practice: class-validator 대신 Zod를 사용하여 검증과 타입 정의를 통합합니다.
 * 이를 통해 Single Source of Truth를 유지할 수 있습니다.
 */
export const loginSchema = z.object({
  email: z
    .string({ message: '이메일은 필수입니다.' })
    .email({ message: '유효한 이메일 주소를 입력해주세요.' }),
  password: z
    .string({ message: '비밀번호는 필수입니다.' })
    .min(1, { message: '비밀번호를 입력해주세요.' }),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * 로그인 DTO
 *
 * Swagger 문서화를 위한 클래스 정의입니다.
 * 실제 검증은 Zod 스키마를 통해 수행됩니다.
 */
export class LoginDto implements LoginInput {
  @ApiProperty({
    description: '이메일 주소',
    example: 'admin@example.com',
  })
  email: string;

  @ApiProperty({
    description: '비밀번호',
    example: 'admin123',
  })
  password: string;
}

// Zod 검증 파이프 생성
export const LoginValidationPipe = new ZodValidationPipe(loginSchema);
