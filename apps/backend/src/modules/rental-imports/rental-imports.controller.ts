import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
  Request,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { RentalImportsService } from './rental-imports.service';
import {
  CreateRentalImportDto,
  CreateRentalImportValidationPipe,
  RejectRentalImportDto,
  RejectRentalImportValidationPipe,
  ReceiveRentalImportDto,
  ReceiveRentalImportValidationPipe,
  RentalImportQueryDto,
  RentalImportQueryValidationPipe,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@equipment-management/shared-constants';
import { AuthenticatedRequest } from '../../types/auth';

@ApiTags('렌탈 반입 관리')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('rental-imports')
export class RentalImportsController {
  constructor(private readonly rentalImportsService: RentalImportsService) {}

  @Post()
  @RequirePermissions(Permission.CREATE_RENTAL_IMPORT)
  @UsePipes(CreateRentalImportValidationPipe)
  @ApiOperation({ summary: '렌탈 반입 신청' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '반입 신청 성공' })
  async create(@Body() dto: CreateRentalImportDto, @Request() req: AuthenticatedRequest) {
    return this.rentalImportsService.create(
      dto,
      req.user.userId,
      req.user.site || 'suwon',
      req.user.teamId || ''
    );
  }

  @Get()
  @RequirePermissions(Permission.VIEW_RENTAL_IMPORTS)
  @UsePipes(RentalImportQueryValidationPipe)
  @ApiOperation({ summary: '렌탈 반입 목록 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '목록 조회 성공' })
  async findAll(@Query() query: RentalImportQueryDto) {
    return this.rentalImportsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_RENTAL_IMPORTS)
  @ApiOperation({ summary: '렌탈 반입 상세 조회' })
  @ApiParam({ name: 'id', description: '렌탈 반입 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '상세 조회 성공' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rentalImportsService.findOne(id);
  }

  @Patch(':id/approve')
  @RequirePermissions(Permission.APPROVE_RENTAL_IMPORT)
  @ApiOperation({ summary: '렌탈 반입 승인' })
  @ApiParam({ name: 'id', description: '렌탈 반입 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '승인 성공' })
  async approve(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.rentalImportsService.approve(id, req.user.userId);
  }

  @Patch(':id/reject')
  @RequirePermissions(Permission.APPROVE_RENTAL_IMPORT)
  @UsePipes(RejectRentalImportValidationPipe)
  @ApiOperation({ summary: '렌탈 반입 거절' })
  @ApiParam({ name: 'id', description: '렌탈 반입 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '거절 성공' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectRentalImportDto,
    @Request() req: AuthenticatedRequest
  ) {
    return this.rentalImportsService.reject(id, req.user.userId, dto);
  }

  @Post(':id/receive')
  @RequirePermissions(Permission.COMPLETE_RENTAL_IMPORT)
  @ApiOperation({ summary: '렌탈 장비 수령 확인 + 자동 등록' })
  @ApiParam({ name: 'id', description: '렌탈 반입 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '수령 확인 성공, 장비 자동 등록됨' })
  async receive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ReceiveRentalImportValidationPipe) dto: ReceiveRentalImportDto,
    @Request() req: AuthenticatedRequest
  ) {
    return this.rentalImportsService.receive(id, req.user.userId, dto);
  }

  @Post(':id/initiate-return')
  @RequirePermissions(Permission.CREATE_CHECKOUT)
  @ApiOperation({ summary: '렌탈 장비 반납 시작 (checkout 자동 생성)' })
  @ApiParam({ name: 'id', description: '렌탈 반입 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '반납 프로세스 시작, checkout 생성됨' })
  async initiateReturn(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest
  ) {
    return this.rentalImportsService.initiateReturn(id, req.user.userId, req.user.teamId);
  }

  @Patch(':id/cancel')
  @RequirePermissions(Permission.CANCEL_RENTAL_IMPORT)
  @ApiOperation({ summary: '렌탈 반입 취소' })
  @ApiParam({ name: 'id', description: '렌탈 반입 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '취소 성공' })
  async cancel(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.rentalImportsService.cancel(id, req.user.userId);
  }
}
