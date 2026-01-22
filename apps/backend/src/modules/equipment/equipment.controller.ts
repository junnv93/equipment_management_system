import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  UsePipes,
  ParseUUIDPipe,
  Req,
  ForbiddenException,
  BadRequestException,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FormDataParserInterceptor } from './interceptors/form-data-parser.interceptor';

// Multer 타입 정의
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { EquipmentService } from './equipment.service';
import { EquipmentApprovalService } from './services/equipment-approval.service';
import { EquipmentAttachmentService } from './services/equipment-attachment.service';
import { FileUploadService } from './services/file-upload.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentQueryDto } from './dto/equipment-query.dto';
import { ApproveEquipmentRequestDto } from './dto/approve-equipment-request.dto';
import {
  CreateSharedEquipmentDto,
  CreateSharedEquipmentValidationPipe,
} from './dto/create-shared-equipment.dto';
import { RequirePermissions } from '../../decorators/require-permissions.decorator';
import { Permission } from '../auth/rbac/permissions.enum';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// 표준 상태값은 schemas 패키지에서 import
import { EquipmentStatus } from '@equipment-management/schemas';
import { CreateEquipmentValidationPipe } from './dto/create-equipment.dto';
import { UpdateEquipmentValidationPipe } from './dto/update-equipment.dto';
import { EquipmentQueryValidationPipe } from './dto/equipment-query.dto';
import { ApproveEquipmentRequestValidationPipe } from './dto/approve-equipment-request.dto';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@ApiTags('장비 관리')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('equipment')
export class EquipmentController {
  constructor(
    private readonly equipmentService: EquipmentService,
    private readonly approvalService: EquipmentApprovalService,
    private readonly fileUploadService: FileUploadService,
    private readonly attachmentService: EquipmentAttachmentService
  ) {}

  @Post()
  @ApiOperation({
    summary: '장비 등록 요청',
    description:
      '새로운 장비 등록을 요청합니다. 시험실무자는 승인 대기 상태로 생성되며, 시스템 관리자는 직접 승인 가능합니다.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        managementNumber: { type: 'string' },
        // ... 기타 필드
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: '장비 등록 요청이 생성되었습니다.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.CREATE_EQUIPMENT)
  @AuditLog({
    action: 'create',
    entityType: 'equipment',
    entityIdPath: 'response.requestUuid',
    entityNamePath: 'body.name',
  })
  @UseInterceptors(
    FilesInterceptor('files', 10), // 최대 10개 파일
    FormDataParserInterceptor // FormData JSON 파싱
  )
  @UsePipes(CreateEquipmentValidationPipe)
  async create(
    @Body() createEquipmentDto: CreateEquipmentDto,
    @UploadedFiles() files?: MulterFile[],
    @Req() req?: any
  ) {
    const userRoles = req?.user?.roles || [];
    const userId = req?.user?.userId || req?.user?.id;
    const isAdmin = userRoles.includes('lab_manager') || userRoles.includes('LAB_MANAGER');

    // 파일 업로드 처리
    let attachmentUuids: string[] = [];
    if (files && files.length > 0) {
      const attachmentType = 'inspection_report'; // 신규 등록은 검수보고서
      const attachments = await this.attachmentService.createAttachments(files, attachmentType);
      attachmentUuids = attachments.map((a) => a.uuid);
    }

    // 시스템 관리자는 직접 승인 가능
    if (isAdmin && createEquipmentDto.approvalStatus === 'approved') {
      return this.equipmentService.create(createEquipmentDto);
    }

    // 시험실무자는 승인 요청 생성
    const request = await this.approvalService.createEquipmentRequest(
      createEquipmentDto,
      userId,
      attachmentUuids
    );
    return {
      message: '장비 등록 요청이 생성되었습니다.',
      requestUuid: request.uuid,
      request,
    };
  }

  @Post('shared')
  @ApiOperation({
    summary: '공용장비 등록',
    description:
      '공용장비(Safety Lab 등)를 등록합니다. 최소 필수 정보만 요구하며, 교정성적서 파일 첨부를 지원합니다.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'managementNumber', 'sharedSource', 'site'],
      properties: {
        name: { type: 'string', description: '장비명' },
        managementNumber: { type: 'string', description: '관리번호' },
        sharedSource: {
          type: 'string',
          enum: ['safety_lab', 'external'],
          description: '공용장비 출처',
        },
        site: { type: 'string', enum: ['suwon', 'uiwang'], description: '사이트' },
        modelName: { type: 'string' },
        manufacturer: { type: 'string' },
        location: { type: 'string' },
        calibrationCycle: { type: 'number' },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: '교정성적서 파일',
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: '공용장비가 등록되었습니다.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.CREATE_EQUIPMENT)
  @UseInterceptors(FilesInterceptor('files', 10), FormDataParserInterceptor)
  @UsePipes(CreateSharedEquipmentValidationPipe)
  async createShared(
    @Body() createSharedEquipmentDto: CreateSharedEquipmentDto,
    @UploadedFiles() files?: MulterFile[]
  ) {
    // 파일 업로드 처리 (교정성적서)
    if (files && files.length > 0) {
      const attachmentType = 'inspection_report'; // 교정성적서
      await this.attachmentService.createAttachments(files, attachmentType);
    }

    const newEquipment = await this.equipmentService.createShared(createSharedEquipmentDto);
    return {
      message: '공용장비가 등록되었습니다.',
      equipment: newEquipment,
    };
  }

  @Get()
  @ApiOperation({ summary: '장비 목록 조회', description: '등록된 모든 장비의 목록을 조회합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '장비 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  @UsePipes(EquipmentQueryValidationPipe)
  findAll(@Query() query: EquipmentQueryDto, @Req() req: any) {
    // 시험실무자는 자신의 사이트 장비만 조회 가능
    // 기술책임자/관리자는 모든 사이트 조회 가능
    const userSite = req.user?.site;
    const userRoles = req.user?.roles || [];
    const isTestOperator = userRoles.includes('test_engineer');
    const canViewAllSites =
      userRoles.includes('technical_manager') || userRoles.includes('lab_manager');

    // 시험실무자이고 쿼리에 site가 없으면 자신의 사이트로 필터링
    const siteFilter = isTestOperator && !canViewAllSites && !query.site ? userSite : undefined;

    return this.equipmentService.findAll(query, siteFilter);
  }

  @Get(':uuid')
  @ApiOperation({ summary: '장비 상세 조회', description: '특정 장비의 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'uuid', description: '장비 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '장비 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '장비를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  async findOne(@Param('uuid', ParseUUIDPipe) uuid: string, @Req() req: any) {
    const equipment = await this.equipmentService.findOne(uuid);

    // 사이트별 권한 체크: 시험실무자는 자신의 사이트 장비만 조회 가능
    const userSite = req.user?.site;
    const userRoles = req.user?.roles || [];
    const isTestOperator = userRoles.includes('test_engineer');
    const canViewAllSites =
      userRoles.includes('technical_manager') || userRoles.includes('lab_manager');

    // 시험실무자이고 자신의 사이트가 아닌 장비를 조회하려는 경우 거부
    if (isTestOperator && !canViewAllSites && userSite && equipment.site !== userSite) {
      throw new ForbiddenException('다른 사이트의 장비를 조회할 권한이 없습니다.');
    }

    return equipment;
  }

  @Patch(':uuid')
  @ApiOperation({
    summary: '장비 정보 수정 요청',
    description:
      '특정 장비의 정보 수정을 요청합니다. 시험실무자는 승인 대기 상태로 생성되며, 시스템 관리자는 직접 승인 가능합니다.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'uuid', description: '장비 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '장비 정보 수정 요청이 생성되었습니다.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '장비를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.UPDATE_EQUIPMENT)
  @AuditLog({
    action: 'update',
    entityType: 'equipment',
    entityIdPath: 'params.uuid',
    entityNamePath: 'body.name',
    trackPreviousValue: true,
  })
  @UseInterceptors(
    FilesInterceptor('files', 10),
    FormDataParserInterceptor // FormData JSON 파싱
  )
  @UsePipes(UpdateEquipmentValidationPipe)
  async update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateEquipmentDto: UpdateEquipmentDto,
    @UploadedFiles() files?: MulterFile[],
    @Req() req?: any
  ) {
    // 공용장비 수정 차단
    const existingEquipment = await this.equipmentService.findOne(uuid);
    if (existingEquipment.isShared) {
      throw new ForbiddenException('공용장비는 수정할 수 없습니다.');
    }

    const userRoles = req?.user?.roles || [];
    const userId = req?.user?.userId || req?.user?.id;
    const isAdmin = userRoles.includes('lab_manager') || userRoles.includes('LAB_MANAGER');

    // 파일 업로드 처리
    let attachmentUuids: string[] = [];
    if (files && files.length > 0) {
      const attachmentType = 'history_card'; // 기존 수정은 이력카드
      const attachments = await this.attachmentService.createAttachments(files, attachmentType);
      attachmentUuids = attachments.map((a) => a.uuid);
    }

    // 시스템 관리자는 직접 승인 가능
    if (isAdmin && updateEquipmentDto.approvalStatus === 'approved') {
      return this.equipmentService.update(uuid, updateEquipmentDto);
    }

    // 시험실무자는 승인 요청 생성
    const request = await this.approvalService.updateEquipmentRequest(
      uuid,
      updateEquipmentDto,
      userId,
      attachmentUuids
    );
    return {
      message: '장비 수정 요청이 생성되었습니다.',
      requestUuid: request.uuid,
      request,
    };
  }

  @Delete(':uuid')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: '장비 삭제 요청',
    description:
      '특정 장비 삭제를 요청합니다. 시험실무자는 승인 대기 상태로 생성되며, 시스템 관리자는 직접 삭제 가능합니다.',
  })
  @ApiParam({ name: 'uuid', description: '장비 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.ACCEPTED, description: '장비 삭제 요청이 생성되었습니다.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '장비를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.DELETE_EQUIPMENT)
  @AuditLog({
    action: 'delete',
    entityType: 'equipment',
    entityIdPath: 'params.uuid',
  })
  async remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Req() req?: any
  ): Promise<{ message: string; requestUuid?: string }> {
    // 공용장비 삭제 차단
    const existingEquipment = await this.equipmentService.findOne(uuid);
    if (existingEquipment.isShared) {
      throw new ForbiddenException('공용장비는 삭제할 수 없습니다.');
    }

    const userRoles = req?.user?.roles || [];
    const userId = req?.user?.userId || req?.user?.id;
    const isAdmin = userRoles.includes('lab_manager') || userRoles.includes('LAB_MANAGER');

    // 시스템 관리자는 직접 삭제 가능
    if (isAdmin) {
      await this.equipmentService.remove(uuid);
      return { message: '장비가 삭제되었습니다.' };
    }

    // 시험실무자는 승인 요청 생성
    const request = await this.approvalService.deleteEquipmentRequest(uuid, userId);
    return {
      message: '장비 삭제 요청이 생성되었습니다.',
      requestUuid: request.uuid,
    };
  }

  @Patch(':uuid/status')
  @ApiOperation({ summary: '장비 상태 변경', description: '특정 장비의 상태를 변경합니다.' })
  @ApiParam({ name: 'uuid', description: '장비 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '장비 상태 변경 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '장비를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.UPDATE_EQUIPMENT)
  updateStatus(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body('status') status: EquipmentStatus
  ) {
    return this.equipmentService.updateStatus(uuid, status);
  }

  @Get('team/:teamId')
  @ApiOperation({
    summary: '팀별 장비 목록 조회',
    description: '특정 팀에 할당된 장비 목록을 조회합니다.',
  })
  @ApiParam({ name: 'teamId', description: '팀 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '팀별 장비 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  async findByTeam(@Param('teamId') teamId: string, @Req() req: any) {
    const equipmentList = await this.equipmentService.findByTeam(teamId);

    // 사이트별 권한 체크: 시험실무자는 자신의 사이트 장비만 조회 가능
    const userSite = req.user?.site;
    const userRoles = req.user?.roles || [];
    const isTestOperator = userRoles.includes('test_engineer');
    const canViewAllSites =
      userRoles.includes('technical_manager') || userRoles.includes('lab_manager');

    // 시험실무자이고 모든 사이트 조회 권한이 없는 경우 필터링
    if (isTestOperator && !canViewAllSites && userSite) {
      return equipmentList.filter((equipment) => equipment.site === userSite);
    }

    return equipmentList;
  }

  @Get('calibration/due')
  @ApiOperation({
    summary: '교정 예정 장비 조회',
    description: '특정 기간 내에 교정이 예정된 장비를 조회합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 예정 장비 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  async findCalibrationDue(@Query('days') days: number = 30, @Req() req: any) {
    const equipmentList = await this.equipmentService.findCalibrationDue(days);

    // 사이트별 권한 체크: 시험실무자는 자신의 사이트 장비만 조회 가능
    const userSite = req.user?.site;
    const userRoles = req.user?.roles || [];
    const isTestOperator = userRoles.includes('test_engineer');
    const canViewAllSites =
      userRoles.includes('technical_manager') || userRoles.includes('lab_manager');

    // 시험실무자이고 모든 사이트 조회 권한이 없는 경우 필터링
    if (isTestOperator && !canViewAllSites && userSite) {
      return equipmentList.filter((equipment) => equipment.site === userSite);
    }

    return equipmentList;
  }

  // ========== 승인 프로세스 엔드포인트 ==========

  @Get('requests/pending')
  @ApiOperation({
    summary: '승인 대기 요청 목록 조회',
    description: '승인 대기 중인 장비 등록/수정/삭제 요청 목록을 조회합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '승인 대기 요청 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_EQUIPMENT_REQUESTS)
  async findPendingRequests(@Req() req: any) {
    const userRoles = req.user?.roles || [];
    const userSite = req.user?.site;
    return this.approvalService.findPendingRequests(userRoles, userSite);
  }

  @Get('requests/:requestUuid')
  @ApiOperation({
    summary: '요청 상세 조회',
    description: '특정 장비 요청의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'requestUuid', description: '요청 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '요청 상세 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '요청을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_EQUIPMENT_REQUESTS)
  async findRequestByUuid(@Param('requestUuid', ParseUUIDPipe) requestUuid: string) {
    return this.approvalService.findRequestByUuid(requestUuid);
  }

  @Post('requests/:requestUuid/approve')
  @ApiOperation({
    summary: '요청 승인',
    description: '장비 등록/수정/삭제 요청을 승인합니다.',
  })
  @ApiParam({ name: 'requestUuid', description: '요청 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '요청이 승인되었습니다.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.APPROVE_EQUIPMENT)
  @AuditLog({
    action: 'approve',
    entityType: 'equipment',
    entityIdPath: 'params.requestUuid',
  })
  async approveRequest(@Param('requestUuid', ParseUUIDPipe) requestUuid: string, @Req() req: any) {
    const userRoles = req.user?.roles || [];
    const userId = req.user?.userId || req.user?.id;
    return this.approvalService.approveRequest(requestUuid, userId, userRoles);
  }

  @Post('requests/:requestUuid/reject')
  @ApiOperation({
    summary: '요청 반려',
    description: '장비 등록/수정/삭제 요청을 반려합니다. 반려 사유는 필수입니다.',
  })
  @ApiParam({ name: 'requestUuid', description: '요청 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '요청이 반려되었습니다.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 (반려 사유 누락 등)' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.REJECT_EQUIPMENT)
  @AuditLog({
    action: 'reject',
    entityType: 'equipment',
    entityIdPath: 'params.requestUuid',
  })
  // ⚠️ ApproveEquipmentRequestValidationPipe 제거 - requestId와 action은 URL/엔드포인트에서 이미 결정됨
  // rejectionReason만 body에서 수동 검증
  async rejectRequest(
    @Param('requestUuid', ParseUUIDPipe) requestUuid: string,
    @Body() body: { rejectionReason?: string },
    @Req() req: any
  ) {
    const userRoles = req.user?.roles || [];
    const userId = req.user?.userId || req.user?.id;

    if (!body.rejectionReason) {
      throw new BadRequestException('반려 사유는 필수입니다.');
    }

    return this.approvalService.rejectRequest(requestUuid, userId, body.rejectionReason, userRoles);
  }

  // ========== 파일 업로드 엔드포인트 ==========

  @Post('attachments')
  @ApiOperation({
    summary: '파일 업로드',
    description: '장비 관련 파일(이력카드, 검수보고서 등)을 업로드합니다.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        attachmentType: { type: 'string', enum: ['inspection_report', 'history_card', 'other'] },
        description: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: '파일이 업로드되었습니다.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 파일 형식 또는 크기 초과' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @RequirePermissions(Permission.CREATE_EQUIPMENT)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: MulterFile,
    @Body('attachmentType') attachmentType: 'inspection_report' | 'history_card' | 'other',
    @Body('description') description?: string
  ) {
    if (!file) {
      throw new BadRequestException('파일이 필요합니다.');
    }

    if (!attachmentType) {
      throw new BadRequestException('첨부 파일 타입이 필요합니다.');
    }

    const attachment = await this.attachmentService.createAttachment(
      file,
      attachmentType,
      undefined, // equipmentId는 나중에 연결
      undefined, // requestId는 나중에 연결
      description
    );

    return {
      message: '파일이 업로드되었습니다.',
      attachment: {
        uuid: attachment.uuid,
        fileName: attachment.fileName,
        originalFileName: attachment.originalFileName,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        attachmentType: attachment.attachmentType,
      },
    };
  }
}
