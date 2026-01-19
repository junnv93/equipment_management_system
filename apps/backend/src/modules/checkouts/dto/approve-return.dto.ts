import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ApproveReturnDto {
  @ApiProperty({
    description: '승인자 UUID (기술책임자)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  approverId: string;

  @ApiProperty({
    description: '승인 코멘트',
    example: '검사 완료 확인, 정상 작동함',
    required: false,
  })
  @IsString()
  @IsOptional()
  comment?: string;
}
