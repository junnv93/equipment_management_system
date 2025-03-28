import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/interfaces/user-role.enum';

@ApiTags('사용자')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: '사용자 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'teamId', required: false, type: Number })
  @ApiResponse({ status: 200, description: '사용자 목록 조회 성공' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('teamId') teamId?: number,
  ) {
    return this.usersService.findAll(+page, +limit, teamId ? +teamId : undefined);
  }

  @ApiOperation({ summary: '사용자 상세 정보 조회' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '사용자 상세 정보 조회 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없습니다' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(+id);
    const { passwordHash, ...result } = user;
    return result;
  }

  @ApiOperation({ summary: '사용자 생성' })
  @ApiResponse({ status: 201, description: '사용자 생성 성공' })
  @ApiResponse({ status: 400, description: '유효하지 않은 데이터' })
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({ summary: '사용자 정보 업데이트' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '사용자 정보 업데이트 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없습니다' })
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @ApiOperation({ summary: '사용자 비활성화' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '사용자 비활성화 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없습니다' })
  @Roles(UserRole.ADMIN)
  @Delete(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(+id);
  }

  @ApiOperation({ summary: '사용자 활성화' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '사용자 활성화 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없습니다' })
  @Roles(UserRole.ADMIN)
  @Post(':id/activate')
  activate(@Param('id') id: string) {
    return this.usersService.activate(+id);
  }
}
