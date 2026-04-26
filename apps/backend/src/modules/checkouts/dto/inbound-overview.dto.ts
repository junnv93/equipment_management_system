import { ApiProperty } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  InboundOverviewQuerySchema,
  type InboundOverviewQueryInput,
} from '@equipment-management/schemas';

export const InboundOverviewQueryValidationPipe = new ZodValidationPipe(
  InboundOverviewQuerySchema,
  { targets: ['query'] }
);

export type { InboundOverviewQueryInput };

export class InboundOverviewQueryDto {
  @ApiProperty({ description: '상태 필터 (all 또는 특정 상태값)', required: false })
  statusFilter?: string;

  @ApiProperty({ description: '검색어', required: false })
  searchTerm?: string;

  @ApiProperty({
    description: '섹션당 항목 수 (기본값: 10, 최대: 50)',
    required: false,
    default: 10,
  })
  limitPerSection: number;
}
