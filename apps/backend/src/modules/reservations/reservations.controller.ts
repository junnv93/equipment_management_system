import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req, ParseUUIDPipe, HttpStatus } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationQueryDto } from './dto/reservation-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { UserRole } from '../users/entities/user.entity';
import { ReservationStatus } from './entities/reservation.entity';
import { EquipmentStatusEnum } from '../equipment/entities/equipment.entity';

@ApiTags('reservations')
@ApiBearerAuth()
@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: '예약 생성' })
  @ApiBody({ type: CreateReservationDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: '예약이 성공적으로 생성됨' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '예약 충돌 발생' })
  create(@Body() createReservationDto: CreateReservationDto, @Req() req) {
    // 현재 로그인한 사용자를 예약자로 설정
    createReservationDto.userId = req.user.id;
    return this.reservationsService.create(createReservationDto);
  }

  @Get()
  @ApiOperation({ summary: '예약 목록 조회' })
  @ApiQuery({ name: 'status', required: false, description: '예약 상태 필터' })
  @ApiQuery({ name: 'equipmentId', required: false, description: '장비 ID 필터' })
  @ApiQuery({ name: 'userId', required: false, description: '사용자 ID 필터' })
  @ApiQuery({ name: 'startDate', required: false, description: '시작일 필터' })
  @ApiQuery({ name: 'endDate', required: false, description: '종료일 필터' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 크기' })
  findAll(@Query() query: ReservationQueryDto, @Req() req) {
    // 일반 사용자는 자신의 예약만 볼 수 있도록 설정
    if (req.user.role === 'USER') {
      query.userId = req.user.id;
    }
    return this.reservationsService.findAll(query);
  }

  @Get('available-equipment')
  @ApiOperation({ summary: '특정 기간 내 사용 가능한 장비 조회' })
  @ApiQuery({ name: 'startDate', required: true, description: '시작일' })
  @ApiQuery({ name: 'endDate', required: true, description: '종료일' })
  findAvailableEquipment(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.reservationsService.findAvailableEquipment(
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 예약 조회' })
  @ApiParam({ name: 'id', description: '예약 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '예약 정보 반환' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '예약을 찾을 수 없음' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '예약 정보 업데이트' })
  @ApiParam({ name: 'id', description: '예약 ID' })
  @ApiBody({ type: UpdateReservationDto })
  @ApiResponse({ status: HttpStatus.OK, description: '예약이 성공적으로 업데이트됨' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '예약을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '예약 충돌 발생' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReservationDto: UpdateReservationDto,
    @Req() req
  ) {
    // 일반 사용자는 자신의 예약만 수정할 수 있도록 확인
    if (req.user.role === 'USER') {
      // 서비스에서 권한 확인 로직 필요
    }
    return this.reservationsService.update(id, updateReservationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '예약 삭제' })
  @ApiParam({ name: 'id', description: '예약 ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '예약이 성공적으로 삭제됨' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '예약을 찾을 수 없음' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationsService.remove(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '예약 취소' })
  @ApiParam({ name: 'id', description: '예약 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '예약이 성공적으로 취소됨' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '예약을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '이미 취소된 예약' })
  cancel(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    // 일반 사용자는 자신의 예약만 취소할 수 있도록 확인 필요
    return this.reservationsService.cancelReservation(id, req.user.id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: '예약 승인' })
  @ApiParam({ name: 'id', description: '예약 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '예약이 성공적으로 승인됨' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '예약을 찾을 수 없음' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  approve(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    const updateData: UpdateReservationDto = {
      status: ReservationStatus.APPROVED,
      approvedById: req.user.id
    };
    return this.reservationsService.update(id, updateData);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: '예약 거절' })
  @ApiParam({ name: 'id', description: '예약 ID' })
  @ApiBody({ schema: { properties: { rejectionReason: { type: 'string' } } } })
  @ApiResponse({ status: HttpStatus.OK, description: '예약이 성공적으로 거절됨' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '예약을 찾을 수 없음' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('rejectionReason') rejectionReason: string,
    @Req() req
  ) {
    const updateData: UpdateReservationDto = {
      status: ReservationStatus.REJECTED,
      rejectionReason,
      approvedById: req.user.id
    };
    return this.reservationsService.update(id, updateData);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '예약 완료 및 장비 반납' })
  @ApiParam({ name: 'id', description: '예약 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '예약이 성공적으로 완료되고 장비가 반납됨' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '예약을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '완료할 수 없는 상태의 예약' })
  @UseGuards(JwtAuthGuard)
  complete(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.reservationsService.completeReservation(id);
  }
} 