import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  NotFoundException,
  BadRequestException,
  HttpStatus,
  HttpCode,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  CreateUserValidationPipe,
  UpdateUserDto,
  UpdateUserValidationPipe,
  UserQueryDto,
  UserQueryValidationPipe,
} from './dto';
import { User, UserListResponse } from '../../types/models';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/rbac/permissions.enum';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UsePipes(CreateUserValidationPipe)
  @ApiOperation({ summary: '사용자 생성', description: '새로운 사용자를 생성합니다.' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: '사용자 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UsePipes(UserQueryValidationPipe)
  @ApiOperation({
    summary: '사용자 목록 조회',
    description: '사용자 목록을 조회합니다. 필터링, 정렬, 페이지네이션을 지원합니다.',
  })
  @ApiResponse({ status: 200, description: '사용자 목록 조회 성공' })
  async findAll(@Query() query: UserQueryDto): Promise<UserListResponse> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: '사용자 상세 조회',
    description: '특정 ID를 가진 사용자의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '사용자 조회 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async findOne(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException(`사용자 ID ${id}를 찾을 수 없습니다.`);
    }
    return user;
  }

  @Patch(':id')
  @UsePipes(UpdateUserValidationPipe)
  @ApiOperation({
    summary: '사용자 정보 수정',
    description: '특정 ID를 가진 사용자의 정보를 수정합니다.',
  })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: '사용자 수정 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersService.update(id, updateUserDto);
    if (!user) {
      throw new NotFoundException(`사용자 ID ${id}를 찾을 수 없습니다.`);
    }
    return user;
  }

  @Delete(':id')
  @ApiOperation({ summary: '사용자 삭제', description: '특정 ID를 가진 사용자를 삭제합니다.' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({ status: 204, description: '사용자 삭제 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    const result = await this.usersService.remove(id);
    if (!result) {
      throw new NotFoundException(`사용자 ID ${id}를 찾을 수 없습니다.`);
    }
  }

  @Patch(':id/activate')
  @ApiOperation({
    summary: '사용자 계정 활성화',
    description: '비활성화된 사용자 계정을 활성화합니다.',
  })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '사용자 계정이 성공적으로 활성화되었습니다.' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없습니다.' })
  @RequirePermissions(Permission.UPDATE_USERS)
  async activateUser(@Param('id') id: string) {
    const user = await this.usersService.toggleActive(id, true);
    if (!user) {
      throw new NotFoundException(`사용자 ID ${id}를 찾을 수 없습니다.`);
    }
    return user;
  }

  @Patch(':id/deactivate')
  @ApiOperation({
    summary: '사용자 계정 비활성화',
    description: '활성화된 사용자 계정을 비활성화합니다.',
  })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '사용자 계정이 성공적으로 비활성화되었습니다.' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없습니다.' })
  @RequirePermissions(Permission.UPDATE_USERS)
  async deactivateUser(@Param('id') id: string) {
    const user = await this.usersService.toggleActive(id, false);
    if (!user) {
      throw new NotFoundException(`사용자 ID ${id}를 찾을 수 없습니다.`);
    }
    return user;
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: '사용자 권한 조회', description: '사용자의 모든 권한을 조회합니다.' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '사용자 권한 목록' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없습니다.' })
  getUserPermissions(@Param('id') id: string) {
    return this.usersService.findUserPermissions(id);
  }

  @Post(':id/reset-password')
  @ApiOperation({
    summary: '비밀번호 초기화',
    description: '관리자가 사용자의 비밀번호를 초기화합니다.',
  })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '비밀번호가 성공적으로 초기화되었습니다.' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없습니다.' })
  @RequirePermissions(Permission.UPDATE_USERS)
  async resetPassword(@Param('id') id: string) {
    // 임시 비밀번호 생성 및 사용자 비밀번호 재설정 로직
    const result = await this.usersService.generateTemporaryPassword(id);
    if (!result) {
      throw new NotFoundException(`사용자 ID ${id}를 찾을 수 없습니다.`);
    }
    return {
      message: '비밀번호가 성공적으로 초기화되었습니다.',
      temporaryPassword: result.tempPassword,
    };
  }
}
