import { z } from 'zod';
import {
  ApprovalActionEnum,
  APPROVAL_ACTION_VALUES,
  DisposalReasonEnum,
  type ApprovalAction,
  VM,
} from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { ApiProperty } from '@nestjs/swagger';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ============================================================================
// Zod 스키마 (SSOT from @equipment-management/schemas)
// ============================================================================

/**
 * 폐기 요청 DTO 스키마
 */
export const requestDisposalSchema = z.object({
  reason: DisposalReasonEnum,
  reasonDetail: z
    .string()
    .trim()
    .min(
      VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH,
      VM.disposal.reason.min(VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH)
    )
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('폐기 사유 상세', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    ),
});

export type RequestDisposalInput = z.infer<typeof requestDisposalSchema>;
export const RequestDisposalPipe = new ZodValidationPipe(requestDisposalSchema);

/**
 * 폐기 검토 DTO 스키마 (technical_manager, 같은 팀)
 *
 * 검토 의견(opinion)은 frontend `DisposalReviewDialog`가 `>= REJECTION_REASON_MIN_LENGTH`로
 * 강제하므로 Zod도 동일 기준으로 defense-in-depth 적용 (frontend 우회 차단).
 */
export const reviewDisposalSchema = z.object({
  ...versionedSchema,
  decision: ApprovalActionEnum,
  opinion: z
    .string()
    .trim()
    .min(
      VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH,
      VM.string.min('검토 의견', VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH)
    )
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('검토 의견', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    ),
});

export type ReviewDisposalInput = z.infer<typeof reviewDisposalSchema>;
export const ReviewDisposalPipe = new ZodValidationPipe(reviewDisposalSchema);

/**
 * 폐기 승인 DTO 스키마 (lab_manager)
 *
 * 코멘트(comment)는 승인 시 선택, 반려 시 frontend가 `>= REJECTION_REASON_MIN_LENGTH`로 강제.
 * Zod에서는 `.trim().max()` defense-in-depth만 적용하고 반려 시 min은 service layer fail-close에 위임.
 */
export const approveDisposalSchema = z.object({
  ...versionedSchema,
  decision: ApprovalActionEnum,
  comment: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('승인 코멘트', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional(),
});

export type ApproveDisposalInput = z.infer<typeof approveDisposalSchema>;
export const ApproveDisposalPipe = new ZodValidationPipe(approveDisposalSchema);

// ============================================================================
// NestJS DTO 클래스 (Swagger 문서 생성용)
// ============================================================================

/**
 * 폐기 요청 DTO
 */
export class RequestDisposalDto implements RequestDisposalInput {
  @ApiProperty({
    description: '폐기 사유',
    enum: ['obsolete', 'broken', 'inaccurate', 'other'],
    example: 'obsolete',
  })
  reason!: 'obsolete' | 'broken' | 'inaccurate' | 'other';

  @ApiProperty({
    description: '폐기 사유 상세 (10자 이상, 500자 이하)',
    example: '장비가 노후화되어 더 이상 사용할 수 없습니다.',
    minLength: VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH,
    maxLength: VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
  })
  reasonDetail!: string;
}

/**
 * 폐기 검토 DTO
 */
export class ReviewDisposalDto
  extends VersionedDto
  implements Omit<ReviewDisposalInput, 'version'>
{
  @ApiProperty({
    description: '검토 결과 (승인/반려)',
    enum: APPROVAL_ACTION_VALUES,
    example: 'approve',
  })
  decision!: ApprovalAction;

  @ApiProperty({
    description: '검토 의견 (10자 이상, 500자 이하)',
    example: '폐기 사유가 타당하여 승인 요청합니다.',
    minLength: VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH,
    maxLength: VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
  })
  opinion!: string;
}

/**
 * 폐기 승인 DTO
 */
export class ApproveDisposalDto
  extends VersionedDto
  implements Omit<ApproveDisposalInput, 'version'>
{
  @ApiProperty({
    description: '승인 결과 (승인/반려)',
    enum: APPROVAL_ACTION_VALUES,
    example: 'approve',
  })
  decision!: ApprovalAction;

  @ApiProperty({
    description: '승인 코멘트 (선택, 500자 이하). 반려 시 frontend에서 10자 이상 강제',
    example: '폐기 승인합니다.',
    required: false,
    maxLength: VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
  })
  comment?: string;
}
