import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class CloseNonConformanceDto {
  @ApiProperty({ description: '종료 승인자 UUID (기술책임자)' })
  @IsNotEmpty()
  @IsUUID()
  closedBy: string;

  @ApiPropertyOptional({ description: '종료 메모' })
  @IsOptional()
  @IsString()
  closureNotes?: string;
}
