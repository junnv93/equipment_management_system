import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EquipmentHistoryService } from './services/equipment-history.service';
import {
  CreateLocationHistoryDto,
  CreateMaintenanceHistoryDto,
  CreateIncidentHistoryDto,
  LocationHistoryResponseDto,
  MaintenanceHistoryResponseDto,
  IncidentHistoryResponseDto,
} from './dto/equipment-history.dto';

@ApiTags('Equipment History')
@Controller('api/equipment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EquipmentHistoryController {
  constructor(private readonly equipmentHistoryService: EquipmentHistoryService) {}

  // ===================== 위치 변동 이력 =====================

  @Get(':uuid/location-history')
  @ApiOperation({ summary: '장비 위치 변동 이력 조회' })
  @ApiParam({ name: 'uuid', description: '장비 UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '위치 변동 이력 목록',
    type: [LocationHistoryResponseDto],
  })
  async getLocationHistory(
    @Param('uuid') equipmentUuid: string
  ): Promise<LocationHistoryResponseDto[]> {
    return this.equipmentHistoryService.getLocationHistory(equipmentUuid);
  }

  @Post(':uuid/location-history')
  @ApiOperation({ summary: '위치 변동 이력 추가' })
  @ApiParam({ name: 'uuid', description: '장비 UUID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '생성된 위치 변동 이력',
    type: LocationHistoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '필수 필드 누락 또는 유효성 검사 실패',
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createLocationHistory(
    @Param('uuid') equipmentUuid: string,
    @Body() dto: CreateLocationHistoryDto,
    @Request() req: any
  ): Promise<LocationHistoryResponseDto> {
    const userId = req.user?.uuid || req.user?.id;
    return this.equipmentHistoryService.createLocationHistory(equipmentUuid, dto, userId);
  }

  @Delete('location-history/:historyId')
  @ApiOperation({ summary: '위치 변동 이력 삭제' })
  @ApiParam({ name: 'historyId', description: '이력 UUID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '삭제 성공' })
  async deleteLocationHistory(@Param('historyId') historyId: string): Promise<void> {
    return this.equipmentHistoryService.deleteLocationHistory(historyId);
  }

  // ===================== 유지보수 내역 =====================

  @Get(':uuid/maintenance-history')
  @ApiOperation({ summary: '장비 유지보수 내역 조회' })
  @ApiParam({ name: 'uuid', description: '장비 UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '유지보수 내역 목록',
    type: [MaintenanceHistoryResponseDto],
  })
  async getMaintenanceHistory(
    @Param('uuid') equipmentUuid: string
  ): Promise<MaintenanceHistoryResponseDto[]> {
    return this.equipmentHistoryService.getMaintenanceHistory(equipmentUuid);
  }

  @Post(':uuid/maintenance-history')
  @ApiOperation({ summary: '유지보수 내역 추가' })
  @ApiParam({ name: 'uuid', description: '장비 UUID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '생성된 유지보수 내역',
    type: MaintenanceHistoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '필수 필드 누락 또는 유효성 검사 실패',
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createMaintenanceHistory(
    @Param('uuid') equipmentUuid: string,
    @Body() dto: CreateMaintenanceHistoryDto,
    @Request() req: any
  ): Promise<MaintenanceHistoryResponseDto> {
    const userId = req.user?.uuid || req.user?.id;
    return this.equipmentHistoryService.createMaintenanceHistory(equipmentUuid, dto, userId);
  }

  @Delete('maintenance-history/:historyId')
  @ApiOperation({ summary: '유지보수 내역 삭제' })
  @ApiParam({ name: 'historyId', description: '이력 UUID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '삭제 성공' })
  async deleteMaintenanceHistory(@Param('historyId') historyId: string): Promise<void> {
    return this.equipmentHistoryService.deleteMaintenanceHistory(historyId);
  }

  // ===================== 손상/오작동/변경/수리 내역 =====================

  @Get(':uuid/incident-history')
  @ApiOperation({ summary: '장비 손상/오작동/변경/수리 내역 조회' })
  @ApiParam({ name: 'uuid', description: '장비 UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '손상/수리 내역 목록',
    type: [IncidentHistoryResponseDto],
  })
  async getIncidentHistory(
    @Param('uuid') equipmentUuid: string
  ): Promise<IncidentHistoryResponseDto[]> {
    return this.equipmentHistoryService.getIncidentHistory(equipmentUuid);
  }

  @Post(':uuid/incident-history')
  @ApiOperation({ summary: '손상/오작동/변경/수리 내역 추가' })
  @ApiParam({ name: 'uuid', description: '장비 UUID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '생성된 손상/수리 내역',
    type: IncidentHistoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '필수 필드 누락 또는 유효성 검사 실패',
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createIncidentHistory(
    @Param('uuid') equipmentUuid: string,
    @Body() dto: CreateIncidentHistoryDto,
    @Request() req: any
  ): Promise<IncidentHistoryResponseDto> {
    const userId = req.user?.uuid || req.user?.id;
    return this.equipmentHistoryService.createIncidentHistory(equipmentUuid, dto, userId);
  }

  @Delete('incident-history/:historyId')
  @ApiOperation({ summary: '손상/오작동/변경/수리 내역 삭제' })
  @ApiParam({ name: 'historyId', description: '이력 UUID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '삭제 성공' })
  async deleteIncidentHistory(@Param('historyId') historyId: string): Promise<void> {
    return this.equipmentHistoryService.deleteIncidentHistory(historyId);
  }
}
