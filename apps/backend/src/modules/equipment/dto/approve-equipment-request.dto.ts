import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { approveEquipmentRequestSchema } from '@equipment-management/schemas';

/**
 * 장비 요청 승인/반려 DTO
 */
export class ApproveEquipmentRequestDto {
  @ApiProperty({
    description: '요청 UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  requestId: string;

  @ApiProperty({
    description: '승인 또는 반려',
    enum: ['approve', 'reject'],
    example: 'approve',
  })
  action: 'approve' | 'reject';

  @ApiPropertyOptional({
    description: '반려 사유 (반려 시 필수)',
    example: '필수 정보가 누락되었습니다.',
  })
  rejectionReason?: string;
}

// Zod 검증 파이프 생성
export const ApproveEquipmentRequestValidationPipe = new ZodValidationPipe(
  approveEquipmentRequestSchema
);
