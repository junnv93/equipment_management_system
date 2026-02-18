import { Controller, Get, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Permission } from '@equipment-management/shared-constants';
import { DisposalService } from './services/disposal.service';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuthenticatedRequest } from '../../types/auth';

/**
 * 폐기 요청 목록 컨트롤러
 *
 * 승인 관리 페이지용 API:
 * - GET /disposal-requests/pending-review - 검토 대기 목록 (기술책임자)
 * - GET /disposal-requests/pending-approval - 최종 승인 대기 목록 (시험소장)
 */
@ApiTags('폐기 요청 목록')
@ApiBearerAuth()
@Controller('disposal-requests')
export class DisposalRequestsController {
  constructor(private readonly disposalService: DisposalService) {}

  @Get('pending-review')
  @ApiOperation({
    summary: '검토 대기 중인 폐기 요청 목록 조회',
    description:
      '기술책임자가 검토해야 할 폐기 요청 목록을 조회합니다. 같은 팀 장비만 조회됩니다. (lab_manager는 전체 조회 가능)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '검토 대기 목록 조회 성공',
  })
  @RequirePermissions(Permission.REVIEW_DISPOSAL)
  async getPendingReviewRequests(@Req() req: AuthenticatedRequest): Promise<unknown[]> {
    const userId = req.user.userId;
    return this.disposalService.getPendingReviewRequests(userId);
  }

  @Get('pending-approval')
  @ApiOperation({
    summary: '최종 승인 대기 중인 폐기 요청 목록 조회',
    description: '시험소장이 최종 승인해야 할 폐기 요청 목록을 조회합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '최종 승인 대기 목록 조회 성공',
  })
  @RequirePermissions(Permission.APPROVE_DISPOSAL)
  async getPendingApprovalRequests(): Promise<unknown[]> {
    return this.disposalService.getPendingApprovalRequests();
  }
}
