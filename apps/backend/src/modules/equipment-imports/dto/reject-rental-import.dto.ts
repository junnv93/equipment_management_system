import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

export const rejectRentalImportSchema = z.object({
  rejectionReason: z.string().min(1, '거절 사유를 입력해주세요'),
});

export type RejectRentalImportInput = z.infer<typeof rejectRentalImportSchema>;
export const RejectRentalImportValidationPipe = new ZodValidationPipe(rejectRentalImportSchema);

export class RejectRentalImportDto {
  @ApiProperty({ description: '거절 사유', example: '예산 초과로 반입 불가' })
  rejectionReason: string;
}
