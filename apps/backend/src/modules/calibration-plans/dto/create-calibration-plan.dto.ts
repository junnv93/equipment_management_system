import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, IsString, IsOptional, IsUUID, Min, Max } from 'class-validator';

export class CreateCalibrationPlanDto {
  @ApiProperty({
    description: '계획 연도',
    example: 2026,
    minimum: 2020,
    maximum: 2100,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;

  @ApiProperty({
    description: '시험소 ID',
    example: 'suwon',
    enum: ['suwon', 'uiwang'],
  })
  @IsNotEmpty()
  @IsString()
  siteId: string;

  @ApiPropertyOptional({
    description: '팀 ID (선택)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiProperty({
    description: '작성자 ID (기술책임자)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsNotEmpty()
  @IsString()
  createdBy: string;
}
