import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';
import { uuidString, VM } from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/**
 * 반입 요청 스키마
 * version은 optimistic locking을 위해 필수
 */
export const returnCheckoutSchema = z.object({
  ...versionedSchema, // ✅ Optimistic locking version
  calibrationChecked: z.boolean().optional(),
  repairChecked: z.boolean().optional(),
  workingStatusChecked: z.boolean().optional(),
  inspectionNotes: z.string().optional(),
  itemConditions: z
    .array(
      z.object({
        equipmentId: uuidString(VM.uuid.invalid('장비')),
        conditionAfter: z.string().min(1),
      })
    )
    .optional(),
});

export type ReturnCheckoutInput = z.infer<typeof returnCheckoutSchema>;
export const ReturnCheckoutValidationPipe = new ZodValidationPipe(returnCheckoutSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class ReturnCheckoutDto extends VersionedDto {
  // ✅ version 필드는 VersionedDto에서 자동 상속

  @ApiProperty({
    description: '교정 확인 여부',
    example: true,
    required: false,
  })
  calibrationChecked?: boolean;

  @ApiProperty({
    description: '수리 확인 여부',
    example: false,
    required: false,
  })
  repairChecked?: boolean;

  @ApiProperty({
    description: '작동 여부 확인',
    example: true,
    required: false,
  })
  workingStatusChecked?: boolean;

  @ApiProperty({
    description: '검사 비고',
    example: '교정 완료, 정상 작동 확인',
    required: false,
  })
  inspectionNotes?: string;

  @ApiProperty({
    description: '장비별 반입 후 상태 기록',
    example: [
      {
        equipmentId: '550e8400-e29b-41d4-a716-446655440000',
        conditionAfter: '외관 양호, 정상 작동 확인',
      },
    ],
    required: false,
    type: 'array',
  })
  itemConditions?: Array<{
    equipmentId: string;
    conditionAfter: string;
  }>;
}
