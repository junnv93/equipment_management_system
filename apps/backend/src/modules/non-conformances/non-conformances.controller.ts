import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  UseGuards,
  HttpStatus,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { NonConformancesService } from './non-conformances.service';
import {
  CreateNonConformanceDto,
  CreateNonConformanceValidationPipe,
} from './dto/create-non-conformance.dto';
import {
  UpdateNonConformanceDto,
  UpdateNonConformanceValidationPipe,
} from './dto/update-non-conformance.dto';
import {
  CloseNonConformanceDto,
  CloseNonConformanceValidationPipe,
} from './dto/close-non-conformance.dto';
import { RejectCorrectionDto, RejectCorrectionValidationPipe } from './dto/reject-correction.dto';
import { NonConformanceQueryDto } from './dto/non-conformance-query.dto';
import { type NonConformance } from '@equipment-management/db/schema/non-conformances';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@equipment-management/shared-constants';
import { UserRoleValues } from '@equipment-management/schemas';
import type { AuthenticatedRequest } from '../../types/auth';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@ApiTags('부적합 관리')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('non-conformances')
export class NonConformancesController {
  constructor(private readonly nonConformancesService: NonConformancesService) {}

  @AuditLog({
    action: 'create',
    entityType: 'non_conformance',
  })
  @Post()
  @ApiOperation({
    summary: '부적합 등록',
    description: '새로운 부적합을 등록합니다. 장비 상태가 자동으로 non_conforming으로 변경됩니다.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '부적합이 성공적으로 등록되었습니다.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '장비를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.CREATE_NON_CONFORMANCE)
  @UsePipes(CreateNonConformanceValidationPipe)
  create(@Body() createDto: CreateNonConformanceDto): Promise<NonConformance> {
    return this.nonConformancesService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: '부적합 목록 조회',
    description: '부적합 목록을 조회합니다. 필터: equipmentId, status',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '부적합 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_NON_CONFORMANCES)
  findAll(
    @Query() query: NonConformanceQueryDto,
    @Request() req: AuthenticatedRequest
  ): Promise<{
    items: NonConformance[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    // 🔒 보안: lab_manager 외 역할은 자신의 사이트로 강제 필터링
    const roles = req.user?.roles || [];
    const isLabManager = roles.includes(UserRoleValues.LAB_MANAGER);
    if (!isLabManager && req.user?.site) {
      query.site = req.user.site;
    }
    return this.nonConformancesService.findAll(query);
  }

  @Get(':uuid')
  @ApiOperation({
    summary: '부적합 상세 조회',
    description: '특정 부적합의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'uuid', description: '부적합 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '부적합 상세 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '부적합을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_NON_CONFORMANCES)
  findOne(@Param('uuid') uuid: string): Promise<NonConformance> {
    return this.nonConformancesService.findOne(uuid);
  }

  @Get('equipment/:equipmentUuid')
  @ApiOperation({
    summary: '장비별 열린 부적합 조회',
    description: '특정 장비의 열린(open) 부적합 목록을 조회합니다.',
  })
  @ApiParam({ name: 'equipmentUuid', description: '장비 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '장비별 부적합 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_NON_CONFORMANCES)
  findOpenByEquipment(@Param('equipmentUuid') equipmentUuid: string): Promise<NonConformance[]> {
    return this.nonConformancesService.findOpenByEquipment(equipmentUuid);
  }

  @AuditLog({
    action: 'update',
    entityType: 'non_conformance',
    entityIdPath: 'params.uuid',
  })
  @Patch(':uuid')
  @ApiOperation({
    summary: '부적합 업데이트',
    description: '원인분석/조치 기록을 업데이트합니다.',
  })
  @ApiParam({ name: 'uuid', description: '부적합 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '부적합 업데이트 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '부적합을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터 또는 상태 오류' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.UPDATE_NON_CONFORMANCE)
  @UsePipes(UpdateNonConformanceValidationPipe)
  update(
    @Param('uuid') uuid: string,
    @Body() updateDto: UpdateNonConformanceDto
  ): Promise<NonConformance> {
    return this.nonConformancesService.update(uuid, updateDto);
  }

  @AuditLog({
    action: 'close',
    entityType: 'non_conformance',
    entityIdPath: 'params.uuid',
  })
  @Patch(':uuid/close')
  @ApiOperation({
    summary: '부적합 종료',
    description:
      '기술책임자가 부적합을 종료합니다. 장비 상태가 available로 복원됩니다. (조치 완료 상태에서만 가능)',
  })
  @ApiParam({ name: 'uuid', description: '부적합 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '부적합 종료 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '부적합을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터 또는 상태 오류' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.CLOSE_NON_CONFORMANCE)
  @UsePipes(CloseNonConformanceValidationPipe)
  close(
    @Param('uuid') uuid: string,
    @Request() req: AuthenticatedRequest,
    @Body() closeDto: CloseNonConformanceDto
  ): Promise<NonConformance> {
    const closedBy = req.user?.userId;
    return this.nonConformancesService.close(uuid, closeDto, closedBy);
  }

  @AuditLog({
    action: 'reject_correction',
    entityType: 'non_conformance',
    entityIdPath: 'params.uuid',
  })
  @Patch(':uuid/reject-correction')
  @ApiOperation({
    summary: '부적합 조치 반려',
    description: '기술책임자가 조치 완료된 부적합을 반려합니다. 상태가 analyzing으로 되돌아갑니다.',
  })
  @ApiParam({ name: 'uuid', description: '부적합 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '부적합 반려 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '부적합을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터 또는 상태 오류' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '버전 충돌 (다른 사용자가 수정)' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.CLOSE_NON_CONFORMANCE)
  @UsePipes(RejectCorrectionValidationPipe)
  rejectCorrection(
    @Param('uuid') uuid: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: RejectCorrectionDto
  ): Promise<NonConformance> {
    const rejectedBy = req.user?.userId;
    return this.nonConformancesService.rejectCorrection(uuid, dto, rejectedBy);
  }

  @Delete(':uuid')
  @ApiOperation({
    summary: '부적합 삭제 (소프트 삭제)',
    description: '부적합을 소프트 삭제합니다. 이력은 영구 보관됩니다.',
  })
  @ApiParam({ name: 'uuid', description: '부적합 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '부적합 삭제 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '부적합을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.CLOSE_NON_CONFORMANCE)
  @AuditLog({ action: 'delete', entityType: 'non_conformance', entityIdPath: 'params.uuid' })
  remove(@Param('uuid') uuid: string): Promise<{ id: string; deleted: boolean }> {
    return this.nonConformancesService.remove(uuid);
  }
}
