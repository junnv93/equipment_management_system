import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateCalibrationPlanDto {
  @ApiPropertyOptional({
    description: '팀 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  teamId?: string;
}

export class UpdateCalibrationPlanItemDto {
  @ApiPropertyOptional({
    description: '계획된 교정기관',
    example: 'KATS',
  })
  @IsOptional()
  plannedCalibrationAgency?: string;

  @ApiPropertyOptional({
    description: '추가 비고',
  })
  @IsOptional()
  notes?: string;
}
