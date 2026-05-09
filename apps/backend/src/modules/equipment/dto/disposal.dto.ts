import { z } from 'zod';
import {
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
 * discriminatedUnion으로 decision 분기:
 * - decision='approve': opinion 선택 (max만 적용)
 * - decision='reject':  opinion 필수, min(REJECTION_REASON_MIN_LENGTH) + max (Zod defense-in-depth)
 *
 * frontend 우회(curl 등) 시에도 의미 없는 반려 사유가 audit log에 기록되지 않도록 차단.
 */
export const reviewDisposalSchema = z.discriminatedUnion('decision', [
  z.object({
    ...versionedSchema,
    decision: z.literal('approve'),
    opinion: z
      .string()
      .trim()
      .max(
        VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
        VM.string.max('검토 의견', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
      )
      .optional(),
  }),
  z.object({
    ...versionedSchema,
    decision: z.literal('reject'),
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
  }),
]);

export type ReviewDisposalInput = z.infer<typeof reviewDisposalSchema>;
export const ReviewDisposalPipe = new ZodValidationPipe(reviewDisposalSchema);

/**
 * 폐기 승인 DTO 스키마 (lab_manager)
 *
 * discriminatedUnion으로 decision 분기:
 * - decision='approve': comment 선택 (max만 적용)
 * - decision='reject':  comment 필수, min(REJECTION_REASON_MIN_LENGTH) + max (Zod defense-in-depth)
 *
 * frontend 우회(curl 등) 시에도 의미있는 사유 없이 audit log에 기록되지 않도록 차단.
 */
export const approveDisposalSchema = z.discriminatedUnion('decision', [
  z.object({
    ...versionedSchema,
    decision: z.literal('approve'),
    comment: z
      .string()
      .trim()
      .max(
        VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
        VM.string.max('승인 코멘트', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
      )
      .optional(),
  }),
  z.object({
    ...versionedSchema,
    decision: z.literal('reject'),
    comment: z
      .string()
      .trim()
      .min(
        VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH,
        VM.string.min('반려 코멘트', VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH)
      )
      .max(
        VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
        VM.string.max('반려 코멘트', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
      ),
  }),
]);

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
 * 폐기 검토 DTO (Swagger 문서화용)
 * 런타임 검증은 reviewDisposalSchema(discriminatedUnion)가 담당.
 * - decision='approve': opinion 선택 (max 500자)
 * - decision='reject':  opinion 필수 (min 10자, max 500자)
 */
export class ReviewDisposalDto extends VersionedDto {
  @ApiProperty({
    description: '검토 결과 (승인/반려)',
    enum: APPROVAL_ACTION_VALUES,
    example: 'approve',
  })
  decision!: ApprovalAction;

  @ApiProperty({
    description:
      '검토 의견. 승인 시 선택(max 500자), 반려 시 필수(min 10자, max 500자). discriminatedUnion으로 Zod 검증.',
    example: '폐기 사유가 타당하여 승인 요청합니다.',
    required: false,
    maxLength: VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
  })
  opinion?: string;
}

/**
 * 폐기 승인 DTO (Swagger 문서화용)
 * 런타임 검증은 approveDisposalSchema(discriminatedUnion)가 담당.
 */
export class ApproveDisposalDto extends VersionedDto {
  @ApiProperty({
    description: '승인 결과 (승인/반려)',
    enum: APPROVAL_ACTION_VALUES,
    example: 'approve',
  })
  decision!: ApprovalAction;

  @ApiProperty({
    description:
      '승인 시 선택(max 500자), 반려 시 필수(min 10자, max 500자). discriminatedUnion으로 Zod 검증.',
    example: '폐기 승인합니다.',
    required: false,
    maxLength: VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
  })
  comment?: string;
}
