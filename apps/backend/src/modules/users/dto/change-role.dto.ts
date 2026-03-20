import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { UserRoleEnum, VM } from '@equipment-management/schemas';

/**
 * 역할 변경 스키마 (Zod)
 *
 * Conditional WHERE 기반 경량 CAS:
 * - currentRole: 클라이언트가 본 현재 역할 (CAS 키)
 * - newRole: 변경할 역할
 * - reason: 변경 사유 (선택)
 *
 * 변경 가능 역할: test_engineer ↔ technical_manager만 허용
 * (quality_manager, lab_manager는 변경 불가)
 */
const CHANGEABLE_ROLES = UserRoleEnum.options.filter(
  (r): r is 'test_engineer' | 'technical_manager' =>
    r === 'test_engineer' || r === 'technical_manager'
) as [string, ...string[]];

export const changeRoleSchema = z.object({
  newRole: z.enum(CHANGEABLE_ROLES as ['test_engineer', 'technical_manager'], {
    message: VM.user.role.invalid,
  }),
  currentRole: z.enum(CHANGEABLE_ROLES as ['test_engineer', 'technical_manager'], {
    message: VM.user.currentRole.invalid,
  }),
  reason: z.string().min(1).max(500).optional(),
});

export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;

/**
 * 역할 변경 DTO (Swagger 문서화)
 */
export class ChangeRoleDto {
  @ApiProperty({
    description: '변경할 역할',
    enum: ['test_engineer', 'technical_manager'],
    example: 'technical_manager',
  })
  newRole: 'test_engineer' | 'technical_manager';

  @ApiProperty({
    description: '현재 역할 (CAS 키 - 동시 수정 방어)',
    enum: ['test_engineer', 'technical_manager'],
    example: 'test_engineer',
  })
  currentRole: 'test_engineer' | 'technical_manager';

  @ApiPropertyOptional({
    description: '역할 변경 사유',
    example: '기술 역량 인정에 따른 승격',
    maxLength: 500,
  })
  reason?: string;
}

// Zod 검증 파이프
export const ChangeRoleValidationPipe = new ZodValidationPipe(changeRoleSchema);
