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
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/interfaces/user-role.enum';
import { UpdateStatusDto } from './dto/update-status.dto';

@ApiTags('장비')
@Controller('equipment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @ApiOperation({ summary: '장비 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'serialNumber', required: false, type: String })
  @ApiResponse({ status: 200, description: '장비 목록 조회 성공' })
  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('name') name?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('serialNumber') serialNumber?: string,
  ) {
    const filters = {};
    if (name) filters['name'] = name;
    if (type) filters['type'] = type;
    if (category) filters['category'] = category;
    if (status) filters['status'] = status;
    if (serialNumber) filters['serialNumber'] = serialNumber;

    return this.equipmentService.findAll(+page, +limit, filters);
  }

  @ApiOperation({ summary: '장비 상세 정보 조회' })
  @ApiParam({ name: 'id', description: '장비 ID' })
  @ApiResponse({ status: 200, description: '장비 상세 정보 조회 성공' })
  @ApiResponse({ status: 404, description: '장비를 찾을 수 없습니다' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.equipmentService.findById(+id);
  }

  @ApiOperation({ summary: '장비 생성' })
  @ApiResponse({ status: 201, description: '장비 생성 성공' })
  @ApiResponse({ status: 400, description: '유효하지 않은 데이터' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  create(@Body() createEquipmentDto: CreateEquipmentDto) {
    return this.equipmentService.create(createEquipmentDto);
  }

  @ApiOperation({ summary: '장비 정보 업데이트' })
  @ApiParam({ name: 'id', description: '장비 ID' })
  @ApiResponse({ status: 200, description: '장비 정보 업데이트 성공' })
  @ApiResponse({ status: 404, description: '장비를 찾을 수 없습니다' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEquipmentDto: UpdateEquipmentDto) {
    return this.equipmentService.update(+id, updateEquipmentDto);
  }

  @ApiOperation({ summary: '장비 상태 업데이트' })
  @ApiParam({ name: 'id', description: '장비 ID' })
  @ApiResponse({ status: 200, description: '장비 상태 업데이트 성공' })
  @ApiResponse({ status: 404, description: '장비를 찾을 수 없습니다' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto) {
    return this.equipmentService.updateStatus(+id, updateStatusDto.status);
  }

  @ApiOperation({ summary: '장비 삭제' })
  @ApiParam({ name: 'id', description: '장비 ID' })
  @ApiResponse({ status: 200, description: '장비 삭제 성공' })
  @ApiResponse({ status: 404, description: '장비를 찾을 수 없습니다' })
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.equipmentService.delete(+id);
  }
}
