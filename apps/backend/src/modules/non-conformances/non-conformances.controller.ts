import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { NonConformancesService } from './non-conformances.service';
import { CreateNonConformanceDto } from './dto/create-non-conformance.dto';
import { UpdateNonConformanceDto } from './dto/update-non-conformance.dto';
import { CloseNonConformanceDto } from './dto/close-non-conformance.dto';
import { NonConformanceQueryDto } from './dto/non-conformance-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RequirePermissions } from '../../decorators/require-permissions.decorator';
import { Permission } from '../auth/rbac/permissions.enum';

@ApiTags('부적합 관리')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('non-conformances')
export class NonConformancesController {
  constructor(private readonly nonConformancesService: NonConformancesService) {}

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
  create(@Body() createDto: CreateNonConformanceDto) {
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
  findAll(@Query() query: NonConformanceQueryDto) {
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
  findOne(@Param('uuid') uuid: string) {
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
  findOpenByEquipment(@Param('equipmentUuid') equipmentUuid: string) {
    return this.nonConformancesService.findOpenByEquipment(equipmentUuid);
  }

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
  update(@Param('uuid') uuid: string, @Body() updateDto: UpdateNonConformanceDto) {
    return this.nonConformancesService.update(uuid, updateDto);
  }

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
  close(@Param('uuid') uuid: string, @Body() closeDto: CloseNonConformanceDto) {
    return this.nonConformancesService.close(uuid, closeDto);
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
  remove(@Param('uuid') uuid: string) {
    return this.nonConformancesService.remove(uuid);
  }
}
