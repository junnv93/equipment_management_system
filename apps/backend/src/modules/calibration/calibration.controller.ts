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
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  UsePipes,
  Request,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MULTER_UTF8_OPTIONS } from '../../common/file-upload/file-upload.module';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CalibrationService } from './calibration.service';
import {
  CreateCalibrationDto,
  CreateCalibrationValidationPipe,
} from './dto/create-calibration.dto';
import {
  UpdateCalibrationDto,
  UpdateCalibrationValidationPipe,
} from './dto/update-calibration.dto';
import { CalibrationQueryDto, CalibrationQueryValidationPipe } from './dto/calibration-query.dto';
import {
  ApproveCalibrationDto,
  RejectCalibrationDto,
  ApproveCalibrationValidationPipe,
  RejectCalibrationValidationPipe,
} from './dto/approve-calibration.dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import {
  CALIBRATION_THRESHOLDS,
  Permission,
  CALIBRATION_DATA_SCOPE,
} from '@equipment-management/shared-constants';
import {
  SiteEnum,
  IntermediateCheckStatusEnum,
  type CalibrationRegisteredByRole,
  type IntermediateCheckStatus,
} from '@equipment-management/schemas';
import { SiteScoped } from '../../common/decorators/site-scoped.decorator';
import { FileUploadService } from '../../common/file-upload/file-upload.service';
import { DocumentService } from '../../common/file-upload/document.service';
import { DOCUMENT_TYPE_VALUES, type DocumentType } from '@equipment-management/schemas';
import type { DocumentRecord } from '@equipment-management/db/schema/documents';
import type { MulterFile } from '../../types/common.types';
import type { AuthenticatedRequest } from '../../types/auth';
import type { CalibrationRecord } from './calibration.service';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { extractUserId } from '../../common/utils/extract-user';
import { enforceSiteAccess } from '../../common/utils/enforce-site-access';
import {
  UpdateCalibrationStatusPipe,
  type UpdateCalibrationStatusDto,
} from './dto/update-calibration-status.dto';
import {
  CompleteIntermediateCheckPipe,
  type CompleteIntermediateCheckDto,
} from './dto/complete-intermediate-check.dto';
import {
  PendingApprovalsQueryDto,
  PendingApprovalsQueryPipe,
} from '../../common/dto/pending-approvals-query.dto';

@ApiTags('교정 관리')
@ApiBearerAuth()
@Controller('calibration')
export class CalibrationController {
  private readonly logger = new Logger(CalibrationController.name);

  constructor(
    private readonly calibrationService: CalibrationService,
    private readonly fileUploadService: FileUploadService,
    private readonly documentService: DocumentService
  ) {}

  /** 크로스사이트/크로스팀 접근 제어 — calibrations → equipment 경유 */
  private async enforceCalibrationAccess(uuid: string, req: AuthenticatedRequest): Promise<void> {
    const { site, teamId } = await this.calibrationService.getCalibrationSiteAndTeam(uuid);
    enforceSiteAccess(req, site, CALIBRATION_DATA_SCOPE, teamId);
  }

  @Post()
  @ApiOperation({ summary: '교정 일정 등록', description: '새로운 교정 일정을 등록합니다.' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '교정 일정이 성공적으로 등록되었습니다.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.CREATE_CALIBRATION)
  @AuditLog({ action: 'create', entityType: 'calibration', entityIdPath: 'response.id' })
  @UsePipes(CreateCalibrationValidationPipe)
  create(
    @Body() createCalibrationDto: CreateCalibrationDto,
    @Request() req: AuthenticatedRequest
  ): Promise<CalibrationRecord> {
    // ✅ 보안: registeredBy와 registeredByRole을 JWT 세션에서 추출 (Rule 2)
    const registeredBy = extractUserId(req);
    // roles는 배열이므로 첫 번째 역할을 사용 (일반적으로 사용자는 하나의 역할만 가짐)
    const registeredByRole = req.user?.roles?.[0] as CalibrationRegisteredByRole | undefined;

    return this.calibrationService.create({
      ...createCalibrationDto,
      // 서버에서 강제로 주입 (클라이언트 값 무시)
      registeredBy,
      registeredByRole,
    });
  }

  @Get()
  @ApiOperation({
    summary: '교정 일정 목록 조회',
    description: '등록된 모든 교정 일정의 목록을 조회합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 일정 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  @SiteScoped({ policy: CALIBRATION_DATA_SCOPE })
  findAll(@Query(CalibrationQueryValidationPipe) query: CalibrationQueryDto): Promise<{
    items: CalibrationRecord[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    return this.calibrationService.findAll(query);
  }

  @Get('pending')
  @ApiOperation({
    summary: '승인 대기 교정 목록 조회',
    description: '승인 대기 상태인 교정 일정을 조회합니다. 사이트/팀 스코프가 자동 적용됩니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '승인 대기 교정 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATION_REQUESTS)
  @SiteScoped({ policy: CALIBRATION_DATA_SCOPE })
  findPendingApprovals(
    @Query(PendingApprovalsQueryPipe) query: PendingApprovalsQueryDto
  ): ReturnType<CalibrationService['findPendingApprovals']> {
    return this.calibrationService.findPendingApprovals(1, 20, query.site, query.teamId);
  }

  @Get('intermediate-checks')
  @ApiOperation({
    summary: '중간점검 예정 조회',
    description: '지정된 일수 내에 중간점검이 예정된 교정 목록을 조회합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '중간점검 예정 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  findUpcomingIntermediateChecks(
    @Query(
      'days',
      new DefaultValuePipe(CALIBRATION_THRESHOLDS.INTERMEDIATE_CHECK_UPCOMING_DAYS),
      ParseIntPipe
    )
    days: number
  ): Promise<CalibrationRecord[]> {
    return this.calibrationService.findUpcomingIntermediateChecks(days);
  }

  @Get('intermediate-checks/all')
  @ApiOperation({
    summary: '전체 중간점검 목록 조회',
    description: '모든 중간점검 일정을 조회합니다 (지연/예정 포함).',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '중간점검 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  @ApiQuery({
    name: 'status',
    required: false,
    enum: IntermediateCheckStatusEnum.options,
    description: '중간점검 상태 필터',
  })
  @ApiQuery({ name: 'site', required: false, enum: SiteEnum.options, description: '사이트 필터' })
  findAllIntermediateChecks(
    @Query('status') status?: string,
    @Query('equipmentId') equipmentId?: string,
    @Query('managerId') managerId?: string,
    @Query('teamId') teamId?: string,
    @Query('site') site?: string
  ): ReturnType<CalibrationService['findAllIntermediateChecks']> {
    // status 파라미터 유효성 검증
    let validatedStatus: IntermediateCheckStatus | undefined;
    if (status) {
      const parsed = IntermediateCheckStatusEnum.safeParse(status);
      if (!parsed.success) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: `Invalid status value: ${status}. Allowed values: ${IntermediateCheckStatusEnum.options.join(', ')}`,
        });
      }
      validatedStatus = parsed.data;
    }

    return this.calibrationService.findAllIntermediateChecks({
      status: validatedStatus,
      equipmentId,
      managerId,
      teamId,
      site,
    });
  }

  @Post(':uuid/intermediate-check/complete')
  @ApiOperation({
    summary: '중간점검 완료 처리',
    description: '특정 교정의 중간점검을 완료 처리하고 관련 알림을 해제합니다.',
  })
  @ApiParam({ name: 'uuid', description: '교정 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '중간점검 완료 처리 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정 일정을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '중간점검이 예정되지 않은 교정' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  @AuditLog({ action: 'update', entityType: 'calibration', entityIdPath: 'params.uuid' })
  async completeIntermediateCheck(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body(CompleteIntermediateCheckPipe) dto: CompleteIntermediateCheckDto,
    @Request() req: AuthenticatedRequest
  ): Promise<{ calibration: CalibrationRecord; message: string }> {
    await this.enforceCalibrationAccess(uuid, req);
    // ✅ 보안: completedBy를 JWT 세션에서 추출 (Rule 2)
    const completedBy = extractUserId(req);
    return this.calibrationService.completeIntermediateCheck(
      uuid,
      completedBy,
      dto.version,
      dto.notes
    );
  }

  @Get('equipment/:equipmentId')
  @ApiOperation({
    summary: '장비별 교정 기록 조회',
    description: '특정 장비의 모든 교정 기록을 조회합니다.',
  })
  @ApiParam({ name: 'equipmentId', description: '장비 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '장비별 교정 기록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  findByEquipment(@Param('equipmentId') equipmentId: string): Promise<{
    items: CalibrationRecord[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    return this.calibrationService.findByEquipment(equipmentId);
  }

  @Get('due')
  @ApiOperation({
    summary: '교정 예정 일정 조회',
    description: '특정 일수 내에 교정이 예정된 장비의 교정 일정을 조회합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 예정 일정 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  findDueCalibrations(
    @Query('days', new DefaultValuePipe(CALIBRATION_THRESHOLDS.WARNING_DAYS), ParseIntPipe)
    days: number
  ): Promise<{
    items: CalibrationRecord[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    return this.calibrationService.findDueCalibrations(days);
  }

  @Get('manager/:managerId')
  @ApiOperation({
    summary: '담당자별 교정 일정 조회',
    description: '특정 담당자가 담당하는 교정 일정을 조회합니다.',
  })
  @ApiParam({ name: 'managerId', description: '담당자 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '담당자별 교정 일정 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  findByManager(@Param('managerId') managerId: string): Promise<{
    items: CalibrationRecord[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    return this.calibrationService.findByManager(managerId);
  }

  @Get('scheduled')
  @ApiOperation({
    summary: '예정된 교정 일정 조회',
    description: '특정 기간에 예정된 교정 일정을 조회합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '예정된 교정 일정 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  findScheduled(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string
  ): Promise<{
    items: CalibrationRecord[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    const fromDateObj = fromDate ? new Date(fromDate) : new Date();
    if (isNaN(fromDateObj.getTime())) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: `Invalid fromDate value: ${fromDate}. Must be a valid ISO date string.`,
      });
    }

    let toDateObj: Date;
    if (toDate) {
      toDateObj = new Date(toDate);
      if (isNaN(toDateObj.getTime())) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: `Invalid toDate value: ${toDate}. Must be a valid ISO date string.`,
        });
      }
    } else {
      toDateObj = new Date(fromDateObj);
      toDateObj.setMonth(toDateObj.getMonth() + 3);
    }

    return this.calibrationService.findScheduled(fromDateObj, toDateObj);
  }

  @Get('summary')
  @ApiOperation({ summary: '교정 요약 통계 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '통계 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  @ApiQuery({ name: 'site', required: false, enum: SiteEnum.options, description: '사이트 필터' })
  getSummary(
    @Query('teamId') teamId?: string,
    @Query('site') site?: string
  ): Promise<{ total: number; overdueCount: number; dueInMonthCount: number }> {
    return this.calibrationService.getSummary(teamId, site);
  }

  @Get('overdue')
  @ApiOperation({ summary: '교정 기한 초과 장비 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '기한 초과 장비 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  @ApiQuery({ name: 'site', required: false, enum: SiteEnum.options, description: '사이트 필터' })
  getOverdueCalibrations(
    @Query('teamId') teamId?: string,
    @Query('site') site?: string
  ): Promise<
    {
      id: string;
      equipmentId: string;
      equipmentName: string;
      managementNumber: string;
      calibrationDate: string;
      nextCalibrationDate: string;
      team: string | undefined;
      teamId: string | undefined;
      calibrationAgency: string;
    }[]
  > {
    return this.calibrationService.getOverdueCalibrations(teamId, site);
  }

  @Get('upcoming')
  @ApiOperation({ summary: '교정 예정 장비 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 예정 장비 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  @ApiQuery({ name: 'site', required: false, enum: SiteEnum.options, description: '사이트 필터' })
  getUpcomingCalibrations(
    @Query('days', new DefaultValuePipe(CALIBRATION_THRESHOLDS.WARNING_DAYS), ParseIntPipe)
    days: number,
    @Query('teamId') teamId?: string,
    @Query('site') site?: string
  ): Promise<
    {
      id: string;
      equipmentId: string;
      equipmentName: string;
      managementNumber: string;
      calibrationDate: string;
      nextCalibrationDate: string;
      team: string | undefined;
      teamId: string | undefined;
      calibrationAgency: string;
    }[]
  > {
    return this.calibrationService.getUpcomingCalibrations(days, teamId, site);
  }

  @Get(':uuid')
  @ApiOperation({
    summary: '교정 상세 조회',
    description: '특정 교정 일정의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'uuid', description: '교정 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 상세 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정 일정을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  findOne(@Param('uuid', ParseUUIDPipe) uuid: string): Promise<CalibrationRecord> {
    return this.calibrationService.findOne(uuid);
  }

  /** @deprecated POST /:uuid/documents 사용 권장 */
  @Post(':uuid/certificate')
  @ApiOperation({
    summary: '교정성적서 파일 업로드 (DEPRECATED)',
    description:
      'DEPRECATED: POST /:uuid/documents를 사용하세요. 이 엔드포인트는 하위 호환을 위해 유지됩니다.',
    deprecated: true,
  })
  @ApiParam({ name: 'uuid', description: '교정 ID (UUID)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '교정성적서 파일 (PDF, JPG, PNG)',
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: '파일 업로드 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정 일정을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 파일 형식' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @ApiQuery({
    name: 'version',
    required: true,
    type: Number,
    description: 'CAS version for optimistic locking',
  })
  @UseInterceptors(FileInterceptor('file', MULTER_UTF8_OPTIONS))
  @RequirePermissions(Permission.CREATE_CALIBRATION)
  @AuditLog({ action: 'update', entityType: 'calibration', entityIdPath: 'params.uuid' })
  async uploadCertificate(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @UploadedFile() file: MulterFile,
    @Query('version', ParseIntPipe) version: number,
    @Request() req: AuthenticatedRequest
  ): Promise<{
    filePath: string;
    fileName: string;
    originalFileName: string;
    fileSize: number;
    message: string;
  }> {
    await this.enforceCalibrationAccess(uuid, req);
    // 교정 존재 여부 확인
    await this.calibrationService.findOne(uuid);

    if (!file) {
      throw new BadRequestException({
        code: 'CALIBRATION_FILE_REQUIRED',
        message: 'No file was uploaded.',
      });
    }

    // 파일 저장 (calibration/[uuid] 디렉토리에 저장)
    const savedFile = await this.fileUploadService.saveFile(file, `calibration/${uuid}`);

    // 교정 정보에 파일 경로 업데이트 (CAS 보호)
    await this.calibrationService.update(uuid, {
      certificatePath: savedFile.filePath,
      version,
    } as UpdateCalibrationDto);

    // Dual-write: documents 테이블에도 기록 (신규 시스템 호환)
    const userId = extractUserId(req);
    try {
      await this.documentService.createDocument(file, {
        documentType: 'calibration_certificate' satisfies DocumentType,
        calibrationId: uuid,
        uploadedBy: userId || undefined,
        subdirectory: `calibration/${uuid}`,
      });
    } catch (error) {
      this.logger.warn(`Dual-write to documents table failed for calibration ${uuid}`, error);
    }

    this.logger.warn(
      `Deprecated endpoint called: POST /calibration/${uuid}/certificate. Use POST /calibration/${uuid}/documents instead.`
    );

    return {
      filePath: savedFile.filePath,
      fileName: savedFile.fileName,
      originalFileName: savedFile.originalFileName,
      fileSize: savedFile.fileSize,
      message: '교정성적서 파일이 업로드되었습니다.',
    };
  }

  // ============================================================================
  // 교정 문서 관리 (통합 documents 테이블)
  // ============================================================================

  @Post(':uuid/documents')
  @ApiOperation({
    summary: '교정 문서 업로드 (복수)',
    description: '교정성적서, 원시 데이터 등 복수 파일을 업로드합니다.',
  })
  @ApiParam({ name: 'uuid', description: '교정 ID (UUID)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10, MULTER_UTF8_OPTIONS))
  @RequirePermissions(Permission.CREATE_CALIBRATION)
  @AuditLog({ action: 'upload', entityType: 'calibration', entityIdPath: 'params.uuid' })
  async uploadDocuments(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @UploadedFiles() files: MulterFile[],
    @Body('documentTypes') documentTypesRaw: string,
    @Body('descriptions') descriptionsRaw: string | undefined,
    @Request() req: AuthenticatedRequest
  ): Promise<{ documents: DocumentRecord[]; message: string }> {
    await this.enforceCalibrationAccess(uuid, req);
    await this.calibrationService.findOne(uuid);

    if (!files || files.length === 0) {
      throw new BadRequestException({
        code: 'CALIBRATION_FILE_REQUIRED',
        message: 'No files were uploaded.',
      });
    }

    // documentTypes는 JSON 배열 또는 쉼표 구분 문자열
    let documentTypes: DocumentType[];
    try {
      documentTypes = JSON.parse(documentTypesRaw) as DocumentType[];
    } catch {
      documentTypes = documentTypesRaw.split(',').map((t) => t.trim()) as DocumentType[];
    }

    // SSOT 기반 documentType 런타임 검증 (as 캐스트만으로는 런타임 보호 불가)
    const invalidTypes = documentTypes.filter((t) => !DOCUMENT_TYPE_VALUES.includes(t));
    if (invalidTypes.length > 0) {
      throw new BadRequestException({
        code: 'DOCUMENT_TYPE_INVALID',
        message: `Invalid documentType: ${invalidTypes.join(', ')}. Allowed: ${DOCUMENT_TYPE_VALUES.join(', ')}`,
      });
    }

    // 파일 수와 documentTypes 수 불일치 → 400 에러 (사일런트 폴백 방지)
    if (documentTypes.length !== files.length) {
      throw new BadRequestException({
        code: 'DOCUMENT_TYPE_COUNT_MISMATCH',
        message: `File count (${files.length}) and documentTypes count (${documentTypes.length}) must match.`,
      });
    }

    let descriptions: (string | undefined)[] = [];
    if (descriptionsRaw) {
      try {
        descriptions = JSON.parse(descriptionsRaw) as string[];
      } catch {
        descriptions = descriptionsRaw.split(',').map((d) => d.trim());
      }
    }

    const userId = extractUserId(req);

    const options = files.map((_, i) => ({
      documentType: documentTypes[i],
      calibrationId: uuid,
      description: descriptions[i],
      uploadedBy: userId,
      subdirectory: `calibration/${uuid}`,
    }));

    const docs = await this.documentService.createDocuments(files, options);

    return {
      documents: docs,
      message: `${docs.length}개 문서가 업로드되었습니다.`,
    };
  }

  @Get(':uuid/documents')
  @ApiOperation({
    summary: '교정 문서 목록 조회',
    description: '특정 교정의 모든 문서(성적서, 원시데이터 등)를 조회합니다.',
  })
  @ApiParam({ name: 'uuid', description: '교정 ID (UUID)' })
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
  async getDocuments(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest,
    @Query('type') type?: string
  ): Promise<DocumentRecord[]> {
    await this.enforceCalibrationAccess(uuid, req);

    // SSOT 기반 documentType 검증 (documents.controller.ts와 동일 패턴)
    if (type && !(DOCUMENT_TYPE_VALUES as readonly string[]).includes(type)) {
      throw new BadRequestException({
        code: 'INVALID_DOCUMENT_TYPE',
        message: `Invalid document type: ${type}`,
      });
    }

    return this.documentService.findByCalibrationId(uuid, type as DocumentType | undefined);
  }

  @Patch(':uuid')
  @ApiOperation({ summary: '교정 정보 수정', description: '특정 교정 일정의 정보를 수정합니다.' })
  @ApiParam({ name: 'uuid', description: '교정 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 정보 수정 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정 일정을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  @AuditLog({ action: 'update', entityType: 'calibration', entityIdPath: 'params.uuid' })
  @UsePipes(UpdateCalibrationValidationPipe)
  async update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateCalibrationDto: UpdateCalibrationDto,
    @Request() req: AuthenticatedRequest
  ): Promise<CalibrationRecord> {
    await this.enforceCalibrationAccess(uuid, req);
    return this.calibrationService.update(uuid, updateCalibrationDto);
  }

  @Delete(':uuid')
  @ApiOperation({ summary: '교정 일정 삭제', description: '특정 교정 일정을 삭제합니다.' })
  @ApiParam({ name: 'uuid', description: '교정 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 일정 삭제 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정 일정을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.DELETE_CALIBRATION)
  @AuditLog({ action: 'delete', entityType: 'calibration', entityIdPath: 'params.uuid' })
  @ApiQuery({
    name: 'version',
    required: true,
    type: Number,
    description: 'CAS version for optimistic locking',
  })
  async remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Query('version', ParseIntPipe) version: number,
    @Request() req: AuthenticatedRequest
  ): Promise<{ id: string; deleted: boolean }> {
    await this.enforceCalibrationAccess(uuid, req);
    return this.calibrationService.remove(uuid, version);
  }

  @Patch(':uuid/status')
  @ApiOperation({ summary: '교정 상태 변경', description: '특정 교정 일정의 상태를 변경합니다.' })
  @ApiParam({ name: 'uuid', description: '교정 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 상태 변경 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정 일정을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  @AuditLog({ action: 'update', entityType: 'calibration', entityIdPath: 'params.uuid' })
  async updateStatus(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body(UpdateCalibrationStatusPipe) dto: UpdateCalibrationStatusDto,
    @Request() req: AuthenticatedRequest
  ): Promise<CalibrationRecord> {
    await this.enforceCalibrationAccess(uuid, req);
    return this.calibrationService.updateStatus(uuid, dto.status, dto.version);
  }

  @Patch(':uuid/complete')
  @ApiOperation({
    summary: '교정 완료 처리',
    description: '특정 교정 일정을 완료 처리하고 결과를 기록합니다.',
  })
  @ApiParam({ name: 'uuid', description: '교정 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 완료 처리 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정 일정을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터 또는 상태 오류' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  @AuditLog({ action: 'update', entityType: 'calibration', entityIdPath: 'params.uuid' })
  @UsePipes(UpdateCalibrationValidationPipe)
  async completeCalibration(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateCalibrationDto: UpdateCalibrationDto,
    @Request() req: AuthenticatedRequest
  ): Promise<CalibrationRecord> {
    await this.enforceCalibrationAccess(uuid, req);
    return this.calibrationService.completeCalibration(uuid, updateCalibrationDto);
  }

  @Patch(':uuid/approve')
  @ApiOperation({
    summary: '교정 승인',
    description: '기술책임자가 시험실무자가 등록한 교정을 승인합니다.',
  })
  @ApiParam({ name: 'uuid', description: '교정 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 승인 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정 일정을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터 또는 상태 오류' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.APPROVE_CALIBRATION)
  @AuditLog({ action: 'approve', entityType: 'calibration', entityIdPath: 'params.uuid' })
  @UsePipes(ApproveCalibrationValidationPipe)
  async approveCalibration(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() approveDto: ApproveCalibrationDto,
    @Request() req: AuthenticatedRequest
  ): Promise<CalibrationRecord> {
    await this.enforceCalibrationAccess(uuid, req);
    // ✅ 보안: approverId를 JWT 세션에서 추출 (checkout 패턴)
    const approverId = extractUserId(req);
    return this.calibrationService.approveCalibration(uuid, { ...approveDto, approverId });
  }

  @Patch(':uuid/reject')
  @ApiOperation({
    summary: '교정 반려',
    description: '기술책임자가 시험실무자가 등록한 교정을 반려합니다.',
  })
  @ApiParam({ name: 'uuid', description: '교정 ID (UUID)' })
  @ApiResponse({ status: HttpStatus.OK, description: '교정 반려 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '교정 일정을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터 또는 상태 오류' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.APPROVE_CALIBRATION)
  @AuditLog({ action: 'reject', entityType: 'calibration', entityIdPath: 'params.uuid' })
  @UsePipes(RejectCalibrationValidationPipe)
  async rejectCalibration(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() rejectDto: RejectCalibrationDto,
    @Request() req: AuthenticatedRequest
  ): Promise<CalibrationRecord> {
    await this.enforceCalibrationAccess(uuid, req);
    // ✅ 보안: approverId를 JWT 세션에서 추출 (checkout 패턴)
    const approverId = extractUserId(req);
    return this.calibrationService.rejectCalibration(uuid, { ...rejectDto, approverId });
  }
}
