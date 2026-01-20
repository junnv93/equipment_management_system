import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsDateString, IsOptional } from 'class-validator';

export class CreateNonConformanceDto {
  @ApiProperty({ description: '장비 UUID' })
  @IsNotEmpty()
  @IsUUID()
  equipmentId: string;

  @ApiProperty({ description: '발견일 (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsDateString()
  discoveryDate: string;

  @ApiProperty({ description: '발견자 UUID' })
  @IsNotEmpty()
  @IsUUID()
  discoveredBy: string;

  @ApiProperty({ description: '부적합 원인' })
  @IsNotEmpty()
  @IsString()
  cause: string;

  @ApiPropertyOptional({ description: '조치 계획' })
  @IsOptional()
  @IsString()
  actionPlan?: string;
}
