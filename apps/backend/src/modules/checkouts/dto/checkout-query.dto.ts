import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
// ✅ Single Source of Truth: enums.ts에서 import
import {
  CHECKOUT_PURPOSE_VALUES,
  CheckoutDirectionEnum,
  SiteEnum,
  type CheckoutDirection,
  type Site,
  VM,
  optionalUuid,
} from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/**
 * 반출 조회 쿼리 스키마
 */
export const checkoutQuerySchema = z.object({
  equipmentId: optionalUuid(),
  requesterId: optionalUuid(),
  approverId: optionalUuid(),
  teamId: optionalUuid(),
  site: SiteEnum.optional(),
  direction: CheckoutDirectionEnum.optional(),
  purpose: z
    .enum(CHECKOUT_PURPOSE_VALUES, {
      message: VM.checkout.purpose.invalid,
    })
    .optional(),
  statuses: z.string().optional(),
  destination: z.string().optional(),
  checkoutFrom: z.string().optional(),
  checkoutTo: z.string().optional(),
  returnFrom: z.string().optional(),
  returnTo: z.string().optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  page: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().min(1).optional()),
  pageSize: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().min(1).max(100).optional()
  ),
  includeSummary: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
});

export type CheckoutQueryInput = z.infer<typeof checkoutQuerySchema>;
export const CheckoutQueryValidationPipe = new ZodValidationPipe(checkoutQuerySchema, {
  targets: ['query'],
});

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class CheckoutQueryDto {
  @ApiProperty({
    description: '장비 UUID로 필터링',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  equipmentId?: string;

  @ApiProperty({
    description: '신청자 UUID로 필터링',
    example: '550e8400-e29b-41d4-a716-446655440002',
    required: false,
  })
  requesterId?: string;

  @ApiProperty({
    description: '승인자 UUID로 필터링',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  approverId?: string;

  @ApiProperty({
    description: '팀 UUID로 필터링 (신청자 팀 또는 대여 빌려주는 팀)',
    example: '550e8400-e29b-41d4-a716-446655440010',
    required: false,
  })
  teamId?: string;

  @ApiProperty({
    description: '사이트로 필터링 (서버에서 자동 주입, 클라이언트 파라미터 무시)',
    enum: SiteEnum.options,
    example: 'suwon',
    required: false,
  })
  site?: Site;

  @ApiProperty({
    description:
      '방향 필터링 (teamId와 함께 사용). outbound=우리 팀 장비가 나가는 건, inbound=외부 장비가 들어오는 건',
    enum: CheckoutDirectionEnum.options,
    required: false,
  })
  direction?: CheckoutDirection;

  @ApiProperty({
    description: '반출 목적으로 필터링',
    enum: CHECKOUT_PURPOSE_VALUES,
    required: false,
  })
  purpose?: string;

  @ApiProperty({
    description: '반출 상태로 필터링 (콤마로 구분하여 여러 값 지정 가능)',
    example: 'pending,approved',
    required: false,
  })
  statuses?: string;

  @ApiProperty({
    description: '반출지로 필터링',
    example: '교정기관 ABC',
    required: false,
  })
  destination?: string;

  @ApiProperty({
    description: '반출일 이후로 필터링',
    example: '2023-06-01',
    required: false,
  })
  checkoutFrom?: string;

  @ApiProperty({
    description: '반출일 이전으로 필터링',
    example: '2023-07-01',
    required: false,
  })
  checkoutTo?: string;

  @ApiProperty({
    description: '반입 예정일 이후로 필터링',
    example: '2023-06-15',
    required: false,
  })
  returnFrom?: string;

  @ApiProperty({
    description: '반입 예정일 이전으로 필터링',
    example: '2023-07-15',
    required: false,
  })
  returnTo?: string;

  @ApiProperty({
    description: '검색어 (목적, 장소, 사유 등을 검색)',
    example: '교정',
    required: false,
  })
  search?: string;

  @ApiProperty({
    description: '정렬 기준 (필드명.asc 또는 필드명.desc)',
    example: 'checkoutDate.desc',
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

  @ApiProperty({
    description: '요약 정보 포함 여부 (true 시 summary 필드 포함)',
    example: false,
    default: false,
    required: false,
  })
  includeSummary?: boolean;
}
