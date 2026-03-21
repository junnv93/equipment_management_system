import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@equipment-management/shared-constants';
import {
  SoftwareApprovalStatusEnum,
  SOFTWARE_APPROVAL_STATUS_VALUES,
  SiteEnum,
  VM,
  uuidString,
  type SoftwareApprovalStatus,
  type Site,
} from '@equipment-management/schemas';

// Re-export for backward compatibility
export { SoftwareApprovalStatusEnum, SOFTWARE_APPROVAL_STATUS_VALUES, type SoftwareApprovalStatus };

// ========== Zod 스키마 정의 ==========

/**
 * 소프트웨어 이력 조회 쿼리 스키마
 */
export const softwareHistoryQuerySchema = z.object({
  equipmentId: uuidString(VM.uuid.invalid('장비')).optional(),
  softwareName: z.string().optional(),
  approvalStatus: SoftwareApprovalStatusEnum.optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  /** @SiteScoped에 의해 자동 주입 — 직접 설정 금지 */
  site: SiteEnum.optional(),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    (val) => (val ? Number(val) : DEFAULT_PAGE_SIZE),
    z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE)
  ),
});

export type SoftwareHistoryQueryInput = z.infer<typeof softwareHistoryQuerySchema>;
export const SoftwareHistoryQueryValidationPipe = new ZodValidationPipe(
  softwareHistoryQuerySchema,
  { targets: ['query'] }
);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class SoftwareHistoryQueryDto {
  @ApiProperty({
    description: '장비 UUID로 필터',
    required: false,
  })
  equipmentId?: string;

  @ApiProperty({
    description: '소프트웨어명으로 필터',
    required: false,
  })
  softwareName?: string;

  @ApiProperty({
    description: '승인 상태로 필터',
    enum: SOFTWARE_APPROVAL_STATUS_VALUES,
    required: false,
  })
  approvalStatus?: SoftwareApprovalStatus;

  @ApiProperty({
    description: '검색어 (소프트웨어명으로 검색)',
    required: false,
  })
  search?: string;

  @ApiProperty({
    description: '정렬 기준 (필드.방향)',
    example: 'changedAt.desc',
    required: false,
  })
  sort?: string;

  @ApiProperty({
    description: '사이트 필터 (@SiteScoped 자동 주입)',
    enum: SiteEnum.options,
    required: false,
  })
  site?: Site;

  @ApiProperty({
    description: '페이지 번호',
    default: 1,
    required: false,
  })
  page?: number = 1;

  @ApiProperty({
    description: '페이지 크기',
    default: 20,
    required: false,
  })
  pageSize?: number = DEFAULT_PAGE_SIZE;
}
