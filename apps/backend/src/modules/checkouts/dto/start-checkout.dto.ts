import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';
import { uuidString, VM } from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/**
 * 반출 시작 스키마 (장비별 반출 전 상태 기록)
 * version은 optimistic locking을 위해 필수
 */
export const startCheckoutSchema = z.object({
  ...versionedSchema, // ✅ Optimistic locking version
  itemConditions: z
    .array(
      z.object({
        equipmentId: uuidString(VM.uuid.invalid('장비')),
        conditionBefore: z.string().min(1),
      })
    )
    .optional(),
});

export type StartCheckoutInput = z.infer<typeof startCheckoutSchema>;
export const StartCheckoutValidationPipe = new ZodValidationPipe(startCheckoutSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class StartCheckoutDto extends VersionedDto {
  // ✅ version 필드는 VersionedDto에서 자동 상속

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
