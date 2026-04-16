import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Request,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  Res,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MULTER_UTF8_OPTIONS } from '../../common/file-upload/file-upload.module';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { SkipResponseTransform } from '../../common/interceptors/response-transform.interceptor';
import { Permission, MigrationErrorCode } from '@equipment-management/shared-constants';
import { UserRoleValues } from '@equipment-management/schemas';
import { AuthenticatedRequest } from '../../types/auth';
import type { MulterFile } from '../../types/common.types';
import { DataMigrationService } from './services/data-migration.service';
import {
  ExecuteEquipmentMigrationPipe,
  type ExecuteEquipmentMigrationDto,
  PreviewEquipmentMigrationPipe,
  type PreviewEquipmentMigrationDto,
} from './dto';
import type {
  MultiSheetPreviewResult,
  MultiSheetExecuteResult,
} from './types/data-migration.types';

@ApiTags('데이터 마이그레이션')
@ApiBearerAuth()
@Controller('data-migration')
export class DataMigrationController {
  constructor(private readonly dataMigrationService: DataMigrationService) {}

  /**
   * 멀티시트 장비 데이터 마이그레이션 Preview (Dry-run)
   * xlsx 파일 업로드 → 시트별 행별 검증 → sessionId 발급
   */
  @Post('equipment/preview')
  @RequirePermissions(Permission.MANAGE_SYSTEM_SETTINGS)
  @AuditLog({
    action: 'upload',
    entityType: 'data_migration_session',
    entityIdPath: 'response.sessionId',
  })
  @UseInterceptors(FileInterceptor('file', MULTER_UTF8_OPTIONS))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '장비 데이터 멀티시트 Preview (Dry-run)',
    description:
      'xlsx 파일을 업로드하여 시트별 행별 검증 결과를 확인합니다. Execute 전 반드시 호출해야 합니다. ' +
      '장비/교정이력/수리이력/사고이력 시트를 자동으로 감지합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Preview 성공 — 시트별 행별 상태 반환' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '파일 오류 또는 파싱 실패' })
  async previewEquipmentMigration(
    @UploadedFile() file: MulterFile,
    @Body(PreviewEquipmentMigrationPipe) dto: PreviewEquipmentMigrationDto,
    @Request() req: AuthenticatedRequest
  ): Promise<MultiSheetPreviewResult> {
    if (!file) {
      throw new BadRequestException({
        code: MigrationErrorCode.FILE_REQUIRED,
        message: '파일이 업로드되지 않았습니다.',
      });
    }
    return this.dataMigrationService.previewMultiSheet(
      file,
      dto,
      req.user.userId,
      req.user.site,
      req.user.roles.includes(UserRoleValues.SYSTEM_ADMIN)
    );
  }

  /**
   * 멀티시트 장비 데이터 마이그레이션 Execute (Commit)
   * sessionId로 캐시된 Preview 결과를 이용해 DB에 실제 INSERT
   */
  @Post('equipment/execute')
  @RequirePermissions(Permission.MANAGE_SYSTEM_SETTINGS)
  @AuditLog({
    action: 'create',
    entityType: 'data_migration_session',
    entityIdPath: 'request.body.sessionId',
  })
  @ApiOperation({
    summary: '장비 데이터 멀티시트 마이그레이션 실행',
    description:
      'Preview에서 발급된 sessionId를 사용하여 장비 및 이력 데이터를 DB에 일괄 등록합니다.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: '마이그레이션 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '세션 만료 (1시간)' })
  async executeEquipmentMigration(
    @Body(ExecuteEquipmentMigrationPipe) dto: ExecuteEquipmentMigrationDto,
    @Request() req: AuthenticatedRequest
  ): Promise<MultiSheetExecuteResult> {
    return this.dataMigrationService.executeMultiSheet(dto, req.user.userId);
  }

  /**
   * 입력 템플릿 Excel 다운로드
   * NOTE: 고정 경로이므로 `:sessionId` 파라미터 경로보다 반드시 먼저 선언해야 함
   */
  @Get('equipment/template')
  @RequirePermissions(Permission.MANAGE_SYSTEM_SETTINGS)
  @SkipResponseTransform()
  @ApiOperation({
    summary: '입력 템플릿 다운로드',
    description: '장비/교정이력/수리이력/사고이력 4개 시트가 포함된 Excel 템플릿을 다운로드합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'xlsx 템플릿 파일 다운로드' })
  async downloadTemplate(@Res() res: Response): Promise<void> {
    const buffer = await this.dataMigrationService.getTemplate();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="equipment-migration-template.xlsx"'
    );
    res.send(buffer);
  }

  /**
   * 에러 리포트 Excel 다운로드
   */
  @Get('equipment/:sessionId/error-report')
  @RequirePermissions(Permission.MANAGE_SYSTEM_SETTINGS)
  @SkipResponseTransform()
  @ApiParam({ name: 'sessionId', description: 'Preview에서 발급된 세션 ID' })
  @ApiOperation({
    summary: '에러 리포트 다운로드',
    description: '에러/중복 행을 Excel로 내보냅니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'xlsx 파일 다운로드' })
  async downloadErrorReport(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Request() req: AuthenticatedRequest,
    @Res() res: Response
  ): Promise<void> {
    const buffer = await this.dataMigrationService.getErrorReport(sessionId, req.user.userId);
    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="migration-errors-${dateStr}.xlsx"`);
    res.send(buffer);
  }
}
