import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { getErrorMessage } from '../../common/utils/error';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@equipment-management/shared-constants';
import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto, TeamQueryDto } from './dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('teams')
@ApiBearerAuth()
@Controller('teams')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @RequirePermissions(Permission.VIEW_TEAMS)
  @ApiOperation({ summary: '모든 팀 조회' })
  @ApiResponse({ status: 200, description: '팀 목록 반환' })
  async findAll(@Query() query: TeamQueryDto): Promise<{
    data: import('/home/kmjkds/equipment_management_system/packages/schemas/src/team').Team[];
    meta: {
      pagination: { total: number; page: number; pageSize: number; totalPages: number };
      timestamp: string;
    };
  }> {
    const result = await this.teamsService.findAll(query);
    return {
      data: result.items,
      meta: {
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_TEAMS)
  @ApiOperation({ summary: '특정 팀 조회' })
  @ApiResponse({ status: 200, description: '팀 정보 반환' })
  @ApiResponse({ status: 404, description: '팀을 찾을 수 없음' })
  async findOne(@Param('id') id: string): Promise<{
    data: import('/home/kmjkds/equipment_management_system/packages/schemas/src/team').Team;
    meta: { timestamp: string };
  }> {
    const team = await this.teamsService.findOne(id);

    if (!team) {
      throw new NotFoundException({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: '요청한 팀을 찾을 수 없습니다.',
          details: { resourceId: id, resourceType: 'team' },
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    return {
      data: team,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(Permission.CREATE_TEAMS)
  @ApiOperation({ summary: '새 팀 등록' })
  @ApiResponse({ status: 201, description: '팀 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async create(@Body() createTeamDto: CreateTeamDto): Promise<{
    data: import('/home/kmjkds/equipment_management_system/packages/schemas/src/team').Team;
    meta: { timestamp: string };
  }> {
    try {
      const team = await this.teamsService.create(createTeamDto);
      return {
        data: team,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new BadRequestException({
        error: {
          code: 'INVALID_REQUEST',
          message: '팀 생성 중 오류가 발생했습니다.',
          details: { error: getErrorMessage(error) },
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  @Put(':id')
  @RequirePermissions(Permission.UPDATE_TEAMS)
  @ApiOperation({ summary: '팀 정보 업데이트' })
  @ApiResponse({ status: 200, description: '팀 업데이트 성공' })
  @ApiResponse({ status: 404, description: '팀을 찾을 수 없음' })
  async update(
    @Param('id') id: string,
    @Body() updateTeamDto: UpdateTeamDto
  ): Promise<{
    data: import('/home/kmjkds/equipment_management_system/packages/schemas/src/team').Team;
    meta: { timestamp: string };
  }> {
    const team = await this.teamsService.update(id, updateTeamDto);

    if (!team) {
      throw new NotFoundException({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: '업데이트할 팀을 찾을 수 없습니다.',
          details: { resourceId: id, resourceType: 'team' },
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    return {
      data: team,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(Permission.DELETE_TEAMS)
  @ApiOperation({ summary: '팀 삭제' })
  @ApiResponse({ status: 204, description: '팀 삭제 성공' })
  @ApiResponse({ status: 404, description: '팀을 찾을 수 없음' })
  async remove(@Param('id') id: string): Promise<void> {
    const deleted = await this.teamsService.remove(id);

    if (!deleted) {
      throw new NotFoundException({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: '삭제할 팀을 찾을 수 없습니다.',
          details: { resourceId: id, resourceType: 'team' },
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 204 응답은 본문이 없음
  }
}
