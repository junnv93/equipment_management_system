import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsString } from 'class-validator';

export class RejectCheckoutDto {
  @ApiProperty({
    description: '승인자 UUID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID('4')
  @IsNotEmpty()
  approverId: string;

  @ApiProperty({
    description: '반려 사유 (필수)',
    example: '장비가 교정 예정으로 반출 불가',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
