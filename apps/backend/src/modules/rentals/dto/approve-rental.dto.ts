import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * 대여 승인 DTO
 * @description 대여 승인 시 전달되는 데이터
 */
export class ApproveRentalDto {
  @ApiProperty({
    description: '승인자 UUID (JWT에서 자동 설정, 선택적으로 직접 지정 가능)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  approverId?: string;

  @ApiProperty({
    description: '승인자 코멘트',
    example: '교정 일정에 맞춰 사용 바랍니다.',
    required: false,
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  comment?: string;
}
