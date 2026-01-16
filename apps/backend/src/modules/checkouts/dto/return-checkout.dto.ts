import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ReturnCheckoutDto {
  @ApiProperty({
    description: '교정 확인 여부',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  calibrationChecked?: boolean;

  @ApiProperty({
    description: '수리 확인 여부',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  repairChecked?: boolean;

  @ApiProperty({
    description: '작동 여부 확인',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  workingStatusChecked?: boolean;

  @ApiProperty({
    description: '검사 비고',
    example: '교정 완료, 정상 작동 확인',
    required: false,
  })
  @IsString()
  @IsOptional()
  inspectionNotes?: string;
}
