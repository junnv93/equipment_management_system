import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, IsUUID, IsIn } from 'class-validator';

export class UpdateNonConformanceDto {
  @ApiPropertyOptional({ description: '조치 계획' })
  @IsOptional()
  @IsString()
  actionPlan?: string;

  @ApiPropertyOptional({ description: '원인 분석 내용' })
  @IsOptional()
  @IsString()
  analysisContent?: string;

  @ApiPropertyOptional({ description: '조치 내용' })
  @IsOptional()
  @IsString()
  correctionContent?: string;

  @ApiPropertyOptional({ description: '조치 완료일 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  correctionDate?: string;

  @ApiPropertyOptional({ description: '조치자 UUID' })
  @IsOptional()
  @IsUUID()
  correctedBy?: string;

  @ApiPropertyOptional({
    description: '상태 변경',
    enum: ['open', 'analyzing', 'corrected'],
  })
  @IsOptional()
  @IsIn(['open', 'analyzing', 'corrected'])
  status?: 'open' | 'analyzing' | 'corrected';
}
