import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';

// CAS(Optimistic Locking) version 필드 포함
const approveEquipmentRequestLocalSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(),
  ...versionedSchema,
});

export class ApproveEquipmentRequestLocalDto extends createZodDto(
  approveEquipmentRequestLocalSchema
) {}

// Zod 검증 파이프 생성
export const ApproveEquipmentRequestValidationPipe = new ZodValidationPipe(
  approveEquipmentRequestLocalSchema
);
