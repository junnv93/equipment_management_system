import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Permission } from '@equipment-management/shared-constants';
import { AuthenticatedRequest } from '../../types/auth';
import { DisposalService } from './services/disposal.service';
import {
  RequestDisposalDto,
  ReviewDisposalDto,
  ApproveDisposalDto,
  requestDisposalSchema,
  reviewDisposalSchema,
  approveDisposalSchema,
} from './dto/disposal.dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

/**
 * 장비 폐기 컨트롤러
 *
 * 2단계 승인 워크플로우 API:
 * 1. POST /equipment/:equipmentId/disposal/request - 폐기 요청
 * 2. POST /equipment/:equipmentId/disposal/review - 검토 (approve/reject)
 * 3. POST /equipment/:equipmentId/disposal/approve - 최종 승인 (approve/reject)
 * 4. DELETE /equipment/:equipmentId/disposal/request - 요청 취소
 * 5. GET /equipment/:equipmentId/disposal/current - 현재 폐기 요청 조회
 */
@ApiTags('장비 폐기')
@ApiBearerAuth()
@Controller('equipment/:equipmentId/disposal')
export class DisposalController {
  constructor(private readonly disposalService: DisposalService) {}

  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '폐기 요청',
    description: '장비 폐기를 요청합니다. 요청 후 장비 상태는 pending_disposal로 변경됩니다.',
  })
  @ApiParam({ name: 'equipmentId', description: '장비 ID (UUID)', type: 'string' })
  @ApiBody({ type: RequestDisposalDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '폐기 요청이 생성되었습니다.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '장비를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '이미 진행 중인 폐기 요청이 있음' })
  @RequirePermissions(Permission.REQUEST_DISPOSAL)
  @AuditLog({
    action: 'create',
    entityType: 'equipment',
    entityIdPath: 'params.equipmentId',
  })
  async requestDisposal(
    @Param('equipmentId', ParseUUIDPipe) equipmentId: string,
    @Body(new ZodValidationPipe(requestDisposalSchema)) dto: RequestDisposalDto,
    @Req() req: AuthenticatedRequest
  ): Promise<unknown> {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new BadRequestException({
        code: 'AUTH_USER_INFO_MISSING',
        message: 'User information not found.',
      });
    }
    return this.disposalService.requestDisposal(equipmentId, dto, userId);
  }

  @Post('review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '폐기 검토',
    description:
      '폐기 요청을 검토합니다. 기술책임자가 같은 팀의 장비에 대해 검토할 수 있습니다. 승인 시 reviewStatus가 reviewed로 변경되고, 반려 시 rejected로 변경되며 장비 상태가 원복됩니다.',
  })
  @ApiParam({ name: 'equipmentId', description: '장비 ID (UUID)', type: 'string' })
  @ApiBody({ type: ReviewDisposalDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '폐기 검토가 완료되었습니다.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '대기 중인 폐기 요청을 찾을 수 없음' })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '버전 충돌 - 다른 사용자가 이미 수정했습니다',
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '같은 팀의 장비만 검토 가능' })
  @RequirePermissions(Permission.REVIEW_DISPOSAL)
  @AuditLog({
    action: 'approve',
    entityType: 'equipment',
    entityIdPath: 'params.equipmentId',
  })
  async reviewDisposal(
    @Param('equipmentId', ParseUUIDPipe) equipmentId: string,
    @Body(new ZodValidationPipe(reviewDisposalSchema)) reviewDto: ReviewDisposalDto,
    @Req() req: AuthenticatedRequest
  ): Promise<unknown> {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new BadRequestException({
        code: 'AUTH_USER_INFO_MISSING',
        message: 'User information not found.',
      });
    }
    return this.disposalService.reviewDisposal(equipmentId, reviewDto, userId);
  }

  @Post('approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '폐기 최종 승인',
    description:
      '검토 완료된 폐기 요청을 최종 승인합니다. 시험소장만 승인할 수 있습니다. 승인 시 장비 상태가 disposed로 변경되고 isActive가 false로 설정됩니다. 반려 시 장비 상태가 원복됩니다.',
  })
  @ApiParam({ name: 'equipmentId', description: '장비 ID (UUID)', type: 'string' })
  @ApiBody({ type: ApproveDisposalDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '폐기 최종 승인이 완료되었습니다.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '검토 완료된 폐기 요청을 찾을 수 없음',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '버전 충돌 - 다른 사용자가 이미 수정했습니다',
  })
  @RequirePermissions(Permission.APPROVE_DISPOSAL)
  @AuditLog({
    action: 'approve',
    entityType: 'equipment',
    entityIdPath: 'params.equipmentId',
  })
  async approveDisposal(
    @Param('equipmentId', ParseUUIDPipe) equipmentId: string,
    @Body(new ZodValidationPipe(approveDisposalSchema)) approveDto: ApproveDisposalDto,
    @Req() req: AuthenticatedRequest
  ): Promise<unknown> {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new BadRequestException({
        code: 'AUTH_USER_INFO_MISSING',
        message: 'User information not found.',
      });
    }
    return this.disposalService.approveDisposal(equipmentId, approveDto, userId);
  }

  @Delete('request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '폐기 요청 취소',
    description:
      '대기 중인 폐기 요청을 취소합니다. 요청자 본인만 취소할 수 있습니다. 취소 시 장비 상태가 available로 원복됩니다.',
  })
  @ApiParam({ name: 'equipmentId', description: '장비 ID (UUID)', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '폐기 요청이 취소되었습니다.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '대기 중인 폐기 요청을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '요청자 본인만 취소 가능' })
  @RequirePermissions(Permission.REQUEST_DISPOSAL)
  @AuditLog({
    action: 'cancel',
    entityType: 'equipment',
    entityIdPath: 'params.equipmentId',
  })
  async cancelDisposalRequest(
    @Param('equipmentId', ParseUUIDPipe) equipmentId: string,
    @Req() req: AuthenticatedRequest
  ): Promise<{ success: boolean; message: string }> {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new BadRequestException({
        code: 'AUTH_USER_INFO_MISSING',
        message: 'User information not found.',
      });
    }
    return this.disposalService.cancelDisposalRequest(equipmentId, userId);
  }

  @Get('current')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '현재 폐기 요청 조회',
    description: '장비의 현재 진행 중인 폐기 요청을 조회합니다. 없으면 null을 반환합니다.',
  })
  @ApiParam({ name: 'equipmentId', description: '장비 ID (UUID)', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '폐기 요청 조회 성공',
  })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  async getCurrentDisposalRequest(
    @Param('equipmentId', ParseUUIDPipe) equipmentId: string
  ): Promise<unknown> {
    return this.disposalService.getCurrentDisposalRequest(equipmentId);
  }
}
