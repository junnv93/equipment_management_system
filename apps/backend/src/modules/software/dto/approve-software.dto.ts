import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 정의 ==========

/**
 * 소프트웨어 변경 승인 스키마
 */
export const approveSoftwareChangeSchema = z.object({
  approverId: z.string().uuid({ message: '유효한 승인자 UUID가 아닙니다' }),
  approverComment: z.string().min(1, '승인 시 승인자 코멘트는 필수입니다'),
});

export type ApproveSoftwareChangeInput = z.infer<typeof approveSoftwareChangeSchema>;
export const ApproveSoftwareChangeValidationPipe = new ZodValidationPipe(
  approveSoftwareChangeSchema
);

/**
 * 소프트웨어 변경 반려 스키마
 */
export const rejectSoftwareChangeSchema = z.object({
  approverId: z.string().uuid({ message: '유효한 승인자 UUID가 아닙니다' }),
  rejectionReason: z.string().min(1, '반려 사유는 필수입니다'),
});

export type RejectSoftwareChangeInput = z.infer<typeof rejectSoftwareChangeSchema>;
export const RejectSoftwareChangeValidationPipe = new ZodValidationPipe(rejectSoftwareChangeSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class ApproveSoftwareChangeDto {
  @ApiProperty({
    description: '승인자 ID (기술책임자)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  approverId: string;

  @ApiProperty({
    description: '승인자 코멘트',
    example: '소프트웨어 변경 및 검증 기록 확인 완료',
  })
  approverComment: string;
}

export class RejectSoftwareChangeDto {
  @ApiProperty({
    description: '승인자 ID (기술책임자)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  approverId: string;

  @ApiProperty({
    description: '반려 사유',
    example: '검증 기록이 불충분합니다. 추가 테스트 결과를 포함해주세요.',
  })
  rejectionReason: string;
}
