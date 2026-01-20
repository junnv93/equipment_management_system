import { IsString, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveSoftwareChangeDto {
  @ApiProperty({
    description: '승인자 ID (기술책임자)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID('4')
  @IsNotEmpty()
  approverId: string;

  @ApiProperty({
    description: '승인자 코멘트',
    example: '소프트웨어 변경 및 검증 기록 확인 완료',
  })
  @IsString()
  @IsNotEmpty({ message: '승인 시 승인자 코멘트는 필수입니다.' })
  approverComment: string;
}

export class RejectSoftwareChangeDto {
  @ApiProperty({
    description: '승인자 ID (기술책임자)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID('4')
  @IsNotEmpty()
  approverId: string;

  @ApiProperty({
    description: '반려 사유',
    example: '검증 기록이 불충분합니다. 추가 테스트 결과를 포함해주세요.',
  })
  @IsString()
  @IsNotEmpty({ message: '반려 사유는 필수입니다.' })
  rejectionReason: string;
}
