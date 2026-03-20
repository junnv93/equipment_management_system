import { ApiProperty } from '@nestjs/swagger';
import { type EquipmentStatus, EquipmentStatusEnum, VM } from '@equipment-management/schemas';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';

// ========== Zod 스키마 정의 ==========

/**
 * 장비 상태 업데이트 스키마
 *
 * ✅ Optimistic Locking: version 필드 필수
 * ✅ Phase 1: Equipment Module - 2026-02-11
 */
export const updateStatusSchema = z.object({
  ...versionedSchema, // ✅ Optimistic locking version
  status: EquipmentStatusEnum.describe(VM.enumInvalid('장비 상태')),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export const UpdateStatusValidationPipe = new ZodValidationPipe(updateStatusSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

/**
 * 장비 상태 업데이트 DTO
 *
 * ✅ Optimistic Locking: VersionedDto 상속으로 version 필드 자동 포함
 * ✅ Phase 1: Equipment Module - 2026-02-11
 * ✅ 참고: ApproveCheckoutDto와 동일한 패턴
 */
export class UpdateStatusDto extends VersionedDto {
  // ✅ version 필드는 VersionedDto에서 자동 상속

  @ApiProperty({
    description: '변경할 장비 상태',
    enum: EquipmentStatusEnum.options,
    example: 'available',
  })
  status!: EquipmentStatus;
}
