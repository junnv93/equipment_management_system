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
  BadRequestException,
  UsePipes,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
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
import { CalibrationQueryDto } from './dto/calibration-query.dto';
import {
  ApproveCalibrationDto,
  RejectCalibrationDto,
  ApproveCalibrationValidationPipe,
  RejectCalibrationValidationPipe,
} from './dto/approve-calibration.dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission, CALIBRATION_DATA_SCOPE } from '@equipment-management/shared-constants';
import { SiteScoped } from '../../common/decorators/site-scoped.decorator';
import { FileUploadService } from '../equipment/services/file-upload.service';
import type { MulterFile } from '../../types/common.types';
import type { AuthenticatedRequest } from '../../types/auth';
import type { CalibrationRecord } from './calibration.service';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { extractUserId } from '../../common/utils/extract-user';
import {
  UpdateCalibrationStatusPipe,
  type UpdateCalibrationStatusDto,
} from './dto/update-calibration-status.dto';

@ApiTags('교정 관리')
@ApiBearerAuth()
@Controller('calibration')
export class CalibrationController {
  constructor(
    private readonly calibrationService: CalibrationService,
    private readonly fileUploadService: FileUploadService
  ) {}

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
    const registeredByRole = req.user?.roles?.[0];

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
  findAll(@Query() query: CalibrationQueryDto): Promise<{
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
    description: '승인 대기 상태인 교정 일정을 조회합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '승인 대기 교정 목록 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATION_REQUESTS)
  findPendingApprovals(): Promise<unknown> {
    return this.calibrationService.findPendingApprovals();
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
  findUpcomingIntermediateChecks(@Query('days') days: number = 7): Promise<CalibrationRecord[]> {
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
  findAllIntermediateChecks(
    @Query('status') status?: 'pending' | 'overdue',
    @Query('equipmentId') equipmentId?: string,
    @Query('managerId') managerId?: string,
    @Query('teamId') teamId?: string,
    @Query('site') site?: string
  ): Promise<unknown> {
    return this.calibrationService.findAllIntermediateChecks({
      status,
      equipmentId,
      managerId,
      teamId,
      site,
    });
  }

  @Post(':uuid/intermediate-check/complete') // @BodyPipeExempt: optional notes string only, no structured schema needed
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
  completeIntermediateCheck(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() body: { notes?: string },
    @Request() req: AuthenticatedRequest
  ): Promise<{ calibration: CalibrationRecord; message: string }> {
    // ✅ 보안: completedBy를 JWT 세션에서 추출 (Rule 2)
    const completedBy = extractUserId(req);
    return this.calibrationService.completeIntermediateCheck(uuid, completedBy, body.notes);
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
  findDueCalibrations(@Query('days') days: number = 30): Promise<{
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
    @Query('fromDate') fromDate: string = new Date().toISOString(),
    @Query('toDate') toDate: string
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
    const fromDateObj = new Date(fromDate);
    const toDateObj = toDate ? new Date(toDate) : new Date(fromDateObj);
    toDateObj.setMonth(toDateObj.getMonth() + 3);

    return this.calibrationService.findScheduled(fromDateObj, toDateObj);
  }

  @Get('summary')
  @ApiOperation({ summary: '교정 요약 통계 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '통계 조회 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  @RequirePermissions(Permission.VIEW_CALIBRATIONS)
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
  getUpcomingCalibrations(
    @Query('days') days: number = 30,
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

  @Post(':uuid/certificate')
  @ApiOperation({
    summary: '교정성적서 파일 업로드',
    description: '특정 교정의 교정성적서 파일을 업로드합니다.',
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
  @UseInterceptors(FileInterceptor('file'))
  @RequirePermissions(Permission.UPDATE_CALIBRATION)
  @AuditLog({ action: 'update', entityType: 'calibration', entityIdPath: 'params.uuid' })
  async uploadCertificate(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @UploadedFile() file: MulterFile
  ): Promise<{
    filePath: string;
    fileName: string;
    originalFileName: string;
    fileSize: number;
    message: string;
  }> {
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

    // 교정 정보에 파일 경로 업데이트
    await this.calibrationService.update(uuid, {
      certificatePath: savedFile.filePath,
    } as UpdateCalibrationDto);

    return {
      filePath: savedFile.filePath,
      fileName: savedFile.fileName,
      originalFileName: savedFile.originalFileName,
      fileSize: savedFile.fileSize,
      message: '교정성적서 파일이 업로드되었습니다.',
    };
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
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateCalibrationDto: UpdateCalibrationDto
  ): Promise<CalibrationRecord> {
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
  remove(@Param('uuid', ParseUUIDPipe) uuid: string): Promise<{ id: string; deleted: boolean }> {
    return this.calibrationService.remove(uuid);
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
  updateStatus(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body(UpdateCalibrationStatusPipe) dto: UpdateCalibrationStatusDto
  ): Promise<CalibrationRecord> {
    return this.calibrationService.updateStatus(uuid, dto.status);
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
  completeCalibration(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateCalibrationDto: UpdateCalibrationDto
  ): Promise<CalibrationRecord> {
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
    // ✅ 보안: approverId를 JWT 세션에서 추출 (checkout 패턴)
    const approverId = extractUserId(req);
    return this.calibrationService.rejectCalibration(uuid, { ...rejectDto, approverId });
  }
}
