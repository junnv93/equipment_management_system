import { Injectable, Inject, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { eq, getTableColumns } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import {
  parseManagementNumber,
  createEquipmentSchema,
  EquipmentStatusEnum,
  ApprovalStatusValues,
} from '@equipment-management/schemas';
import { equipment } from '@equipment-management/db/schema/equipment';
import type { AppDatabase } from '@equipment-management/db';
import type { MulterFile } from '../../../types/common.types';
import { FileUploadService } from '../../../common/file-upload/file-upload.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { CacheInvalidationHelper } from '../../../common/cache/cache-invalidation.helper';
import { EquipmentHistoryService } from '../../equipment/services/equipment-history.service';
import { calculateNextCalibrationDate } from '../../../common/utils';
import type {
  MigrationPreviewResult,
  MigrationExecuteResult,
  MigrationSession,
  MigrationRowPreview,
} from '../types/data-migration.types';
import { ExcelParserService } from './excel-parser.service';
import { MigrationValidatorService } from './migration-validator.service';
import type { PreviewEquipmentMigrationDto } from '../dto/preview-migration.dto';
import type { ExecuteEquipmentMigrationDto } from '../dto/execute-migration.dto';

/** DB equipment 테이블의 유효 컬럼 이름 (SSOT: Drizzle 스키마에서 동적 추출) */
const EQUIPMENT_COLUMNS = new Set(Object.keys(getTableColumns(equipment)));

/** 세션 캐시 TTL: 1시간 (ms) */
const SESSION_TTL_MS = 3600 * 1000;
const SESSION_CACHE_KEY_PREFIX = 'data-migration:session:';

/**
 * 데이터 마이그레이션 오케스트레이터 서비스
 *
 * Preview(dry-run) → Execute(commit) 2단계 워크플로우 관리.
 * - Preview: 파일 파싱 + 검증 → sessionId 발급 + 결과 캐시
 * - Execute: sessionId로 캐시된 결과 재사용 → 단일 트랜잭션 Batch INSERT
 * - Error Report: ExcelParserService로 에러 행 Excel 생성
 * - Template: ExcelParserService로 입력 템플릿 생성
 */
@Injectable()
export class DataMigrationService {
  private readonly logger = new Logger(DataMigrationService.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    private readonly fileUploadService: FileUploadService,
    private readonly cacheService: SimpleCacheService,
    private readonly cacheInvalidationHelper: CacheInvalidationHelper,
    private readonly equipmentHistoryService: EquipmentHistoryService,
    private readonly excelParserService: ExcelParserService,
    private readonly migrationValidatorService: MigrationValidatorService
  ) {}

  /**
   * Preview (Dry-run)
   *
   * 1. 파일 저장 (FileUploadService)
   * 2. Excel 파싱
   * 3. 배치 검증 (Zod + DB 중복 + 파일 내 중복)
   * 4. sessionId 발급 + 결과 캐시 저장
   */
  async preview(
    file: MulterFile,
    dto: PreviewEquipmentMigrationDto,
    _userId: string
  ): Promise<MigrationPreviewResult> {
    // 파일 저장
    const savedFile = await this.fileUploadService.saveFile(file, 'data-migration');

    // Excel 파싱
    const rawRows = await this.excelParserService.parseBuffer(file.buffer);
    const mappedRows = this.excelParserService.mapRows(rawRows);

    // 배치 검증
    const rowPreviews = await this.migrationValidatorService.validateBatch(mappedRows, {
      autoGenerateManagementNumber: dto.autoGenerateManagementNumber ?? false,
      defaultSite: dto.defaultSite,
      skipDuplicates: dto.skipDuplicates ?? true,
    });

    // 집계
    const summary = this.buildSummary(rowPreviews);

    // 인식되지 않은 컬럼 집계 (중복 제거)
    const unmappedColumnsSet = new Set<string>();
    for (const row of mappedRows) {
      row.unmappedColumns.forEach((col) => unmappedColumnsSet.add(col));
    }

    const result: MigrationPreviewResult = {
      sessionId: uuidv4(),
      fileName: file.originalname,
      totalRows: rawRows.length,
      ...summary,
      unmappedColumns: Array.from(unmappedColumnsSet),
      rows: rowPreviews,
    };

    // 세션 캐시 저장
    const session: MigrationSession = {
      sessionId: result.sessionId,
      filePath: savedFile.filePath,
      originalFileName: file.originalname,
      previewResult: result,
      createdAt: new Date(),
    };
    this.cacheService.set(
      `${SESSION_CACHE_KEY_PREFIX}${result.sessionId}`,
      session,
      SESSION_TTL_MS
    );

    this.logger.log(
      `Preview complete: sessionId=${result.sessionId}, ` +
        `total=${result.totalRows}, valid=${result.validRows}, ` +
        `errors=${result.errorRows}, duplicates=${result.duplicateRows}`
    );

    return result;
  }

  /**
   * Execute (Commit)
   *
   * 1. sessionId로 캐시에서 Preview 결과 조회
   * 2. 유효 행만 추출
   * 3. 단일 트랜잭션으로 Batch INSERT (equipment + location history SSOT)
   * 4. 캐시 무효화
   */
  async execute(
    dto: ExecuteEquipmentMigrationDto,
    userId: string
  ): Promise<MigrationExecuteResult> {
    // 세션 조회
    const session = this.cacheService.get<MigrationSession>(
      `${SESSION_CACHE_KEY_PREFIX}${dto.sessionId}`
    );
    if (!session) {
      throw new NotFoundException({
        code: 'MIGRATION_SESSION_NOT_FOUND',
        message: '마이그레이션 세션을 찾을 수 없습니다. 파일을 다시 업로드하세요.',
      });
    }

    // 유효 행 추출
    const validRows = this.migrationValidatorService.filterValidRows(
      session.previewResult.rows,
      dto.selectedRows
    );

    if (validRows.length === 0) {
      return {
        sessionId: dto.sessionId,
        createdCount: 0,
        skippedCount: session.previewResult.duplicateRows,
        errorCount: session.previewResult.errorRows,
        errors: session.previewResult.rows.filter((r) => r.status === 'error'),
      };
    }

    let createdCount = 0;

    // 단일 트랜잭션 — All-or-Nothing (개별 행 실패 시 전체 롤백)
    await this.db.transaction(async (tx) => {
      for (const row of validRows) {
        const entity = this.buildEntityFromRow(row, userId);

        const [created] = await tx
          .insert(equipment)
          .values(entity as typeof equipment.$inferInsert)
          .returning();

        // 위치 이력 SSOT 동기화
        if (row.data.initialLocation || row.data.location) {
          const resolvedLocation = (row.data.initialLocation || row.data.location) as string;
          const changedAt = (
            (row.data.installationDate as Date | undefined) ?? new Date()
          ).toISOString();

          await this.equipmentHistoryService.createLocationHistoryInternal(
            created.id,
            {
              changedAt,
              newLocation: resolvedLocation,
              previousLocation: null,
              notes: '데이터 마이그레이션',
            },
            userId,
            tx
          );
        }

        createdCount++;
      }
    });

    // 장비 목록 + 대시보드 캐시 무효화 (대량 등록으로 KPI 변경됨)
    await Promise.all([
      this.cacheInvalidationHelper.invalidateEquipmentLists(),
      this.cacheInvalidationHelper.invalidateAllDashboard(),
    ]);

    // 세션 캐시 삭제
    this.cacheService.delete(`${SESSION_CACHE_KEY_PREFIX}${dto.sessionId}`);

    const skippedCount =
      session.previewResult.totalRows - validRows.length - session.previewResult.errorRows;

    this.logger.log(
      `Execute complete: sessionId=${dto.sessionId}, created=${createdCount}, skipped=${skippedCount}`
    );

    return {
      sessionId: dto.sessionId,
      createdCount,
      skippedCount,
      errorCount: 0,
      errors: [],
    };
  }

  /**
   * 에러 리포트 Excel 버퍼 반환
   */
  async getErrorReport(sessionId: string): Promise<Buffer> {
    const session = this.cacheService.get<MigrationSession>(
      `${SESSION_CACHE_KEY_PREFIX}${sessionId}`
    );
    if (!session) {
      throw new NotFoundException({
        code: 'MIGRATION_SESSION_NOT_FOUND',
        message: '에러 리포트 세션을 찾을 수 없습니다.',
      });
    }

    const errorRows = session.previewResult.rows.filter(
      (r) => r.status === 'error' || r.status === 'duplicate'
    );

    return this.excelParserService.generateErrorReport(
      errorRows.map((r) => ({
        rowNumber: r.rowNumber,
        status: r.status,
        managementNumber: r.managementNumber,
        errors: r.errors.map((e) => ({ field: e.field, message: e.message })),
        data: r.data,
      }))
    );
  }

  /**
   * 입력 템플릿 Excel 버퍼 반환
   */
  async getTemplate(): Promise<Buffer> {
    return this.excelParserService.generateTemplate();
  }

  // ── Private Methods ──────────────────────────────────────────────────────────

  /**
   * MigrationRowPreview → DB INSERT 엔티티 빌드
   * EquipmentService.transformCreateDtoToEntity 로직을 재현
   */
  private buildEntityFromRow(
    row: MigrationRowPreview,
    userId: string
  ): Partial<typeof equipment.$inferInsert> {
    const data = row.data;
    const managementNumber = row.managementNumber ?? (data.managementNumber as string);

    // 관리번호 컴포넌트 파싱
    const parsed = parseManagementNumber(managementNumber);

    // nextCalibrationDate 계산
    const nextCalibrationDate = calculateNextCalibrationDate(
      data.lastCalibrationDate as Date | undefined,
      data.calibrationCycle as number | undefined
    );

    const entity: Record<string, unknown> = {
      // 기본값 + 파생 필드
      managementNumber,
      siteCode: parsed?.siteCode,
      classificationCode: parsed?.classificationCode,
      managementSerialNumber: parsed ? parseInt(parsed.serialNumber, 10) : undefined,
      nextCalibrationDate,
      needsIntermediateCheck: false,
      status: EquipmentStatusEnum.enum.available,
      isActive: true,
      approvalStatus: ApprovalStatusValues.APPROVED,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // CUSTOM_HANDLED: 위에서 이미 처리된 필드
    const CUSTOM_HANDLED = new Set([
      'managementNumber',
      'siteCode',
      'classificationCode',
      'managementSerialNumber',
      'nextCalibrationDate',
      'needsIntermediateCheck',
      'status',
      'isActive',
      'approvalStatus',
      'version',
      'id',
      'createdAt',
      'updatedAt',
      'location', // SSOT — equipment_location_history에서 파생
    ]);

    // DB 컬럼에 존재하는 필드만 자동 매핑 (SSOT: EQUIPMENT_COLUMNS)
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && EQUIPMENT_COLUMNS.has(key) && !CUSTOM_HANDLED.has(key)) {
        entity[key] = value;
      }
    }

    return entity as Partial<typeof equipment.$inferInsert>;
  }

  /**
   * 행별 결과 집계
   */
  private buildSummary(rows: MigrationRowPreview[]): {
    validRows: number;
    errorRows: number;
    duplicateRows: number;
    warningRows: number;
  } {
    let validRows = 0;
    let errorRows = 0;
    let duplicateRows = 0;
    let warningRows = 0;

    for (const row of rows) {
      switch (row.status) {
        case 'valid':
          validRows++;
          break;
        case 'error':
          errorRows++;
          break;
        case 'duplicate':
          duplicateRows++;
          break;
        case 'warning':
          warningRows++;
          break;
      }
    }

    return { validRows, errorRows, duplicateRows, warningRows };
  }
}
