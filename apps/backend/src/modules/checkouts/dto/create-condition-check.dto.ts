import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  CONDITION_CHECK_STEP_VALUES,
  CONDITION_STATUS_VALUES,
  ACCESSORIES_STATUS_VALUES,
} from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/**
 * 상태 확인 등록 스키마
 */
export const createConditionCheckSchema = z.object({
  step: z.enum([...CONDITION_CHECK_STEP_VALUES] as [string, ...string[]], {
    message: '유효하지 않은 상태 확인 단계입니다.',
  }),
  appearanceStatus: z.enum([...CONDITION_STATUS_VALUES] as [string, ...string[]], {
    message: '유효하지 않은 외관 상태입니다.',
  }),
  operationStatus: z.enum([...CONDITION_STATUS_VALUES] as [string, ...string[]], {
    message: '유효하지 않은 작동 상태입니다.',
  }),
  accessoriesStatus: z.enum([...ACCESSORIES_STATUS_VALUES] as [string, ...string[]]).optional(),
  abnormalDetails: z.string().optional(),
  comparisonWithPrevious: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateConditionCheckInput = z.infer<typeof createConditionCheckSchema>;
export const CreateConditionCheckValidationPipe = new ZodValidationPipe(createConditionCheckSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class CreateConditionCheckDto {
  @ApiProperty({
    description: '상태 확인 단계',
    enum: CONDITION_CHECK_STEP_VALUES,
    example: 'lender_checkout',
  })
  step: string;

  @ApiProperty({
    description: '외관 상태',
    enum: CONDITION_STATUS_VALUES,
    example: 'normal',
  })
  appearanceStatus: string;

  @ApiProperty({
    description: '작동 상태',
    enum: CONDITION_STATUS_VALUES,
    example: 'normal',
  })
  operationStatus: string;

  @ApiProperty({
    description: '부속품 상태',
    enum: ACCESSORIES_STATUS_VALUES,
    example: 'complete',
    required: false,
  })
  accessoriesStatus?: string;

  @ApiProperty({
    description: '이상 시 상세 내용',
    example: '외관에 미세 스크래치 발견',
    required: false,
  })
  abnormalDetails?: string;

  @ApiProperty({
    description: '이전 단계와 비교 내용',
    example: '반출 시 대비 외관 상태 동일',
    required: false,
  })
  comparisonWithPrevious?: string;

  @ApiProperty({
    description: '비고',
    example: '부속품 전수 확인 완료',
    required: false,
  })
  notes?: string;
}
