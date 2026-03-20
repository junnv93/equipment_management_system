import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  NotFoundException,
  HttpStatus,
  HttpCode,
  UsePipes,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  CreateUserValidationPipe,
  UpdateUserDto,
  UpdateUserValidationPipe,
  UserQueryDto,
  UserQueryValidationPipe,
  ChangeRoleDto,
  ChangeRoleValidationPipe,
} from './dto';
import type { ChangeRoleInput } from './dto';
import {
  DisplayPreferencesDto,
  UpdatePreferencesValidationPipe,
  DEFAULT_DISPLAY_PREFERENCES,
} from './dto/user-preferences.dto';
import type { User, PaginatedResponseType, UserRole } from '@equipment-management/schemas';
import { AuthenticatedRequest } from '../../types/auth';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SkipPermissions } from '../auth/decorators/skip-permissions.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { SiteScoped } from '../../common/decorators/site-scoped.decorator';
import { Permission, USER_DATA_SCOPE } from '@equipment-management/shared-constants';
import { InternalServiceOnly } from '../../common/decorators/internal-service-only.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions(Permission.UPDATE_USERS)
  @UsePipes(CreateUserValidationPipe)
  @AuditLog({ action: 'create', entityType: 'user', entityIdPath: 'response.id' })
  @ApiOperation({ summary: '사용자 생성', description: '새로운 사용자를 생성합니다.' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: '사용자 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @InternalServiceOnly()
  @Post('sync')
  @UsePipes(CreateUserValidationPipe)
  @ApiOperation({
    summary: '사용자 동기화 (Upsert)',
    description:
      'NextAuth 로그인 시 사용자를 DB에 생성 또는 업데이트합니다. (Azure AD/Credentials). ' +
      'Internal API Key 인증 필요 (X-Internal-Api-Key 헤더).',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 200, description: '사용자 동기화 성공 (생성 또는 업데이트)' })
  @ApiResponse({ status: 401, description: '인증 실패 (API 키 누락 또는 잘못됨)' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async syncUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.upsert(createUserDto);
  }

  @Get()
  @RequirePermissions(Permission.VIEW_USERS)
  @SiteScoped({ policy: USER_DATA_SCOPE })
  @UsePipes(UserQueryValidationPipe)
  @ApiOperation({
    summary: '사용자 목록 조회',
    description: '사용자 목록을 조회합니다. 필터링, 정렬, 페이지네이션을 지원합니다.',
  })
  @ApiResponse({ status: 200, description: '사용자 목록 조회 성공' })
  async findAll(@Query() query: UserQueryDto): Promise<PaginatedResponseType<User>> {
    return this.usersService.findAll(query);
  }

  @Get('me')
  @SkipPermissions()
  @ApiOperation({
    summary: '내 프로필 조회',
    description: '현재 로그인한 사용자의 상세 정보를 조회합니다. 팀 정보를 포함합니다.',
  })
  @ApiResponse({ status: 200, description: '내 프로필 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async getMyProfile(@Request() req: AuthenticatedRequest): Promise<unknown> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new NotFoundException({
        code: 'AUTH_USER_INFO_MISSING',
        message: 'User information could not be verified.',
      });
    }
    const user = await this.usersService.findOneWithTeam(userId);
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found.',
      });
    }
    return user;
  }

  @Get('me/preferences')
  @SkipPermissions()
  @ApiOperation({
    summary: '내 표시 설정 조회',
    description: '현재 로그인한 사용자의 표시 설정을 조회합니다. 미설정 시 기본값을 반환합니다.',
  })
  @ApiResponse({ status: 200, description: '표시 설정 조회 성공' })
  async getMyPreferences(@Request() req: AuthenticatedRequest): Promise<unknown> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new NotFoundException({
        code: 'AUTH_USER_INFO_MISSING',
        message: 'User information could not be verified.',
      });
    }
    const prefs = await this.usersService.getPreferences(userId);
    return { ...DEFAULT_DISPLAY_PREFERENCES, ...prefs };
  }

  @Patch('me/preferences')
  @SkipPermissions()
  @ApiOperation({
    summary: '내 표시 설정 변경',
    description: '현재 로그인한 사용자의 표시 설정을 변경합니다. 부분 업데이트를 지원합니다.',
  })
  @ApiResponse({ status: 200, description: '표시 설정 변경 성공' })
  async updateMyPreferences(
    @Request() req: AuthenticatedRequest,
    @Body(UpdatePreferencesValidationPipe) dto: DisplayPreferencesDto
  ): Promise<unknown> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new NotFoundException({
        code: 'AUTH_USER_INFO_MISSING',
        message: 'User information could not be verified.',
      });
    }
    const updated = await this.usersService.updatePreferences(userId, dto);
    return { ...DEFAULT_DISPLAY_PREFERENCES, ...updated };
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_USERS)
  @ApiOperation({
    summary: '사용자 상세 조회',
    description: '특정 ID를 가진 사용자의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '사용자 조회 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: `User ID ${id} not found.`,
      });
    }
    return user;
  }

  @Patch(':id')
  @RequirePermissions(Permission.UPDATE_USERS)
  @UsePipes(UpdateUserValidationPipe)
  @AuditLog({ action: 'update', entityType: 'user', entityIdPath: 'params.id' })
  @ApiOperation({
    summary: '사용자 정보 수정',
    description: '특정 ID를 가진 사용자의 정보를 수정합니다.',
  })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: '사용자 수정 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<User> {
    const user = await this.usersService.update(id, updateUserDto);
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: `User ID ${id} not found.`,
      });
    }
    return user;
  }

  @Delete(':id')
  @RequirePermissions(Permission.UPDATE_USERS)
  @AuditLog({ action: 'delete', entityType: 'user', entityIdPath: 'params.id' })
  @ApiOperation({ summary: '사용자 삭제', description: '특정 ID를 가진 사용자를 삭제합니다.' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({ status: 204, description: '사용자 삭제 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const result = await this.usersService.remove(id);
    if (!result) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: `User ID ${id} not found.`,
      });
    }
  }

  @Patch(':id/change-role')
  @RequirePermissions(Permission.MANAGE_ROLES)
  @AuditLog({ action: 'update', entityType: 'user', entityIdPath: 'params.id' })
  @ApiOperation({
    summary: '사용자 역할 변경',
    description:
      '기술책임자/시험소장이 사용자의 역할을 변경합니다. Conditional WHERE 기반 경량 CAS로 동시 수정을 방어합니다.',
  })
  @ApiParam({ name: 'id', description: '대상 사용자 ID' })
  @ApiBody({ type: ChangeRoleDto })
  @ApiResponse({ status: 200, description: '역할 변경 성공' })
  @ApiResponse({ status: 403, description: '권한 없음 (자기 변경, 범위 초과 등)' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '동시 수정 충돌 (이미 다른 관리자가 변경)' })
  async changeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ChangeRoleValidationPipe) dto: ChangeRoleInput,
    @Request() req: AuthenticatedRequest
  ): Promise<User> {
    return this.usersService.changeRole(id, dto, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.roles?.[0] || '',
      teamId: req.user.teamId,
      site: req.user.site,
    });
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
  @AuditLog({ action: 'update', entityType: 'user', entityIdPath: 'params.id' })
  async activateUser(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    const user = await this.usersService.toggleActive(id, true);
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: `User ID ${id} not found.`,
      });
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
  @AuditLog({ action: 'update', entityType: 'user', entityIdPath: 'params.id' })
  async deactivateUser(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    const user = await this.usersService.toggleActive(id, false);
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: `User ID ${id} not found.`,
      });
    }
    return user;
  }

  @Get(':id/permissions')
  @RequirePermissions(Permission.VIEW_USERS)
  @ApiOperation({ summary: '사용자 권한 조회', description: '사용자의 모든 권한을 조회합니다.' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '사용자 권한 목록' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없습니다.' })
  getUserPermissions(@Param('id', ParseUUIDPipe) id: string): Promise<{
    userId: string;
    username: string;
    role: UserRole;
    permissions: string[];
  } | null> {
    return this.usersService.findUserPermissions(id);
  }
}
