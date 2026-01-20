import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ApproveCalibrationPlanDto {
  @ApiProperty({
    description: '승인자 ID (시험소장)',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsNotEmpty()
  @IsString()
  approvedBy: string;
}

export class RejectCalibrationPlanDto {
  @ApiProperty({
    description: '승인자 ID (시험소장)',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsNotEmpty()
  @IsString()
  rejectedBy: string;

  @ApiProperty({
    description: '반려 사유 (필수)',
    example: '교정 예정일 재검토 필요',
  })
  @IsNotEmpty()
  @IsString()
  rejectionReason: string;
}

export class SubmitCalibrationPlanDto {
  @ApiPropertyOptional({
    description: '제출 메모',
  })
  @IsOptional()
  @IsString()
  memo?: string;
}

export class ConfirmPlanItemDto {
  @ApiProperty({
    description: '확인자 ID (기술책임자)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsNotEmpty()
  @IsString()
  confirmedBy: string;
}
