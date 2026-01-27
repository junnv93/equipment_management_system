import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { createUserSchema } from './create-user.dto';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

/**
 * 사용자 수정 스키마 (Zod)
 *
 * CreateUserSchema를 기반으로 모든 필드를 선택적으로 만듭니다.
 */
export const updateUserSchema = createUserSchema.partial();

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * 사용자 수정 DTO
 *
 * Swagger 문서화를 위한 클래스 정의입니다.
 * 모든 필드가 선택적입니다.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({
    description: '이메일 주소',
    example: 'user@example.com',
  })
  email?: string;

  @ApiPropertyOptional({
    description: '사용자 이름',
    example: '홍길동',
  })
  name?: string;

  @ApiPropertyOptional({
    description: '사용자 역할',
    enum: ['test_engineer', 'technical_manager', 'lab_manager'],
    example: 'test_engineer',
  })
  role?: 'test_engineer' | 'technical_manager' | 'lab_manager';

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
    example: true,
  })
  isActive?: boolean;
}

// Zod 검증 파이프 생성
export const UpdateUserValidationPipe = new ZodValidationPipe(updateUserSchema);
