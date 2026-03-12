import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { SiteEnum, type Site } from '@equipment-management/schemas';

/**
 * 사용자 쿼리 스키마 (Zod)
 *
 * 사용자 목록 조회 시 사용되는 쿼리 파라미터입니다.
 */
export const userQuerySchema = z.object({
  email: z.string().optional(),
  name: z.string().optional(),
  roles: z.string().optional(), // 쉼표로 구분된 역할 목록
  teams: z.string().optional(), // 쉼표로 구분된 팀 목록
  site: SiteEnum.optional(),
  department: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type UserQueryInput = z.infer<typeof userQuerySchema>;

/**
 * 사용자 쿼리 DTO
 *
 * Swagger 문서화를 위한 클래스 정의입니다.
 */
export class UserQueryDto {
  @ApiPropertyOptional({
    description: '이메일 검색',
    example: 'user@example.com',
  })
  email?: string;

  @ApiPropertyOptional({
    description: '이름 검색',
    example: '홍길동',
  })
  name?: string;

  @ApiPropertyOptional({
    description: '역할 필터 (쉼표로 구분된 여러 값 가능)',
    example: 'admin,manager',
  })
  roles?: string;

  @ApiPropertyOptional({
    description: '팀 필터 (쉼표로 구분된 여러 값 가능)',
    example: 'rf,sar',
  })
  teams?: string;

  @ApiPropertyOptional({
    description: '사이트 필터',
    enum: SiteEnum.options,
    example: 'suwon',
  })
  site?: Site;

  @ApiPropertyOptional({
    description: '부서 검색',
    example: '개발팀',
  })
  department?: string;

  @ApiPropertyOptional({
    description: '활성 상태 필터',
    example: true,
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: '검색어 (이름, 이메일, 직위 등)',
    example: '개발',
  })
  search?: string;

  @ApiPropertyOptional({
    description: '정렬 기준 (예: name.asc,createdAt.desc)',
    example: 'name.asc',
  })
  sort?: string;

  @ApiPropertyOptional({
    description: '페이지 번호',
    default: 1,
  })
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지 크기',
    default: 20,
  })
  pageSize?: number = 20;
}

// Zod 검증 파이프 생성
export const UserQueryValidationPipe = new ZodValidationPipe(userQuerySchema, {
  targets: ['query'],
});
