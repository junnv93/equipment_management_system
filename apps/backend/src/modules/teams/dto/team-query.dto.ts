import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TeamEnum } from '@equipment-management/schemas';

export class TeamQueryDto {
  @IsOptional()
  @IsEnum(TeamEnum, { each: true })
  @ApiPropertyOptional({
    description: '팀 ID 필터 (쉼표로 구분된 여러 값 가능)',
    example: 'rf,sar',
  })
  ids?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: '검색어 (팀 이름, 설명 등)',
    example: 'RF',
  })
  search?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: '정렬 기준 (예: name.asc,createdAt.desc)',
    example: 'name.asc',
  })
  sort?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({
    description: '페이지 번호',
    default: 1,
  })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({
    description: '페이지 크기',
    default: 20,
  })
  pageSize?: number = 20;
}
