import { Controller, Get, Post, Body, Patch, Param, Delete, Query, NotFoundException, BadRequestException, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { RentalsService } from './rentals.service';
import { CreateRentalDto, UpdateRentalDto, RentalQueryDto, ReturnRequestDto, ApproveReturnDto } from './dto';
import { Rental, RentalListResponse } from '@equipment-management/schemas';

@ApiTags('rentals')
@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Post()
  @ApiOperation({ summary: '새 대여/반출 생성', description: '새로운 장비 대여/반출을 요청합니다.' })
  @ApiBody({ type: CreateRentalDto })
  @ApiResponse({ status: 201, description: '대여/반출 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async create(@Body() createRentalDto: CreateRentalDto): Promise<Rental> {
    return this.rentalsService.create(createRentalDto);
  }

  @Get()
  @ApiOperation({ summary: '대여/반출 목록 조회', description: '대여/반출 목록을 조회합니다. 필터링, 정렬, 페이지네이션을 지원합니다.' })
  @ApiResponse({ status: 200, description: '대여/반출 목록 조회 성공' })
  async findAll(@Query() query: RentalQueryDto): Promise<RentalListResponse> {
    return this.rentalsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '대여/반출 상세 조회', description: '특정 ID를 가진 대여/반출의 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'id', description: '대여/반출 ID' })
  @ApiResponse({ status: 200, description: '대여/반출 조회 성공' })
  @ApiResponse({ status: 404, description: '대여/반출을 찾을 수 없음' })
  async findOne(@Param('id') id: string): Promise<Rental> {
    const rental = await this.rentalsService.findOne(id);
    if (!rental) {
      throw new NotFoundException(`대여/반출 ID ${id}를 찾을 수 없습니다.`);
    }
    return rental;
  }

  @Patch(':id')
  @ApiOperation({ summary: '대여/반출 정보 수정', description: '특정 ID를 가진 대여/반출의 정보를 수정합니다.' })
  @ApiParam({ name: 'id', description: '대여/반출 ID' })
  @ApiBody({ type: UpdateRentalDto })
  @ApiResponse({ status: 200, description: '대여/반출 수정 성공' })
  @ApiResponse({ status: 404, description: '대여/반출을 찾을 수 없음' })
  async update(@Param('id') id: string, @Body() updateRentalDto: UpdateRentalDto): Promise<Rental> {
    const rental = await this.rentalsService.update(id, updateRentalDto);
    if (!rental) {
      throw new NotFoundException(`대여/반출 ID ${id}를 찾을 수 없습니다.`);
    }
    return rental;
  }

  @Delete(':id')
  @ApiOperation({ summary: '대여/반출 삭제', description: '특정 ID를 가진 대여/반출을 삭제합니다.' })
  @ApiParam({ name: 'id', description: '대여/반출 ID' })
  @ApiResponse({ status: 204, description: '대여/반출 삭제 성공' })
  @ApiResponse({ status: 404, description: '대여/반출을 찾을 수 없음' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    const result = await this.rentalsService.remove(id);
    if (!result) {
      throw new NotFoundException(`대여/반출 ID ${id}를 찾을 수 없습니다.`);
    }
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: '대여/반출 승인', description: '특정 ID를 가진 대여/반출을 승인합니다.' })
  @ApiParam({ name: 'id', description: '대여/반출 ID' })
  @ApiBody({ schema: { type: 'object', properties: { approverId: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: '대여/반출 승인 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 404, description: '대여/반출을 찾을 수 없음' })
  async approve(@Param('id') id: string, @Body('approverId') approverId: string): Promise<Rental> {
    const rental = await this.rentalsService.approve(id, approverId);
    if (!rental) {
      throw new NotFoundException(`대여/반출 ID ${id}를 찾을 수 없습니다.`);
    }
    return rental;
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: '대여/반출 거부', description: '특정 ID를 가진 대여/반출을 거부합니다.' })
  @ApiParam({ name: 'id', description: '대여/반출 ID' })
  @ApiBody({ schema: { type: 'object', properties: { approverId: { type: 'string' }, reason: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: '대여/반출 거부 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 404, description: '대여/반출을 찾을 수 없음' })
  async reject(
    @Param('id') id: string, 
    @Body('approverId') approverId: string,
    @Body('reason') reason?: string
  ): Promise<Rental> {
    const rental = await this.rentalsService.reject(id, approverId, reason);
    if (!rental) {
      throw new NotFoundException(`대여/반출 ID ${id}를 찾을 수 없습니다.`);
    }
    return rental;
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: '대여/반출 완료', description: '특정 ID를 가진 대여/반출을 완료(반납) 처리합니다.' })
  @ApiParam({ name: 'id', description: '대여/반출 ID' })
  @ApiResponse({ status: 200, description: '대여/반출 완료 처리 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 404, description: '대여/반출을 찾을 수 없음' })
  async complete(@Param('id') id: string): Promise<Rental> {
    const rental = await this.rentalsService.complete(id);
    if (!rental) {
      throw new NotFoundException(`대여/반출 ID ${id}를 찾을 수 없습니다.`);
    }
    return rental;
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '대여/반출 취소', description: '특정 ID를 가진 대여/반출을 취소합니다.' })
  @ApiParam({ name: 'id', description: '대여/반출 ID' })
  @ApiResponse({ status: 200, description: '대여/반출 취소 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 404, description: '대여/반출을 찾을 수 없음' })
  async cancel(@Param('id') id: string): Promise<Rental> {
    const rental = await this.rentalsService.cancel(id);
    if (!rental) {
      throw new NotFoundException(`대여/반출 ID ${id}를 찾을 수 없습니다.`);
    }
    return rental;
  }

  @Post(':id/request-return')
  @ApiOperation({ summary: '반납 요청', description: '사용자가 장비 반납을 요청합니다.' })
  @ApiParam({ name: 'id', description: '대여/반출 ID' })
  @ApiBody({ type: ReturnRequestDto })
  @ApiResponse({ status: 200, description: '반납 요청 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 404, description: '대여/반출을 찾을 수 없음' })
  async requestReturn(
    @Param('id') id: string,
    @Body() returnRequestDto: ReturnRequestDto
  ): Promise<Rental> {
    const rental = await this.rentalsService.requestReturn(id, returnRequestDto);
    if (!rental) {
      throw new NotFoundException(`대여/반출 ID ${id}를 찾을 수 없습니다.`);
    }
    return rental;
  }

  @Patch(':id/approve-return')
  @ApiOperation({ summary: '반납 요청 승인', description: '사용자가 요청한 장비 반납을 승인합니다.' })
  @ApiParam({ name: 'id', description: '대여/반출 ID' })
  @ApiBody({ type: ApproveReturnDto })
  @ApiResponse({ status: 200, description: '반납 승인 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 404, description: '대여/반출을 찾을 수 없음' })
  async approveReturn(
    @Param('id') id: string,
    @Body() approveReturnDto: ApproveReturnDto
  ): Promise<Rental> {
    const rental = await this.rentalsService.approveReturn(id, approveReturnDto);
    if (!rental) {
      throw new NotFoundException(`대여/반출 ID ${id}를 찾을 수 없습니다.`);
    }
    return rental;
  }
} 