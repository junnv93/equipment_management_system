import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ReturnConditionEnum {
  GOOD = 'good',
  DAMAGED = 'damaged',
  LOST = 'lost',
}

export class ReturnRequestDto {
  @ApiProperty({
    description: '장비 반납 상태 (양호함, 손상됨, 분실)',
    enum: ReturnConditionEnum,
    example: ReturnConditionEnum.GOOD,
  })
  @IsEnum(ReturnConditionEnum)
  returnCondition: ReturnConditionEnum;

  @ApiProperty({
    description: '반납 시 특이사항',
    example: '약간의 긁힘이 있으나 작동에는 문제 없음',
    required: false,
  })
  @IsString()
  @IsOptional()
  returnNotes?: string;
}
