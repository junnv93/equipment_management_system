import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UsePipes,
  HttpStatus,
  HttpCode,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@equipment-management/shared-constants';
import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto, TeamQueryDto } from './dto';
import { CreateTeamValidationPipe } from './dto/create-team.dto';
import { UpdateTeamValidationPipe } from './dto/update-team.dto';
import { TeamQueryValidationPipe } from './dto/team-query.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('teams')
@ApiBearerAuth()
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @RequirePermissions(Permission.VIEW_TEAMS)
  @UsePipes(TeamQueryValidationPipe)
  @ApiOperation({ summary: '모든 팀 조회' })
  @ApiResponse({ status: 200, description: '팀 목록 반환' })
  async findAll(@Query() query: TeamQueryDto): Promise<unknown> {
    const result = await this.teamsService.findAll(query);
    return {
      items: result.items,
      meta: {
        totalItems: result.total,
        itemCount: result.items.length,
        itemsPerPage: result.pageSize,
        totalPages: result.totalPages,
        currentPage: result.page,
      },
    };
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_TEAMS)
  @ApiOperation({ summary: '특정 팀 조회' })
  @ApiResponse({ status: 200, description: '팀 정보 반환' })
  @ApiResponse({ status: 404, description: '팀을 찾을 수 없음' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<unknown> {
    const team = await this.teamsService.findOne(id);

    if (!team) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: '요청한 팀을 찾을 수 없습니다.',
      });
    }

    return team;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(Permission.CREATE_TEAMS)
  @UsePipes(CreateTeamValidationPipe)
  @AuditLog({
    action: 'create',
    entityType: 'team',
    entityIdPath: 'response.id',
    entityNamePath: 'body.name',
  })
  @ApiOperation({ summary: '새 팀 등록' })
  @ApiResponse({ status: 201, description: '팀 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async create(@Body() createTeamDto: CreateTeamDto): Promise<unknown> {
    return this.teamsService.create(createTeamDto);
  }

  @Put(':id')
  @RequirePermissions(Permission.UPDATE_TEAMS)
  @UsePipes(UpdateTeamValidationPipe)
  @AuditLog({
    action: 'update',
    entityType: 'team',
    entityIdPath: 'params.id',
    entityNamePath: 'body.name',
  })
  @ApiOperation({ summary: '팀 정보 업데이트' })
  @ApiResponse({ status: 200, description: '팀 업데이트 성공' })
  @ApiResponse({ status: 404, description: '팀을 찾을 수 없음' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTeamDto: UpdateTeamDto
  ): Promise<unknown> {
    const team = await this.teamsService.update(id, updateTeamDto);

    if (!team) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: '업데이트할 팀을 찾을 수 없습니다.',
      });
    }

    return team;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(Permission.DELETE_TEAMS)
  @AuditLog({ action: 'delete', entityType: 'team', entityIdPath: 'params.id' })
  @ApiOperation({ summary: '팀 삭제' })
  @ApiResponse({ status: 204, description: '팀 삭제 성공' })
  @ApiResponse({ status: 404, description: '팀을 찾을 수 없음' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const deleted = await this.teamsService.remove(id);

    if (!deleted) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: '삭제할 팀을 찾을 수 없습니다.',
      });
    }

    // 204 응답은 본문이 없음
  }
}
