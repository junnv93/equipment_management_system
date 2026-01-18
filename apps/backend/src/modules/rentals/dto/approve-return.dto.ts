import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum ReturnApprovalStatusEnum {
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class ApproveReturnDto {
  @ApiProperty({
    description: '반납 승인 상태',
    enum: ReturnApprovalStatusEnum,
    example: ReturnApprovalStatusEnum.APPROVED,
  })
  @IsEnum(ReturnApprovalStatusEnum)
  status: ReturnApprovalStatusEnum;

  @ApiProperty({
    description: '반납 승인/거절 메모',
    example: '장비 상태 확인 완료',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: '승인자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  @IsString()
  approverId: string;
}
