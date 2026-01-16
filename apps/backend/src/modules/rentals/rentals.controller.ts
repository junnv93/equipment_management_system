import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RentalsService } from './rentals.service';
import { CreateRentalDto, UpdateRentalDto, RentalQueryDto, ReturnRequestDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/rbac/permissions.enum';

@ApiTags('대여 관리')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Post()
  @RequirePermissions(Permission.REQUEST_RENTAL)
  @ApiOperation({
    summary: '대여 신청',
    description: '새로운 장비 대여를 신청합니다. 모든 사용자가 신청 가능합니다.',
  })
  @ApiBody({ type: CreateRentalDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: '대여 신청 성공' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '대여 기간 충돌' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  async create(@Body() createRentalDto: CreateRentalDto) {
    return this.rentalsService.create(createRentalDto);
  }

  @Get()
  @RequirePermissions(Permission.VIEW_RENTALS)
  @ApiOperation({
    summary: '대여 목록 조회',
    description: '대여 목록을 조회합니다. 필터링, 정렬, 페이지네이션을 지원합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '대여 목록 조회 성공' })
  async findAll(@Query() query: RentalQueryDto) {
    return this.rentalsService.findAll(query);
  }

  @Get(':uuid')
  @RequirePermissions(Permission.VIEW_RENTALS)
  @ApiOperation({
    summary: '대여 상세 조회',
    description: '특정 UUID를 가진 대여의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'uuid', description: '대여 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '대여 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '대여를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  async findOne(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.rentalsService.findOne(uuid);
  }

  @Patch(':uuid')
  @RequirePermissions(Permission.UPDATE_EQUIPMENT) // TODO: 대여 수정 권한 별도 정의 필요
  @ApiOperation({
    summary: '대여 정보 수정',
    description: '특정 UUID를 가진 대여의 정보를 수정합니다. 승인 전만 수정 가능합니다.',
  })
  @ApiParam({ name: 'uuid', description: '대여 UUID', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateRentalDto })
  @ApiResponse({ status: HttpStatus.OK, description: '대여 수정 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '대여를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '수정 불가능한 상태' })
  async update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateRentalDto: UpdateRentalDto
  ) {
    return this.rentalsService.update(uuid, updateRentalDto);
  }

  @Delete(':uuid')
  @RequirePermissions(Permission.DELETE_EQUIPMENT) // TODO: 대여 삭제 권한 별도 정의 필요
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '대여 취소',
    description: '특정 UUID를 가진 대여를 취소합니다. 승인 전만 취소 가능합니다.',
  })
  @ApiParam({ name: 'uuid', description: '대여 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '대여 취소 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '대여를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '취소 불가능한 상태' })
  async remove(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.rentalsService.remove(uuid);
  }

  @Patch(':uuid/approve')
  @RequirePermissions(Permission.APPROVE_RENTAL)
  @ApiOperation({
    summary: '대여 승인',
    description: '장비 소유 팀의 담당자 또는 매니저가 대여를 승인합니다.',
  })
  @ApiParam({ name: 'uuid', description: '대여 UUID', type: String, format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { approverId: { type: 'string', format: 'uuid' } },
      required: ['approverId'],
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: '대여 승인 성공' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '승인 불가능한 상태' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '대여를 찾을 수 없음' })
  async approve(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body('approverId') approverId: string
  ) {
    return this.rentalsService.approve(uuid, approverId);
  }

  @Patch(':uuid/reject')
  @RequirePermissions(Permission.REJECT_RENTAL)
  @ApiOperation({ summary: '대여 반려', description: '대여를 반려합니다. 반려 사유는 필수입니다.' })
  @ApiParam({ name: 'uuid', description: '대여 UUID', type: String, format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        approverId: { type: 'string', format: 'uuid' },
        reason: { type: 'string', description: '반려 사유 (필수)' },
      },
      required: ['approverId', 'reason'],
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: '대여 반려 성공' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '반려 불가능한 상태 또는 사유 누락' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '대여를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  async reject(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body('approverId') approverId: string,
    @Body('reason') reason: string
  ) {
    // 반려 사유 필수 검증 (요구사항)
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('반려 사유는 필수입니다.');
    }
    return this.rentalsService.reject(uuid, approverId, reason);
  }

  @Patch(':uuid/complete')
  @RequirePermissions(Permission.VIEW_RENTALS) // TODO: 반납 권한 별도 정의 필요
  @ApiOperation({
    summary: '대여 완료 (반납)',
    description: '대여를 완료하고 장비를 반납 처리합니다.',
  })
  @ApiParam({ name: 'uuid', description: '대여 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '대여 완료 처리 성공' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '완료 불가능한 상태' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '대여를 찾을 수 없음' })
  async complete(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.rentalsService.complete(uuid);
  }

  @Patch(':uuid/cancel')
  @RequirePermissions(Permission.VIEW_RENTALS) // TODO: 취소 권한 별도 정의 필요
  @ApiOperation({
    summary: '대여 취소',
    description: '승인 전 대여를 취소합니다. 신청자만 취소 가능합니다.',
  })
  @ApiParam({ name: 'uuid', description: '대여 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '대여 취소 성공' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '취소 불가능한 상태' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '대여를 찾을 수 없음' })
  async cancel(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.rentalsService.cancel(uuid);
  }

  @Post(':uuid/start')
  @RequirePermissions(Permission.VIEW_RENTALS) // TODO: 대여 시작 권한 별도 정의 필요
  @ApiOperation({
    summary: '대여 시작',
    description: '승인된 대여를 시작합니다. 실제 대여 시작 시점에 호출됩니다.',
  })
  @ApiParam({ name: 'uuid', description: '대여 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '대여 시작 성공' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '시작 불가능한 상태' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '대여를 찾을 수 없음' })
  async startRental(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.rentalsService.startRental(uuid);
  }

  @Post(':uuid/request-return')
  @RequirePermissions(Permission.VIEW_RENTALS)
  @ApiOperation({ summary: '반납 요청', description: '사용자가 장비 반납을 요청합니다.' })
  @ApiParam({ name: 'uuid', description: '대여 UUID', type: String, format: 'uuid' })
  @ApiBody({ type: ReturnRequestDto })
  @ApiResponse({ status: HttpStatus.OK, description: '반납 요청 성공' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '반납 요청 불가능한 상태' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '대여를 찾을 수 없음' })
  async requestReturn(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() returnRequestDto: ReturnRequestDto
  ) {
    return this.rentalsService.requestReturn(uuid, returnRequestDto);
  }

  @Patch(':uuid/approve-return')
  @RequirePermissions(Permission.APPROVE_RENTAL)
  @ApiOperation({
    summary: '반납 요청 승인',
    description: '사용자가 요청한 장비 반납을 승인합니다.',
  })
  @ApiParam({ name: 'uuid', description: '대여 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '반납 승인 성공' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '반납 승인 불가능한 상태' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '대여를 찾을 수 없음' })
  async approveReturn(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.rentalsService.approveReturn(uuid);
  }
}
