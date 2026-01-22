import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Enum 정의 ==========

export enum ReturnConditionEnum {
  GOOD = 'good',
  DAMAGED = 'damaged',
  LOST = 'lost',
}

// ========== Zod 스키마 정의 ==========

/**
 * 반납 요청 스키마
 */
export const returnRequestSchema = z.object({
  returnCondition: z.nativeEnum(ReturnConditionEnum, {
    message: '유효한 반납 상태를 선택해주세요',
  }),
  returnNotes: z.string().optional(),
});

export type ReturnRequestInput = z.infer<typeof returnRequestSchema>;
export const ReturnRequestValidationPipe = new ZodValidationPipe(returnRequestSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class ReturnRequestDto {
  @ApiProperty({
    description: '장비 반납 상태 (양호함, 손상됨, 분실)',
    enum: ReturnConditionEnum,
    example: ReturnConditionEnum.GOOD,
  })
  returnCondition: ReturnConditionEnum;

  @ApiProperty({
    description: '반납 시 특이사항',
    example: '약간의 긁힘이 있으나 작동에는 문제 없음',
    required: false,
  })
  returnNotes?: string;
}
