import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';
import { uuidString, VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';

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
  inspectionNotes: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('검사 비고', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional(),
  calibrationCertificateExceptionReason: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('교정성적서 예외 사유', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional(),
  itemConditions: z
    .array(
      z.object({
        equipmentId: uuidString(VM.uuid.invalid('장비')),
        conditionAfter: z
          .string()
          .trim()
          .min(1, VM.required('상태 기록'))
          .max(
            VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH,
            VM.string.max('상태 기록', VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH)
          ),
      })
    )
    .optional(),
});

export type ReturnCheckoutInput = z.infer<typeof returnCheckoutSchema>;
export const ReturnCheckoutValidationPipe = new ZodValidationPipe(returnCheckoutSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class ReturnCheckoutDto extends createZodDto(returnCheckoutSchema) {}
