import { IsString, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveCalibrationDto {
  @ApiProperty({
    description: '승인자 ID (기술책임자)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID('4')
  @IsNotEmpty()
  approverId: string;

  @ApiProperty({
    description: '승인자 코멘트 (기술책임자 승인 시 필수)',
    example: '교정 결과 확인 완료',
  })
  @IsString()
  @IsNotEmpty({ message: '승인 시 승인자 코멘트는 필수입니다.' })
  approverComment: string;
}

export class RejectCalibrationDto {
  @ApiProperty({
    description: '승인자 ID (기술책임자)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID('4')
  @IsNotEmpty()
  approverId: string;

  @ApiProperty({
    description: '반려 사유',
    example: '교정 성적서 첨부가 누락되었습니다.',
  })
  @IsString()
  @IsNotEmpty({ message: '반려 사유는 필수입니다.' })
  rejectionReason: string;
}
