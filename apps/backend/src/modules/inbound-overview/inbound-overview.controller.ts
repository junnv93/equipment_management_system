import { Controller, Get, Query, Request, HttpStatus, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InboundOverviewService } from './inbound-overview.service';
import type { InboundOverviewResult } from './inbound-overview.service';
import {
  InboundOverviewQueryDto,
  InboundOverviewQueryValidationPipe,
} from '../checkouts/dto/inbound-overview.dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@equipment-management/shared-constants';
import type { AuthenticatedRequest } from '../../types/auth';

@ApiTags('반입 현황')
@ApiBearerAuth()
@Controller('checkouts')
export class InboundOverviewController {
  constructor(private readonly inboundOverviewService: InboundOverviewService) {}

  @Get('inbound-overview')
  @RequirePermissions(Permission.VIEW_CHECKOUTS)
  @UsePipes(InboundOverviewQueryValidationPipe)
  @ApiOperation({
    summary: '반입 현황 집계 (BFF)',
    description:
      '표준 반입(팀 대여) + 외부 렌탈 + 내부 공용 3섹션을 단일 요청으로 집계합니다. ' +
      '필터 1회 변경 → 3 round-trip을 1 round-trip으로 축소. Sparkline 14일 시계열 포함.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '반입 현황 집계 성공' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  async getInboundOverview(
    @Query() query: InboundOverviewQueryDto,
    @Request() req: AuthenticatedRequest
  ): Promise<InboundOverviewResult> {
    return this.inboundOverviewService.getInboundOverview(query, req.user?.teamId ?? null);
  }
}
