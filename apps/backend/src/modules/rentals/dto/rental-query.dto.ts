import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 정의 ==========

/**
 * 대여 조회 쿼리 스키마
 */
export const rentalQuerySchema = z.object({
  equipmentId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  approverId: z.string().uuid().optional(),
  types: z.string().optional(),
  statuses: z.string().optional(),
  startFrom: z.string().optional(),
  startTo: z.string().optional(),
  endFrom: z.string().optional(),
  endTo: z.string().optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  page: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().min(1).optional()),
  pageSize: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().min(1).max(100).optional()
  ),
});

export type RentalQueryInput = z.infer<typeof rentalQuerySchema>;
export const RentalQueryValidationPipe = new ZodValidationPipe(rentalQuerySchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class RentalQueryDto {
  @ApiProperty({
    description: '장비 ID로 필터링',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  equipmentId?: string;

  @ApiProperty({
    description: '사용자 ID로 필터링',
    example: '550e8400-e29b-41d4-a716-446655440002',
    required: false,
  })
  userId?: string;

  @ApiProperty({
    description: '승인자 ID로 필터링',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  approverId?: string;

  @ApiProperty({
    description: '대여/반출 유형으로 필터링 (콤마로 구분하여 여러 값 지정 가능)',
    example: 'rental,checkout',
    required: false,
  })
  types?: string;

  @ApiProperty({
    description: '대여/반출 상태로 필터링 (콤마로 구분하여 여러 값 지정 가능)',
    example: 'pending,approved',
    required: false,
  })
  statuses?: string;

  @ApiProperty({
    description: '시작 일자 이후로 필터링',
    example: '2023-06-01',
    required: false,
  })
  startFrom?: string;

  @ApiProperty({
    description: '시작 일자 이전으로 필터링',
    example: '2023-07-01',
    required: false,
  })
  startTo?: string;

  @ApiProperty({
    description: '종료 예정 일자 이후로 필터링',
    example: '2023-06-15',
    required: false,
  })
  endFrom?: string;

  @ApiProperty({
    description: '종료 예정 일자 이전으로 필터링',
    example: '2023-07-15',
    required: false,
  })
  endTo?: string;

  @ApiProperty({
    description: '검색어 (목적, 장소, 비고 등을 검색)',
    example: '테스트',
    required: false,
  })
  search?: string;

  @ApiProperty({
    description: '정렬 기준 (필드명.asc 또는 필드명.desc)',
    example: 'startDate.desc',
    required: false,
  })
  sort?: string;

  @ApiProperty({
    description: '페이지 번호',
    example: 1,
    default: 1,
    required: false,
  })
  page?: number;

  @ApiProperty({
    description: '페이지 크기',
    example: 20,
    default: 20,
    required: false,
  })
  pageSize?: number;
}
