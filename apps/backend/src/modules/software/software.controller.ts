import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { SoftwareService } from './software.service';
import { CreateSoftwareChangeDto } from './dto/create-software-change.dto';
import { SoftwareHistoryQueryDto } from './dto/software-query.dto';
import { ApproveSoftwareChangeDto, RejectSoftwareChangeDto } from './dto/approve-software.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@equipment-management/shared-constants';

@ApiTags('소프트웨어 관리')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('software')
export class SoftwareController {
  constructor(private readonly softwareService: SoftwareService) {}

  @Post('change-request')
  @ApiOperation({
    summary: '소프트웨어 변경 요청',
    description:
      '소프트웨어 변경을 요청합니다. 검증 기록은 필수입니다. 상태는 pending으로 설정됩니다.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '소프트웨어 변경 요청이 성공적으로 등록되었습니다.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 요청 데이터 (검증 기록 필수)',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.CREATE_SOFTWARE_CHANGE)
  create(
    @Body() createDto: CreateSoftwareChangeDto
  ): import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/software/software.service').SoftwareHistoryRecord {
    return this.softwareService.create(createDto);
  }

  @Get('history')
  @ApiOperation({
    summary: '소프트웨어 변경 이력 조회',
    description:
      '소프트웨어 변경 이력을 조회합니다. 필터: equipmentId, softwareName, approvalStatus',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '소프트웨어 변경 이력 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_SOFTWARE)
  findHistory(@Query() query: SoftwareHistoryQueryDto): Promise<{
    items: import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/software/software.service').SoftwareHistoryRecord[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    return this.softwareService.findHistory(query);
  }

  @Get('pending')
  @ApiOperation({
    summary: '승인 대기 소프트웨어 변경 요청 목록 조회',
    description: '승인 대기 상태인 소프트웨어 변경 요청 목록을 조회합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '승인 대기 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_SOFTWARE_REQUESTS)
  findPendingApprovals(): Promise<{
    items: import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/software/software.service').SoftwareHistoryRecord[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    return this.softwareService.findPendingApprovals();
  }

  @Get('registry')
  @ApiOperation({
    summary: '소프트웨어 통합 관리대장',
    description: '전체 장비의 소프트웨어 현황을 조회합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '소프트웨어 관리대장 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_SOFTWARE)
  getRegistry(): Promise<{
    registry: {
      equipmentId: string;
      equipmentName: string;
      softwareName: string | null;
      softwareVersion: string | null;
      softwareType: string | null;
      lastUpdated: Date | null;
    }[];
    summary: { softwareName: string; equipmentCount: number; versions: (string | null)[] }[];
    totalEquipments: number;
    totalSoftwareTypes: number;
    generatedAt: Date;
  }> {
    return this.softwareService.getRegistry();
  }

  @Get(':name/equipment')
  @ApiOperation({
    summary: '특정 소프트웨어 사용 장비 목록',
    description: '특정 소프트웨어를 사용하는 장비 목록을 조회합니다.',
  })
  @ApiParam({ name: 'name', description: '소프트웨어명' })
  @ApiResponse({ status: HttpStatus.OK, description: '장비 목록 조회 성공' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '해당 소프트웨어를 사용하는 장비를 찾을 수 없음',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_SOFTWARE)
  findEquipmentBySoftware(@Param('name') name: string): Promise<{
    softwareName: string;
    equipments: {
      equipmentId: string;
      equipmentName: string;
      softwareVersion: string | null;
      softwareType: string | null;
      lastUpdated: Date | null;
    }[];
    count: number;
  }> {
    return this.softwareService.findEquipmentBySoftware(name);
  }

  @Get(':uuid')
  @ApiOperation({
    summary: '소프트웨어 변경 이력 상세 조회',
    description: '특정 소프트웨어 변경 이력의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'uuid', description: '변경 이력 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '변경 이력 상세 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '변경 이력을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_SOFTWARE)
  findOne(
    @Param('uuid') uuid: string
  ): Promise<
    import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/software/software.service').SoftwareHistoryRecord
  > {
    return this.softwareService.findOne(uuid);
  }

  @Patch(':uuid/approve')
  @ApiOperation({
    summary: '소프트웨어 변경 승인',
    description: '기술책임자가 소프트웨어 변경 요청을 승인합니다.',
  })
  @ApiParam({ name: 'uuid', description: '변경 이력 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '소프트웨어 변경 승인 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '변경 이력을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터 또는 상태 오류' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.APPROVE_SOFTWARE_CHANGE)
  approve(
    @Param('uuid') uuid: string,
    @Body() approveDto: ApproveSoftwareChangeDto
  ): Promise<
    import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/software/software.service').SoftwareHistoryRecord
  > {
    return this.softwareService.approve(uuid, approveDto);
  }

  @Patch(':uuid/reject')
  @ApiOperation({
    summary: '소프트웨어 변경 반려',
    description: '기술책임자가 소프트웨어 변경 요청을 반려합니다.',
  })
  @ApiParam({ name: 'uuid', description: '변경 이력 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '소프트웨어 변경 반려 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '변경 이력을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터 또는 상태 오류' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.APPROVE_SOFTWARE_CHANGE)
  reject(
    @Param('uuid') uuid: string,
    @Body() rejectDto: RejectSoftwareChangeDto
  ): Promise<
    import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/software/software.service').SoftwareHistoryRecord
  > {
    return this.softwareService.reject(uuid, rejectDto);
  }
}
