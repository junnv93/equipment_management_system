import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 정의 ==========

/**
 * 반출 시작 스키마 (장비별 반출 전 상태 기록)
 */
export const startCheckoutSchema = z.object({
  itemConditions: z
    .array(
      z.object({
        equipmentId: z.string().uuid(),
        conditionBefore: z.string().min(1),
      })
    )
    .optional(),
});

export type StartCheckoutInput = z.infer<typeof startCheckoutSchema>;
export const StartCheckoutValidationPipe = new ZodValidationPipe(startCheckoutSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class StartCheckoutDto {
  @ApiProperty({
    description: '장비별 반출 전 상태 기록',
    example: [
      {
        equipmentId: '550e8400-e29b-41d4-a716-446655440000',
        conditionBefore: '외관 양호, 정상 작동',
      },
    ],
    required: false,
    type: 'array',
  })
  itemConditions?: Array<{
    equipmentId: string;
    conditionBefore: string;
  }>;
}
