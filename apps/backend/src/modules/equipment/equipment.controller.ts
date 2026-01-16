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
  UsePipes,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentQueryDto } from './dto/equipment-query.dto';
import { RequirePermissions } from '../../decorators/require-permissions.decorator';
import { Permission } from '../auth/rbac/permissions.enum';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// 표준 상태값은 schemas 패키지에서 import
import { EquipmentStatus } from '@equipment-management/schemas';
import { CreateEquipmentValidationPipe } from './dto/create-equipment.dto';
import { UpdateEquipmentValidationPipe } from './dto/update-equipment.dto';
import { EquipmentQueryValidationPipe } from './dto/equipment-query.dto';

@ApiTags('장비 관리')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @ApiOperation({ summary: '장비 등록', description: '새로운 장비를 시스템에 등록합니다.' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '장비가 성공적으로 등록되었습니다.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.CREATE_EQUIPMENT)
  @UsePipes(CreateEquipmentValidationPipe)
  create(@Body() createEquipmentDto: CreateEquipmentDto) {
    return this.equipmentService.create(createEquipmentDto);
  }

  @Get()
  @ApiOperation({ summary: '장비 목록 조회', description: '등록된 모든 장비의 목록을 조회합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '장비 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  @UsePipes(EquipmentQueryValidationPipe)
  findAll(@Query() query: EquipmentQueryDto) {
    return this.equipmentService.findAll(query);
  }

  @Get(':uuid')
  @ApiOperation({ summary: '장비 상세 조회', description: '특정 장비의 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'uuid', description: '장비 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '장비 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '장비를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  findOne(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.equipmentService.findOne(uuid);
  }

  @Patch(':uuid')
  @ApiOperation({ summary: '장비 정보 수정', description: '특정 장비의 정보를 수정합니다.' })
  @ApiParam({ name: 'uuid', description: '장비 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '장비 정보 수정 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '장비를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.UPDATE_EQUIPMENT)
  @UsePipes(UpdateEquipmentValidationPipe)
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateEquipmentDto: UpdateEquipmentDto
  ) {
    return this.equipmentService.update(uuid, updateEquipmentDto);
  }

  @Delete(':uuid')
  @ApiOperation({ summary: '장비 삭제', description: '특정 장비를 시스템에서 삭제합니다.' })
  @ApiParam({ name: 'uuid', description: '장비 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '장비 삭제 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '장비를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.DELETE_EQUIPMENT)
  remove(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.equipmentService.remove(uuid);
  }

  @Patch(':uuid/status')
  @ApiOperation({ summary: '장비 상태 변경', description: '특정 장비의 상태를 변경합니다.' })
  @ApiParam({ name: 'uuid', description: '장비 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '장비 상태 변경 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '장비를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.UPDATE_EQUIPMENT)
  updateStatus(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body('status') status: EquipmentStatus
  ) {
    return this.equipmentService.updateStatus(uuid, status);
  }

  @Get('team/:teamId')
  @ApiOperation({
    summary: '팀별 장비 목록 조회',
    description: '특정 팀에 할당된 장비 목록을 조회합니다.',
  })
  @ApiParam({ name: 'teamId', description: '팀 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '팀별 장비 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  findByTeam(@Param('teamId') teamId: string) {
    return this.equipmentService.findByTeam(teamId);
  }

  @Get('calibration/due')
  @ApiOperation({
    summary: '교정 예정 장비 조회',
    description: '특정 기간 내에 교정이 예정된 장비를 조회합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 예정 장비 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  findCalibrationDue(@Query('days') days: number = 30) {
    return this.equipmentService.findCalibrationDue(days);
  }
}
