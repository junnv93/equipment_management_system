import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { VM } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';

// ========== Zod 스키마 정의 ==========

/**
 * 교정 승인 스키마
 * ✅ 보안: approverId는 서버에서 JWT로 추출 (클라이언트 전송 불필요)
 * ✅ approverComment는 선택사항 — 코멘트 없이 바로 승인 가능
 */
export const approveCalibrationSchema = z.object({
  ...versionedSchema,
  approverComment: z.string().optional(),
});

export type ApproveCalibrationInput = z.infer<typeof approveCalibrationSchema>;
export const ApproveCalibrationValidationPipe = new ZodValidationPipe(approveCalibrationSchema);

/**
 * 교정 반려 스키마
 * ✅ 보안: approverId는 서버에서 JWT로 추출 (클라이언트 전송 불필요)
 */
export const rejectCalibrationSchema = z.object({
  ...versionedSchema,
  rejectionReason: z.string().min(1, VM.approval.rejectReason.required),
});

export type RejectCalibrationInput = z.infer<typeof rejectCalibrationSchema>;
export const RejectCalibrationValidationPipe = new ZodValidationPipe(rejectCalibrationSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class ApproveCalibrationDto extends VersionedDto {
  @ApiProperty({
    description: '승인자 코멘트 (선택사항)',
    example: '교정 결과 확인 완료',
    required: false,
  })
  approverComment?: string;

  // approverId는 서버에서 주입 (컨트롤러에서 req.user.userId 사용)
  approverId?: string;
}

export class RejectCalibrationDto extends VersionedDto {
  @ApiProperty({
    description: '반려 사유',
    example: '교정 성적서 첨부가 누락되었습니다.',
  })
  rejectionReason: string;

  // approverId는 서버에서 주입 (컨트롤러에서 req.user.userId 사용)
  approverId?: string;
}
