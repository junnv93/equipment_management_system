import { IsEnum, IsOptional, IsString, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRoleEnum, TeamEnum } from '@equipment-management/schemas';

export class UserQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: '이메일 검색',
    example: 'user@example.com',
  })
  email?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: '이름 검색',
    example: '홍길동',
  })
  name?: string;

  @IsOptional()
  @IsEnum(UserRoleEnum, { each: true })
  @ApiPropertyOptional({
    description: '역할 필터 (쉼표로 구분된 여러 값 가능)',
    example: 'admin,manager',
  })
  roles?: string;

  @IsOptional()
  @IsEnum(TeamEnum, { each: true })
  @ApiPropertyOptional({
    description: '팀 필터 (쉼표로 구분된 여러 값 가능)',
    example: 'rf,sar',
  })
  teams?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: '부서 검색',
    example: '개발팀',
  })
  department?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  @ApiPropertyOptional({
    description: '활성 상태 필터',
    example: true,
  })
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: '검색어 (이름, 이메일, 직위 등)',
    example: '개발',
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
