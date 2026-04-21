import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';

/**
 * 장비 요청 승인 Body DTO
 *
 * CAS(Optimistic Locking)를 위해 version 필드를 포함합니다.
 * equipment_requests 테이블의 version 컬럼과 대응합니다.
 */
export const approveRequestBodySchema = z.object({
  ...versionedSchema,
});

export class ApproveRequestBodyDto extends createZodDto(approveRequestBodySchema) {}
export const ApproveRequestBodyPipe = new ZodValidationPipe(approveRequestBodySchema);
