import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Enum 정의 ==========

export enum SoftwareApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// ========== Zod 스키마 정의 ==========

/**
 * 소프트웨어 이력 조회 쿼리 스키마
 */
export const softwareHistoryQuerySchema = z.object({
  equipmentId: z.string().uuid({ message: '유효한 장비 UUID가 아닙니다' }).optional(),
  softwareName: z.string().optional(),
  approvalStatus: z
    .nativeEnum(SoftwareApprovalStatus, {
      message: '유효하지 않은 승인 상태입니다',
    })
    .optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    (val) => (val ? Number(val) : 20),
    z.number().int().min(1).max(100).default(20)
  ),
});

export type SoftwareHistoryQueryInput = z.infer<typeof softwareHistoryQuerySchema>;
export const SoftwareHistoryQueryValidationPipe = new ZodValidationPipe(softwareHistoryQuerySchema);

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
    enum: SoftwareApprovalStatus,
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
  pageSize?: number = 20;
}
