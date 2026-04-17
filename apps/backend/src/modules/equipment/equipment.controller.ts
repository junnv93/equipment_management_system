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
  UsePipes,
  ParseUUIDPipe,
  Req,
  BadRequestException,
  ForbiddenException,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FormDataParserInterceptor } from './interceptors/form-data-parser.interceptor';
import { AuthenticatedRequest, MulterFile } from '../../types/common.types';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { EquipmentService, type EquipmentListResponse } from './equipment.service';
import { EquipmentApprovalService } from './services/equipment-approval.service';
import { EquipmentAttachmentService } from './services/equipment-attachment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { UpdateStatusDto, UpdateStatusValidationPipe } from './dto/update-status.dto';
import { EquipmentQueryDto } from './dto/equipment-query.dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SiteScoped } from '../../common/decorators/site-scoped.decorator';
import { CurrentEnforcedScope } from '../../common/decorators/current-scope.decorator';
import type { EnforcedScope } from '../../common/scope/scope-enforcer';
import { InternalServiceOnly } from '../../common/decorators/internal-service-only.decorator';
import {
  Permission,
  EQUIPMENT_DATA_SCOPE,
  resolveDataScope,
} from '@equipment-management/shared-constants';
// 표준 상태값은 schemas 패키지에서 import (SSOT)
import { UserRoleValues, AttachmentTypeEnum } from '@equipment-management/schemas';
import {
  type UserRole,
  type DocumentType,
  type ApprovalStatus,
  ApprovalStatusEnum,
  ApprovalStatusValues,
} from '@equipment-management/schemas';
import { CreateEquipmentValidationPipe } from './dto/create-equipment.dto';
import { UpdateEquipmentValidationPipe } from './dto/update-equipment.dto';
import {
  CreateSharedEquipmentValidationPipe,
  type CreateSharedEquipmentDto,
} from './dto/create-shared-equipment.dto';
import { EquipmentQueryValidationPipe } from './dto/equipment-query.dto';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { extractUserId } from '../../common/utils/extract-user';
import { enforceSiteAccess } from '../../common/utils/enforce-site-access';
import { RejectRequestPipe, type RejectRequestDto } from './dto/reject-request.dto';
import { ApproveRequestBodyPipe, type ApproveRequestBodyDto } from './dto/approve-request-body.dto';
import { ParseManagementNumberPipe } from './dto/management-number-param.pipe';
import { Throttle } from '@nestjs/throttler';
import type {
  EquipmentCreateOrRequestResult,
  EquipmentDetailResult,
  EquipmentQRLandingResult,
  EquipmentRequestDetailResult,
} from './equipment.controller.types';
import { QRAccessService } from './services/qr-access.service';
import type { Equipment } from '@equipment-management/db/schema/equipment';
import type { EquipmentRequest } from '@equipment-management/db/schema/equipment-requests';
import { DocumentService } from '../../common/file-upload/document.service';

@ApiTags('장비 관리')
@ApiBearerAuth()
@Controller('equipment')
export class EquipmentController {
  constructor(
    private readonly equipmentService: EquipmentService,
    private readonly approvalService: EquipmentApprovalService,
    private readonly attachmentService: EquipmentAttachmentService,
    private readonly documentService: DocumentService,
    private readonly qrAccessService: QRAccessService
  ) {}

  @Post('shared')
  @ApiOperation({
    summary: '공용장비 등록',
    description: '공용장비를 등록합니다. isShared=true가 강제 설정됩니다.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: '공용장비 등록 성공' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @RequirePermissions(Permission.CREATE_EQUIPMENT)
  @AuditLog({
    action: 'create',
    entityType: 'equipment',
    entityIdPath: 'response.equipment.id',
    entityNamePath: 'body.name',
  })
  @UsePipes(CreateSharedEquipmentValidationPipe)
  async createShared(
    @Body() dto: CreateSharedEquipmentDto,
    @Req() req: AuthenticatedRequest
  ): Promise<{ equipment: Equipment }> {
    const userId = extractUserId(req);

    // 공용장비 강제 설정 — sharedSource 필수(Zod 검증됨), initialLocation 서비스 기본값
    const sharedDto: CreateEquipmentDto = {
      ...dto,
      isShared: true,
      approvalStatus: ApprovalStatusValues.APPROVED as ApprovalStatus,
      initialLocation: dto.location || (dto.site as string) || 'unknown',
    };

    const created = await this.equipmentService.create(sharedDto, userId);
    return { equipment: created };
  }

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
    @UploadedFiles() files: MulterFile[] | undefined,
    @Req() req: AuthenticatedRequest
  ): Promise<EquipmentCreateOrRequestResult> {
    const userRoles = req.user?.roles ?? [];
    const userId = req.user?.userId ?? '';
    const userSite = req.user?.site;
    const userTeamId = req.user?.teamId;
    const isLabManager = userRoles.includes(UserRoleValues.LAB_MANAGER);

    // 🔒 보안: lab_manager를 제외한 모든 역할은 자신의 사이트/팀 장비만 등록 가능
    // - test_engineer(시험실무자): 자기 팀만
    // - technical_manager(기술책임자): 자기 팀만
    // - lab_manager(시험소장): 제한 없음 (전체 시험소 관리)
    if (!isLabManager) {
      if (userSite && createEquipmentDto.site && createEquipmentDto.site !== userSite) {
        throw new ForbiddenException({
          code: 'EQUIPMENT_SITE_SCOPE_ONLY',
          message: `Can only register equipment for your own site (${userSite}).`,
        });
      }
      if (
        userTeamId &&
        createEquipmentDto.teamId &&
        String(createEquipmentDto.teamId) !== String(userTeamId)
      ) {
        throw new ForbiddenException({
          code: 'EQUIPMENT_TEAM_SCOPE_ONLY',
          message: 'Can only register equipment for your own team.',
        });
      }
    }

    // 파일 업로드 처리
    let attachmentUuids: string[] = [];
    if (files && files.length > 0) {
      const attachmentType = 'inspection_report'; // 신규 등록은 검수보고서
      const attachments = await this.attachmentService.createAttachments(files, attachmentType);
      attachmentUuids = attachments.map((a) => a.id);
    }

    // 시험소 관리자(lab_manager)는 자체 승인 가능 (UL-QP-18 Section 4)
    if (isLabManager) {
      // DTO에 approvalStatus가 없어도 자동으로 approved 처리
      const approvedDto = { ...createEquipmentDto, approvalStatus: ApprovalStatusValues.APPROVED };
      const created = await this.equipmentService.create(approvedDto, userId);
      // UL-QP-18-02 이력카드 "확인" 서명란 SSOT — 자체 승인 시에도 동일 경로로 기록
      await this.equipmentService.markApprovalMeta(created.id, userId);
      return created;
    }

    // 일반 사용자는 승인 요청 생성
    const request = await this.approvalService.createEquipmentRequest(
      createEquipmentDto,
      userId,
      attachmentUuids
    );
    return {
      message: '장비 등록 요청이 생성되었습니다.',
      requestUuid: request.id,
      request,
    };
  }

  @Get()
  @ApiOperation({ summary: '장비 목록 조회', description: '등록된 모든 장비의 목록을 조회합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '장비 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  @SiteScoped({ policy: EQUIPMENT_DATA_SCOPE, failLoud: true })
  @UsePipes(EquipmentQueryValidationPipe)
  findAll(
    @Query() query: EquipmentQueryDto,
    @CurrentEnforcedScope() scope: EnforcedScope
  ): Promise<EquipmentListResponse> {
    // failLoud: 인터셉터가 cross-site/cross-team 요청을 이미 403으로 거부.
    // 통과한 enforced scope 값을 query 필드에 바인딩해 기존 service 로직에 전달.
    query.site = scope.site as EquipmentQueryDto['site'];
    if (scope.teamId) query.teamId = scope.teamId;
    return this.equipmentService.findAll(query);
  }

  /**
   * 관리번호 중복 검사
   *
   * 장비 등록/수정 시 실시간으로 관리번호 중복 여부를 확인합니다.
   * excludeId 파라미터로 현재 수정 중인 장비를 제외할 수 있습니다.
   */
  @Get('check-management-number')
  @ApiOperation({
    summary: '관리번호 중복 검사',
    description:
      '입력된 관리번호가 이미 사용 중인지 확인합니다. 수정 시에는 excludeId로 현재 장비를 제외합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '중복 검사 결과',
    schema: {
      type: 'object',
      properties: {
        available: { type: 'boolean', description: '사용 가능 여부' },
        message: { type: 'string', description: '안내 메시지' },
        existingEquipment: {
          type: 'object',
          nullable: true,
          description: '중복된 장비 정보 (중복 시에만)',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            managementNumber: { type: 'string' },
          },
        },
      },
    },
  })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  async checkManagementNumber(
    @Query('managementNumber') managementNumber: string,
    @Query('excludeId') excludeId?: string
  ): Promise<{
    available: boolean;
    message: string;
    existingEquipment?: { id: string; name: string; managementNumber: string };
  }> {
    if (!managementNumber || managementNumber.trim() === '') {
      throw new BadRequestException({
        code: 'EQUIPMENT_MANAGEMENT_NUMBER_REQUIRED',
        message: 'Management number is required.',
      });
    }

    return this.equipmentService.checkManagementNumberAvailability(
      managementNumber.trim(),
      excludeId
    );
  }

  /**
   * 관리번호 기반 장비 단건 조회 (QR 모바일 랜딩 진입점 전용).
   *
   * - 경로: `GET /equipment/by-management-number/:mgmt`
   * - 응답 shape: `EquipmentDetailResult` (UUID 조회와 동일)
   * - 권한: `VIEW_EQUIPMENT`
   * - 사이트 스코프: `enforceSiteAccess`로 교차 사이트 차단 (다른 사이트 장비 조회 시 ForbiddenException)
   * - Rate limit: 1분당 60회 (enumeration 방어; 정상 현장 스캔은 충분히 여유)
   *
   * 라우트 순서 주의: Nest Router가 `/:uuid`보다 먼저 매칭되도록
   * `@Get(':uuid')` 위쪽에 선언되어야 한다.
   */
  @Get('by-management-number/:mgmt')
  @Throttle({ long: { limit: 60, ttl: 60_000 } })
  @ApiOperation({
    summary: '관리번호로 장비 조회',
    description:
      'QR 모바일 랜딩 등 관리번호 기반 진입점에서 사용. 응답 shape은 UUID 기반 상세와 동일합니다.',
  })
  @ApiParam({
    name: 'mgmt',
    description: '관리번호 (예: SUW-E0001)',
    type: String,
  })
  @ApiResponse({ status: HttpStatus.OK, description: '장비 조회 성공' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 관리번호 형식' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '장비를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  @AuditLog({
    action: 'read',
    entityType: 'equipment',
    entityIdPath: 'response.id',
    entityNamePath: 'response.name',
  })
  async findByManagementNumber(
    @Param('mgmt', ParseManagementNumberPipe) managementNumber: string,
    @Req() req: AuthenticatedRequest
  ): Promise<EquipmentQRLandingResult> {
    // Cross-site 조회 허용 — QR 모바일 랜딩은 타 사이트 장비(대여/인수인계 중)에도
    // 제한된 액션으로 접근 가능해야 한다. 액션 레벨 제어는 QRAccessService가 담당.
    const equipmentWithTeam = await this.equipmentService.findByManagementNumber(
      managementNumber,
      true
    );

    const allowedActions = await this.qrAccessService.resolveAllowedActions(
      {
        id: equipmentWithTeam.id,
        site: equipmentWithTeam.site,
        status: equipmentWithTeam.status,
      },
      req.user
    );

    const { team, ...equipmentData } = equipmentWithTeam;
    return {
      ...equipmentData,
      teamName: team?.name || null,
      allowedActions,
    };
  }

  @Get(':uuid')
  @ApiOperation({ summary: '장비 상세 조회', description: '특정 장비의 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'uuid', description: '장비 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '장비 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '장비를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  async findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Req() req: AuthenticatedRequest
  ): Promise<EquipmentDetailResult> {
    // ✅ includeTeam=true로 팀 정보 포함 조회
    const equipmentWithTeam = await this.equipmentService.findOne(uuid, true);

    // SSOT: enforceSiteAccess로 단일 장비 접근 사이트/팀 체크
    enforceSiteAccess(req, equipmentWithTeam.site, EQUIPMENT_DATA_SCOPE, equipmentWithTeam.teamId);

    // ✅ 응답에 teamName 필드 추가 (프론트엔드에서 사용)
    const { team, ...equipmentData } = equipmentWithTeam;
    return {
      ...equipmentData,
      teamName: team?.name || null,
    };
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
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '동시 수정 충돌 (Version Conflict)' })
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
    @UploadedFiles() files: MulterFile[] | undefined,
    @Req() req: AuthenticatedRequest
  ): Promise<EquipmentCreateOrRequestResult> {
    const existingEquipment = await this.equipmentService.findOne(uuid);
    enforceSiteAccess(req, existingEquipment.site, EQUIPMENT_DATA_SCOPE, existingEquipment.teamId);

    // 공용장비 수정 차단
    if (existingEquipment.isShared) {
      throw new ForbiddenException({
        code: 'EQUIPMENT_SHARED_CANNOT_UPDATE',
        message: '공용장비는 수정할 수 없습니다.',
      });
    }

    const userRoles = req.user?.roles ?? [];
    const userId = req.user?.userId ?? '';
    const isAdmin = userRoles.includes(UserRoleValues.LAB_MANAGER);

    // 운영 책임자 역할/사이트 자격 사전 검증 (승인 워크플로우 분기 전 공통 적용)
    const hasManagerChange =
      updateEquipmentDto.managerId !== undefined ||
      updateEquipmentDto.deputyManagerId !== undefined;
    if (hasManagerChange) {
      await this.equipmentService.validateManagerEligibilityPublic(
        {
          managerId:
            updateEquipmentDto.managerId !== undefined
              ? updateEquipmentDto.managerId
              : existingEquipment.managerId,
          deputyManagerId:
            updateEquipmentDto.deputyManagerId !== undefined
              ? updateEquipmentDto.deputyManagerId
              : existingEquipment.deputyManagerId,
        },
        updateEquipmentDto.site ?? existingEquipment.site
      );
    }

    // 파일 업로드 처리
    let attachmentUuids: string[] = [];
    if (files && files.length > 0) {
      const attachmentType = 'history_card'; // 기존 수정은 이력카드
      const attachments = await this.attachmentService.createAttachments(files, attachmentType);
      attachmentUuids = attachments.map((a) => a.id);
    }

    // 시스템 관리자는 직접 승인 가능
    if (isAdmin && updateEquipmentDto.approvalStatus === ApprovalStatusEnum.enum.approved) {
      const updated = await this.equipmentService.update(uuid, updateEquipmentDto, userId);
      // UL-QP-18-02 이력카드 "확인" 서명란 SSOT — 관리자 직접 승인도 동일 경로
      await this.equipmentService.markApprovalMeta(uuid, userId);
      return updated;
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
      requestUuid: request.id,
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
    @Query('version') versionStr: string | undefined,
    @Req() req: AuthenticatedRequest
  ): Promise<{ message: string; requestUuid?: string }> {
    // 공용장비 삭제 차단
    const existingEquipment = await this.equipmentService.findOne(uuid);
    enforceSiteAccess(req, existingEquipment.site, EQUIPMENT_DATA_SCOPE, existingEquipment.teamId);
    if (existingEquipment.isShared) {
      throw new ForbiddenException({
        code: 'EQUIPMENT_SHARED_CANNOT_DELETE',
        message: '공용장비는 삭제할 수 없습니다.',
      });
    }

    const userRoles = req.user?.roles ?? [];
    const userId = req.user?.userId ?? '';
    const isAdmin = userRoles.includes(UserRoleValues.LAB_MANAGER);

    // 시스템 관리자는 직접 삭제 가능
    if (isAdmin) {
      const parsedVersion = versionStr !== undefined ? parseInt(versionStr, 10) : undefined;
      const effectiveVersion =
        parsedVersion !== undefined && !isNaN(parsedVersion)
          ? parsedVersion
          : existingEquipment.version;
      await this.equipmentService.remove(uuid, effectiveVersion);
      return { message: '장비가 삭제되었습니다.' };
    }

    // 시험실무자는 승인 요청 생성
    const request = await this.approvalService.deleteEquipmentRequest(uuid, userId);
    return {
      message: '장비 삭제 요청이 생성되었습니다.',
      requestUuid: request.id,
    };
  }

  @Patch(':uuid/status')
  @ApiOperation({ summary: '장비 상태 변경', description: '특정 장비의 상태를 변경합니다.' })
  @ApiParam({ name: 'uuid', description: '장비 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '장비 상태 변경 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '장비를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '동시 수정 충돌 (Version Conflict)' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.UPDATE_EQUIPMENT)
  @AuditLog({ action: 'update', entityType: 'equipment', entityIdPath: 'params.uuid' })
  @UsePipes(UpdateStatusValidationPipe)
  async updateStatus(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @Req() req: AuthenticatedRequest
  ): Promise<Equipment> {
    const existingEquipment = await this.equipmentService.findOne(uuid);
    enforceSiteAccess(req, existingEquipment.site, EQUIPMENT_DATA_SCOPE, existingEquipment.teamId);
    return this.equipmentService.updateStatus(
      uuid,
      updateStatusDto.status,
      updateStatusDto.version
    );
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
  async findByTeam(
    @Param('teamId') teamId: string,
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ): Promise<unknown> {
    const result = await this.equipmentService.findByTeam(
      teamId,
      page ? Number(page) : undefined,
      pageSize ? Number(pageSize) : undefined
    );

    // SSOT: EQUIPMENT_DATA_SCOPE 정책으로 역할별 in-memory 사이트 필터 적용
    const userRole = req.user?.roles?.[0] as UserRole | undefined;
    if (userRole) {
      const scope = resolveDataScope(
        { role: userRole, site: req.user?.site, teamId: req.user?.teamId },
        EQUIPMENT_DATA_SCOPE
      );
      if (scope.type === 'site' && scope.site) {
        const filteredItems = result.items.filter((e) => e.site === scope.site);
        return {
          items: filteredItems,
          meta: {
            ...result.meta,
            totalItems: filteredItems.length,
            itemCount: filteredItems.length,
          },
        };
      }
    }

    return result;
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
  async findCalibrationDue(
    @Query('days') days: number = 30,
    @Req() req: AuthenticatedRequest
  ): Promise<Equipment[]> {
    const equipmentList = await this.equipmentService.findCalibrationDue(days);

    // SSOT: EQUIPMENT_DATA_SCOPE 정책으로 역할별 in-memory 사이트 필터 적용
    const userRole = req.user?.roles?.[0] as UserRole | undefined;
    if (userRole) {
      const scope = resolveDataScope(
        { role: userRole, site: req.user?.site, teamId: req.user?.teamId },
        EQUIPMENT_DATA_SCOPE
      );
      if (scope.type === 'site' && scope.site) {
        return equipmentList.filter((e) => e.site === scope.site);
      }
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
  async findPendingRequests(@Req() req: AuthenticatedRequest): Promise<EquipmentRequest[]> {
    const userRoles = req.user?.roles || [];
    const userSite = req.user?.site;
    const userTeamId = req.user?.teamId;
    return this.approvalService.findPendingRequests(userRoles, userSite, userTeamId);
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
  async findRequestByUuid(
    @Param('requestUuid', ParseUUIDPipe) requestUuid: string
  ): Promise<EquipmentRequestDetailResult> {
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
  async approveRequest(
    @Param('requestUuid', ParseUUIDPipe) requestUuid: string,
    @Body(ApproveRequestBodyPipe) dto: ApproveRequestBodyDto,
    @Req() req: AuthenticatedRequest
  ): Promise<EquipmentRequest> {
    const userRoles = req.user?.roles ?? [];
    const userId = extractUserId(req);
    return this.approvalService.approveRequest(requestUuid, userId, userRoles, dto.version);
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
  @UsePipes(RejectRequestPipe)
  async rejectRequest(
    @Param('requestUuid', ParseUUIDPipe) requestUuid: string,
    @Body() dto: RejectRequestDto,
    @Req() req: AuthenticatedRequest
  ): Promise<EquipmentRequest> {
    const userRoles = req.user?.roles ?? [];
    const userId = extractUserId(req);
    return this.approvalService.rejectRequest(
      requestUuid,
      userId,
      dto.rejectionReason,
      userRoles,
      dto.version
    );
  }

  // ========== 파일 업로드 엔드포인트 ==========

  @Post('attachments') // @BodyPipeExempt: multipart/form-data (file upload, not JSON body)
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
        attachmentType: { type: 'string', enum: AttachmentTypeEnum.options },
        description: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: '파일이 업로드되었습니다.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 파일 형식 또는 크기 초과' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @RequirePermissions(Permission.CREATE_EQUIPMENT)
  @AuditLog({ action: 'upload', entityType: 'equipment' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: MulterFile,
    @Body('attachmentType') attachmentType: 'inspection_report' | 'history_card' | 'other',
    @Req() req: AuthenticatedRequest,
    @Body('equipmentId') equipmentId?: string,
    @Body('requestId') requestId?: string,
    @Body('description') description?: string
  ): Promise<{
    message: string;
    attachment: {
      id: string;
      fileName: string;
      originalFileName: string;
      fileSize: number;
      mimeType: string;
      attachmentType: 'inspection_report' | 'history_card' | 'other';
    };
  }> {
    if (!file) {
      throw new BadRequestException({
        code: 'EQUIPMENT_FILE_REQUIRED',
        message: 'File is required.',
      });
    }

    if (!attachmentType) {
      throw new BadRequestException({
        code: 'EQUIPMENT_ATTACHMENT_TYPE_REQUIRED',
        message: 'Attachment type is required.',
      });
    }

    const userId = extractUserId(req);
    const document = await this.documentService.createDocument(file, {
      documentType: attachmentType as DocumentType,
      equipmentId: equipmentId || undefined,
      requestId: requestId || undefined,
      description: description || undefined,
      uploadedBy: userId || undefined,
      subdirectory: 'equipment',
    });

    return {
      message: '파일이 업로드되었습니다.',
      attachment: {
        id: document.id,
        fileName: document.fileName,
        originalFileName: document.originalFileName,
        fileSize: Number(document.fileSize),
        mimeType: document.mimeType,
        attachmentType: document.documentType as 'inspection_report' | 'history_card' | 'other',
      },
    };
  }

  /**
   * 캐시 무효화 엔드포인트 (E2E 테스트용)
   *
   * ⚠️ IMPORTANT: This endpoint is for E2E test purposes only in development/test environments
   * It allows tests to invalidate the backend cache after direct database modifications
   *
   * ⚠️ SECURITY: This endpoint should be disabled in production or protected by environment check
   *
   * Usage: POST /api/equipment/cache/invalidate
   */
  @Post('cache/invalidate')
  @HttpCode(HttpStatus.OK)
  @InternalServiceOnly()
  @ApiOperation({
    summary: '장비 캐시 무효화 (E2E 테스트 / 내부 서비스용)',
    description:
      'E2E 테스트 또는 내부 서비스에서 캐시를 무효화합니다. X-Internal-Api-Key 헤더 필요.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '캐시가 무효화되었습니다.' })
  async invalidateCache(): Promise<{ message: string; timestamp: string }> {
    await this.equipmentService.invalidateCachePublic();
    return {
      message: '장비 캐시가 무효화되었습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}
