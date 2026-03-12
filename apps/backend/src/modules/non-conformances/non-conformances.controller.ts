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
  ParseUUIDPipe,
  HttpStatus,
  UsePipes,
  ForbiddenException,
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
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SiteScoped } from '../../common/decorators/site-scoped.decorator';
import {
  Permission,
  NON_CONFORMANCE_DATA_SCOPE,
  resolveDataScope,
} from '@equipment-management/shared-constants';
import type { UserRole } from '@equipment-management/schemas';
import type { AuthenticatedRequest } from '../../types/auth';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@ApiTags('부적합 관리')
@ApiBearerAuth()
@Controller('non-conformances')
export class NonConformancesController {
  constructor(private readonly nonConformancesService: NonConformancesService) {}

  /**
   * 크로스사이트 접근 제어 (UUID 기반 엔드포인트용)
   *
   * NON_CONFORMANCE_DATA_SCOPE 정책에 따라:
   * - test_engineer / technical_manager / quality_manager: 소속 사이트만
   * - lab_manager / system_admin: 전체 접근
   *
   * NC는 siteId 직접 필드가 없으므로 equipment.site로 판별합니다.
   */
  private enforceSiteAccess(req: AuthenticatedRequest, equipmentSite: string): void {
    const userRole = req.user?.roles?.[0] as UserRole | undefined;
    if (!userRole) return;

    const scope = resolveDataScope(
      { role: userRole, site: req.user?.site, teamId: req.user?.teamId },
      NON_CONFORMANCE_DATA_SCOPE
    );

    if (scope.type === 'site' && scope.site && equipmentSite !== scope.site) {
      throw new ForbiddenException({
        code: 'NC_CROSS_SITE_ACCESS_DENIED',
        message: 'No permission to access non-conformances from other sites.',
      });
    }
  }

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
  async create(
    @Body() createDto: CreateNonConformanceDto,
    @Request() req: AuthenticatedRequest
  ): Promise<NonConformance> {
    // ✅ 크로스사이트 보호: 다른 사이트 장비에 NC 등록 차단
    const equip = await this.nonConformancesService.getEquipmentSite(createDto.equipmentId);
    this.enforceSiteAccess(req, equip);
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
  @SiteScoped({ policy: NON_CONFORMANCE_DATA_SCOPE })
  findAll(@Query() query: NonConformanceQueryDto): Promise<{
    items: NonConformance[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    // SiteScopeInterceptor가 NON_CONFORMANCE_DATA_SCOPE 정책으로 query.site를 자동 주입합니다.
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
  async findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<NonConformance> {
    const basic = await this.nonConformancesService.findOneBasic(uuid);
    this.enforceSiteAccess(req, basic.equipmentSite);
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
  async findOpenByEquipment(
    @Param('equipmentUuid', ParseUUIDPipe) equipmentUuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<NonConformance[]> {
    const equipSite = await this.nonConformancesService.getEquipmentSite(equipmentUuid);
    this.enforceSiteAccess(req, equipSite);
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
  async update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateDto: UpdateNonConformanceDto,
    @Request() req: AuthenticatedRequest
  ): Promise<NonConformance> {
    const basic = await this.nonConformancesService.findOneBasic(uuid);
    this.enforceSiteAccess(req, basic.equipmentSite);
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
  async close(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest,
    @Body() closeDto: CloseNonConformanceDto
  ): Promise<NonConformance> {
    const basic = await this.nonConformancesService.findOneBasic(uuid);
    this.enforceSiteAccess(req, basic.equipmentSite);
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
  async rejectCorrection(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: RejectCorrectionDto
  ): Promise<NonConformance> {
    const basic = await this.nonConformancesService.findOneBasic(uuid);
    this.enforceSiteAccess(req, basic.equipmentSite);
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
  async remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<{ id: string; deleted: boolean }> {
    const basic = await this.nonConformancesService.findOneBasic(uuid);
    this.enforceSiteAccess(req, basic.equipmentSite);
    return this.nonConformancesService.remove(uuid);
  }
}
