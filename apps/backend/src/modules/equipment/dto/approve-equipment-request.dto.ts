import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';
import { ApprovalActionEnum, type ApprovalAction } from '@equipment-management/schemas';

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

/**
 * 장비 요청 승인/반려 DTO
 *
 * CAS(Optimistic Locking)를 위해 version 필드를 포함합니다.
 * equipment_requests 테이블의 version 컬럼과 대응합니다.
 *
 * @note 실제 승인/반려 엔드포인트는 approve-request-body.dto.ts + reject-request.dto.ts 사용.
 * 이 DTO는 requestId를 body에 포함하는 대체 설계용입니다.
 */
export class ApproveEquipmentRequestDto {
  @ApiProperty({
    description: '요청 UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  requestId: string;

  @ApiProperty({
    description: '승인 또는 반려',
    enum: ApprovalActionEnum.options,
    example: 'approve',
  })
  action: ApprovalAction;

  @ApiPropertyOptional({
    description: '반려 사유 (반려 시 필수)',
    example: '필수 정보가 누락되었습니다.',
  })
  rejectionReason?: string;

  @ApiProperty({
    description: 'CAS 버전 (동시 수정 방지)',
    example: 1,
  })
  version: number;
}

// Zod 검증 파이프 생성
export const ApproveEquipmentRequestValidationPipe = new ZodValidationPipe(
  approveEquipmentRequestLocalSchema
);
