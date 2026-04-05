import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UsePipes,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CablesService } from './cables.service';
import {
  CreateCablePipe,
  UpdateCablePipe,
  CableQueryValidationPipe,
  CreateMeasurementPipe,
} from './dto';
import type {
  CreateCableInput,
  UpdateCableInput,
  CableQueryInput,
  CreateMeasurementInput,
} from './dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@equipment-management/shared-constants';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import type { AuthenticatedRequest } from '../../types/auth';
import { extractUserId } from '../../common/utils/extract-user';

@Controller('cables')
export class CablesController {
  constructor(private readonly cablesService: CablesService) {}

  @Get()
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  @UsePipes(CableQueryValidationPipe)
  findAll(@Query() query: CableQueryInput): ReturnType<CablesService['findAll']> {
    return this.cablesService.findAll(query);
  }

  @Post()
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  @AuditLog({
    action: 'create',
    entityType: 'cable',
    entityIdPath: 'response.id',
  })
  @UsePipes(CreateCablePipe)
  create(
    @Body() dto: CreateCableInput,
    @Request() req: AuthenticatedRequest
  ): ReturnType<CablesService['create']> {
    const createdBy = extractUserId(req);
    return this.cablesService.create(dto, createdBy);
  }

  @Get('measurements/:measurementId')
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  findMeasurementDetail(
    @Param('measurementId', ParseUUIDPipe) measurementId: string
  ): ReturnType<CablesService['findMeasurementDetail']> {
    return this.cablesService.findMeasurementDetail(measurementId);
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  findOne(@Param('id', ParseUUIDPipe) id: string): ReturnType<CablesService['findOne']> {
    return this.cablesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  @AuditLog({
    action: 'update',
    entityType: 'cable',
    entityIdPath: 'params.id',
  })
  @UsePipes(UpdateCablePipe)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCableInput,
    @Request() req: AuthenticatedRequest
  ): ReturnType<CablesService['update']> {
    const userId = extractUserId(req);
    return this.cablesService.update(id, dto, userId);
  }

  @Post(':id/measurements')
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  @AuditLog({
    action: 'create',
    entityType: 'cable_loss_measurement',
    entityIdPath: 'response.id',
  })
  @UsePipes(CreateMeasurementPipe)
  addMeasurement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMeasurementInput,
    @Request() req: AuthenticatedRequest
  ): ReturnType<CablesService['addMeasurement']> {
    const userId = extractUserId(req);
    return this.cablesService.addMeasurement(id, dto, userId);
  }

  @Get(':id/measurements')
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  findMeasurements(
    @Param('id', ParseUUIDPipe) id: string
  ): ReturnType<CablesService['findMeasurements']> {
    return this.cablesService.findMeasurements(id);
  }
}
