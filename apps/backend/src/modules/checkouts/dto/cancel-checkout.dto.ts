import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';

// ========== Zod 스키마 정의 ==========

/**
 * 반출 취소 스키마
 * version은 optimistic locking을 위해 필수
 */
export const cancelCheckoutSchema = z.object({
  ...versionedSchema, // ✅ Optimistic locking version
});

export type CancelCheckoutInput = z.infer<typeof cancelCheckoutSchema>;
export const CancelCheckoutValidationPipe = new ZodValidationPipe(cancelCheckoutSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class CancelCheckoutDto extends VersionedDto {
  // ✅ version 필드는 VersionedDto에서 자동 상속
}
