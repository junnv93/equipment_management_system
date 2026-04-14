import { Injectable, Inject, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { getTableColumns, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import {
  parseManagementNumber,
  EquipmentStatusEnum,
  ApprovalStatusValues,
} from '@equipment-management/schemas';
import type { Site } from '@equipment-management/schemas';
import { equipment } from '@equipment-management/db/schema/equipment';
import { calibrations } from '@equipment-management/db/schema/calibrations';
import { repairHistory } from '@equipment-management/db/schema/repair-history';
import { equipmentIncidentHistory } from '@equipment-management/db/schema/equipment-incident-history';
import type { AppDatabase } from '@equipment-management/db';
import type { MulterFile } from '../../../types/common.types';
import { FileUploadService } from '../../../common/file-upload/file-upload.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../../common/cache/cache-key-prefixes';
import { CacheInvalidationHelper } from '../../../common/cache/cache-invalidation.helper';
import { EquipmentHistoryService } from '../../equipment/services/equipment-history.service';
import { calculateNextCalibrationDate, chunkArray } from '../../../common/utils';
import type {
  MigrationPreviewResult,
  MigrationExecuteResult,
  MigrationSession,
  MigrationRowPreview,
  MultiSheetPreviewResult,
  MultiSheetExecuteResult,
  SheetPreviewResult,
  MultiSheetMigrationSession,
} from '../types/data-migration.types';
import { ExcelParserService } from './excel-parser.service';
import { MigrationValidatorService } from './migration-validator.service';
import { HistoryValidatorService } from './history-validator.service';
import { BATCH_QUERY_LIMITS } from '@equipment-management/shared-constants';
import type { PreviewEquipmentMigrationDto } from '../dto/preview-migration.dto';
import type { ExecuteEquipmentMigrationDto } from '../dto/execute-migration.dto';

/** DB equipment 테이블의 유효 컬럼 이름 (SSOT: Drizzle 스키마에서 동적 추출) */
const EQUIPMENT_COLUMNS = new Set(Object.keys(getTableColumns(equipment)));

/** 세션 캐시 TTL: 1시간 (ms) */
const SESSION_TTL_MS = 3600 * 1000;
/** SSOT: CACHE_KEY_PREFIXES.DATA_MIGRATION + 세그먼트 */
const SESSION_CACHE_KEY_PREFIX = `${CACHE_KEY_PREFIXES.DATA_MIGRATION}session:`;
const MULTI_SESSION_CACHE_KEY_PREFIX = `${CACHE_KEY_PREFIXES.DATA_MIGRATION}multi-session:`;

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
    private readonly migrationValidatorService: MigrationValidatorService,
    private readonly historyValidatorService: HistoryValidatorService
  ) {}

  /**
   * Preview (Dry-run) — 단일시트 하위 호환
   */
  async preview(
    file: MulterFile,
    dto: PreviewEquipmentMigrationDto,
    userId: string
  ): Promise<MigrationPreviewResult> {
    const savedFile = await this.fileUploadService.saveFile(file, 'data-migration');
    const rawRows = await this.excelParserService.parseBuffer(file.buffer);
    const mappedRows = this.excelParserService.mapRows(rawRows);

    const rowPreviews = await this.migrationValidatorService.validateBatch(mappedRows, {
      autoGenerateManagementNumber: dto.autoGenerateManagementNumber ?? false,
      defaultSite: dto.defaultSite,
      skipDuplicates: dto.skipDuplicates ?? true,
    });

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
      userId,
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
   * Execute (Commit) — 단일시트 하위 호환
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

    if (session.userId !== userId) {
      throw new ForbiddenException({
        code: 'MIGRATION_SESSION_OWNERSHIP_DENIED',
        message: '본인이 생성한 마이그레이션 세션만 실행할 수 있습니다.',
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
      const locationEntries: Parameters<
        typeof this.equipmentHistoryService.createLocationHistoryBatch
      >[0] = [];

      const chunks = chunkArray(validRows, BATCH_QUERY_LIMITS.MIGRATION_CHUNK_SIZE);
      for (const chunk of chunks) {
        const entities = chunk.map(
          (row) => this.buildEntityFromRow(row, userId) as typeof equipment.$inferInsert
        );
        const createdRows = await tx
          .insert(equipment)
          .values(entities)
          .returning({ id: equipment.id, managementNumber: equipment.managementNumber });

        for (let i = 0; i < chunk.length; i++) {
          const row = chunk[i];
          const created = createdRows[i];
          if (row.data.initialLocation || row.data.location) {
            locationEntries.push({
              equipmentId: created.id,
              changedAt: (
                (row.data.installationDate as Date | undefined) ?? new Date()
              ).toISOString(),
              newLocation: (row.data.initialLocation || row.data.location) as string,
              previousLocation: null,
              notes: '데이터 마이그레이션',
            });
          }
        }
      }

      await this.equipmentHistoryService.createLocationHistoryBatch(locationEntries, userId, tx);
      createdCount = validRows.length;
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

    const errorRows = session.previewResult.rows.filter(
      (r) => r.status === 'error' || r.status === 'duplicate'
    );

    return {
      sessionId: dto.sessionId,
      createdCount,
      skippedCount,
      errorCount: errorRows.length,
      errors: errorRows,
    };
  }

  /**
   * 멀티시트 Preview (Dry-run)
   *
   * 1. 파일 저장
   * 2. 멀티시트 파싱
   * 3. 시트별 검증 (장비: MigrationValidatorService, 이력: HistoryValidatorService)
   * 4. sessionId 발급 + 결과 캐시 저장
   */
  async previewMultiSheet(
    file: MulterFile,
    dto: PreviewEquipmentMigrationDto,
    userId: string,
    userSite?: string,
    isSystemAdmin = false
  ): Promise<MultiSheetPreviewResult> {
    // 비-시스템관리자: defaultSite는 반드시 자신의 사이트와 일치해야 함
    if (!isSystemAdmin && userSite && dto.defaultSite && dto.defaultSite !== userSite) {
      throw new ForbiddenException({
        code: 'MIGRATION_SITE_ACCESS_DENIED',
        message: '자신의 사이트 데이터만 마이그레이션할 수 있습니다.',
      });
    }
    // 비-시스템관리자: defaultSite 미지정 시 자신의 사이트로 자동 적용 (엑셀 미지정 행 보호)
    const effectiveSite: Site | undefined =
      !isSystemAdmin && userSite && !dto.defaultSite ? (userSite as Site) : dto.defaultSite;

    const savedFile = await this.fileUploadService.saveFile(file, 'data-migration');

    const parsedSheets = await this.excelParserService.parseMultiSheetBuffer(file.buffer);

    // 장비 시트 유효 관리번호 Set 구축 (이력 시트 크로스 검증용)
    const equipmentMgmtNumbers = new Set<string>();
    const sheetResults: SheetPreviewResult[] = [];

    for (const parsedSheet of parsedSheets) {
      if (parsedSheet.sheetType === 'equipment') {
        const rowPreviews = await this.migrationValidatorService.validateBatch(parsedSheet.rows, {
          autoGenerateManagementNumber: dto.autoGenerateManagementNumber ?? false,
          defaultSite: effectiveSite,
          skipDuplicates: dto.skipDuplicates ?? true,
        });

        // 유효 관리번호 수집
        for (const row of rowPreviews) {
          if (row.managementNumber && (row.status === 'valid' || row.status === 'warning')) {
            equipmentMgmtNumbers.add(row.managementNumber);
          }
        }

        const summary = this.buildSummary(rowPreviews);
        sheetResults.push({
          sheetType: parsedSheet.sheetType,
          sheetName: parsedSheet.sheetName,
          totalRows: parsedSheet.rows.length,
          ...summary,
          unmappedColumns: parsedSheet.unmappedColumns,
          rows: rowPreviews,
        });
      }
    }

    // 이력 시트 처리 (장비 시트 완료 후)
    for (const parsedSheet of parsedSheets) {
      if (parsedSheet.sheetType === 'equipment') continue;

      let rowPreviews: MigrationRowPreview[];

      if (parsedSheet.sheetType === 'calibration') {
        rowPreviews = this.historyValidatorService.validateCalibrationBatch(
          parsedSheet.rows,
          equipmentMgmtNumbers
        );
      } else if (parsedSheet.sheetType === 'repair') {
        rowPreviews = this.historyValidatorService.validateRepairBatch(
          parsedSheet.rows,
          equipmentMgmtNumbers
        );
      } else {
        rowPreviews = this.historyValidatorService.validateIncidentBatch(
          parsedSheet.rows,
          equipmentMgmtNumbers
        );
      }

      const summary = this.buildSummary(rowPreviews);
      sheetResults.push({
        sheetType: parsedSheet.sheetType,
        sheetName: parsedSheet.sheetName,
        totalRows: parsedSheet.rows.length,
        ...summary,
        unmappedColumns: parsedSheet.unmappedColumns,
        rows: rowPreviews,
      });
    }

    const sessionId = uuidv4();
    const totalRows = sheetResults.reduce((acc, s) => acc + s.totalRows, 0);
    const validRows = sheetResults.reduce((acc, s) => acc + s.validRows, 0);
    const errorRows = sheetResults.reduce((acc, s) => acc + s.errorRows, 0);

    const result: MultiSheetPreviewResult = {
      sessionId,
      fileName: file.originalname,
      sheets: sheetResults,
      totalRows,
      validRows,
      errorRows,
    };

    // 멀티시트 세션 캐시 저장
    const session: MultiSheetMigrationSession = {
      sessionId,
      fileName: file.originalname,
      uploadedAt: new Date(),
      userId,
      sheets: sheetResults.map((s) => ({
        sheetType: s.sheetType,
        sheetName: s.sheetName,
        rows: s.rows,
      })),
    };
    this.cacheService.set(`${MULTI_SESSION_CACHE_KEY_PREFIX}${sessionId}`, session, SESSION_TTL_MS);

    this.logger.log(
      `MultiSheet Preview complete: sessionId=${sessionId}, ` +
        `sheets=${sheetResults.length}, total=${totalRows}, valid=${validRows}, errors=${errorRows}`
    );

    // 임시 파일 참조 저장 (에러 리포트 등에 활용하지 않으므로 savedFile 참조만 유지)
    void savedFile;

    return result;
  }

  /**
   * 멀티시트 Execute (Commit)
   *
   * 1. sessionId로 캐시에서 멀티시트 Preview 결과 조회
   * 2. 장비 먼저 INSERT → managementNumber→UUID 맵 구축
   * 3. DB에서 기존 장비 관리번호 배치 조회
   * 4. 이력(교정/수리/사고) INSERT — 100행 단위 chunk, 같은 트랜잭션
   */
  async executeMultiSheet(
    dto: ExecuteEquipmentMigrationDto,
    userId: string
  ): Promise<MultiSheetExecuteResult> {
    const session = this.cacheService.get<MultiSheetMigrationSession>(
      `${MULTI_SESSION_CACHE_KEY_PREFIX}${dto.sessionId}`
    );
    if (!session) {
      throw new NotFoundException({
        code: 'MIGRATION_SESSION_NOT_FOUND',
        message: '마이그레이션 세션을 찾을 수 없습니다. 파일을 다시 업로드하세요.',
      });
    }

    if (session.userId !== userId) {
      throw new ForbiddenException({
        code: 'MIGRATION_SESSION_OWNERSHIP_DENIED',
        message: '본인이 생성한 마이그레이션 세션만 실행할 수 있습니다.',
      });
    }

    const sheetSummaries: MultiSheetExecuteResult['sheets'] = [];
    const allErrors: MigrationRowPreview[] = [];
    let totalCreated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // managementNumber → equipmentId 맵 (이력 INSERT에 사용)
    const mgmtNumToId = new Map<string, string>();

    await this.db.transaction(async (tx) => {
      // ── 1. 장비 시트 INSERT ────────────────────────────────────────────────
      for (const sheet of session.sheets) {
        if (sheet.sheetType !== 'equipment') continue;

        const validRows = sheet.rows.filter((r) => r.status === 'valid' || r.status === 'warning');
        const errorRowsForSheet = sheet.rows.filter(
          (r) => r.status === 'error' || r.status === 'duplicate'
        );
        const skippedCount = sheet.rows.length - validRows.length - errorRowsForSheet.length;

        let createdCount = 0;
        const sheetErrors: MigrationRowPreview[] = [...errorRowsForSheet];

        const locationEntries: Parameters<
          typeof this.equipmentHistoryService.createLocationHistoryBatch
        >[0] = [];

        const equipChunks = chunkArray(validRows, BATCH_QUERY_LIMITS.MIGRATION_CHUNK_SIZE);
        for (const chunk of equipChunks) {
          const entities = chunk.map(
            (row) => this.buildEntityFromRow(row, userId) as typeof equipment.$inferInsert
          );
          const createdRows = await tx
            .insert(equipment)
            .values(entities)
            .returning({ id: equipment.id, managementNumber: equipment.managementNumber });

          for (let i = 0; i < chunk.length; i++) {
            const row = chunk[i];
            const created = createdRows[i];

            if (row.managementNumber) {
              mgmtNumToId.set(row.managementNumber, created.id);
            }

            if (row.data.initialLocation || row.data.location) {
              locationEntries.push({
                equipmentId: created.id,
                changedAt: (
                  (row.data.installationDate as Date | undefined) ?? new Date()
                ).toISOString(),
                newLocation: (row.data.initialLocation || row.data.location) as string,
                previousLocation: null,
                notes: '데이터 마이그레이션',
              });
            }
          }
        }

        await this.equipmentHistoryService.createLocationHistoryBatch(locationEntries, userId, tx);
        createdCount = validRows.length;

        sheetSummaries.push({
          sheetType: 'equipment',
          createdCount,
          skippedCount,
          errorCount: sheetErrors.length,
        });
        allErrors.push(...sheetErrors);
        totalCreated += createdCount;
        totalSkipped += skippedCount;
        totalErrors += sheetErrors.length;
      }

      // ── 2. DB에서 기존 장비 관리번호 배치 조회 (이력의 미해결 관리번호용) ──
      const allHistoryMgmtNums = new Set<string>();
      for (const sheet of session.sheets) {
        if (sheet.sheetType === 'equipment') continue;
        for (const row of sheet.rows) {
          const mgmtNum = row.managementNumber;
          if (mgmtNum && !mgmtNumToId.has(mgmtNum)) {
            allHistoryMgmtNums.add(mgmtNum);
          }
        }
      }

      if (allHistoryMgmtNums.size > 0) {
        const existingEquipment = await tx
          .select({ managementNumber: equipment.managementNumber, id: equipment.id })
          .from(equipment)
          .where(inArray(equipment.managementNumber, Array.from(allHistoryMgmtNums)));

        for (const e of existingEquipment) {
          mgmtNumToId.set(e.managementNumber, e.id);
        }
      }

      // ── 3. 교정 이력 INSERT ────────────────────────────────────────────────
      for (const sheet of session.sheets) {
        if (sheet.sheetType !== 'calibration') continue;

        const validRows = sheet.rows.filter((r) => r.status === 'valid' || r.status === 'warning');
        const sheetErrors: MigrationRowPreview[] = sheet.rows.filter((r) => r.status === 'error');

        const { createdCount, errors } = await this.insertHistoryBatch(
          tx,
          calibrations,
          validRows,
          mgmtNumToId,
          (row, equipmentId) => this.buildCalibrationValues(row, equipmentId, userId)
        );
        sheetErrors.push(...errors);

        sheetSummaries.push({
          sheetType: 'calibration',
          createdCount,
          skippedCount: 0,
          errorCount: sheetErrors.length,
        });
        allErrors.push(...sheetErrors);
        totalCreated += createdCount;
        totalErrors += sheetErrors.length;
      }

      // ── 4. 수리 이력 INSERT ────────────────────────────────────────────────
      for (const sheet of session.sheets) {
        if (sheet.sheetType !== 'repair') continue;

        const validRows = sheet.rows.filter((r) => r.status === 'valid' || r.status === 'warning');
        const sheetErrors: MigrationRowPreview[] = sheet.rows.filter((r) => r.status === 'error');

        const { createdCount, errors } = await this.insertHistoryBatch(
          tx,
          repairHistory,
          validRows,
          mgmtNumToId,
          (row, equipmentId) => this.buildRepairValues(row, equipmentId, userId)
        );
        sheetErrors.push(...errors);

        sheetSummaries.push({
          sheetType: 'repair',
          createdCount,
          skippedCount: 0,
          errorCount: sheetErrors.length,
        });
        allErrors.push(...sheetErrors);
        totalCreated += createdCount;
        totalErrors += sheetErrors.length;
      }

      // ── 5. 사고 이력 INSERT ────────────────────────────────────────────────
      for (const sheet of session.sheets) {
        if (sheet.sheetType !== 'incident') continue;

        const validRows = sheet.rows.filter((r) => r.status === 'valid' || r.status === 'warning');
        const sheetErrors: MigrationRowPreview[] = sheet.rows.filter((r) => r.status === 'error');

        const { createdCount, errors } = await this.insertHistoryBatch(
          tx,
          equipmentIncidentHistory,
          validRows,
          mgmtNumToId,
          (row, equipmentId) => this.buildIncidentValues(row, equipmentId, userId)
        );
        sheetErrors.push(...errors);

        sheetSummaries.push({
          sheetType: 'incident',
          createdCount,
          skippedCount: 0,
          errorCount: sheetErrors.length,
        });
        allErrors.push(...sheetErrors);
        totalCreated += createdCount;
        totalErrors += sheetErrors.length;
      }
    });

    // 캐시 무효화
    const invalidations: Promise<unknown>[] = [
      this.cacheInvalidationHelper.invalidateEquipmentLists(),
      this.cacheInvalidationHelper.invalidateAllDashboard(),
    ];
    await Promise.all(invalidations);
    // 교정 이력이 등록된 경우 calibration 목록 캐시도 무효화
    if (sheetSummaries.some((s) => s.sheetType === 'calibration' && s.createdCount > 0)) {
      this.cacheService.deleteByPrefix(`${CACHE_KEY_PREFIXES.CALIBRATION}list:`);
      this.cacheService.deleteByPrefix(`${CACHE_KEY_PREFIXES.CALIBRATION}pending:`);
    }
    // 수리/사고 이력이 등록된 경우 장비 detail 캐시 무효화 (이력 탭 stale 방지)
    if (
      sheetSummaries.some(
        (s) => (s.sheetType === 'repair' || s.sheetType === 'incident') && s.createdCount > 0
      )
    ) {
      this.cacheService.deleteByPrefix(`${CACHE_KEY_PREFIXES.EQUIPMENT}detail:`);
    }

    // 세션 캐시 삭제
    this.cacheService.delete(`${MULTI_SESSION_CACHE_KEY_PREFIX}${dto.sessionId}`);

    this.logger.log(
      `MultiSheet Execute complete: sessionId=${dto.sessionId}, ` +
        `created=${totalCreated}, skipped=${totalSkipped}, errors=${totalErrors}`
    );

    return {
      sessionId: dto.sessionId,
      sheets: sheetSummaries,
      totalCreated,
      totalSkipped,
      totalErrors,
      errors: allErrors,
    };
  }

  /**
   * 에러 리포트 Excel 버퍼 반환
   */
  async getErrorReport(sessionId: string): Promise<Buffer> {
    // 단일시트 세션 우선 조회, 없으면 멀티시트 세션 폴백
    const singleSession = this.cacheService.get<MigrationSession>(
      `${SESSION_CACHE_KEY_PREFIX}${sessionId}`
    );

    if (singleSession) {
      const errorRows = singleSession.previewResult.rows.filter(
        (r) => r.status === 'error' || r.status === 'duplicate'
      );
      return this.excelParserService.generateErrorReport(this.toErrorReportRows(errorRows));
    }

    const multiSession = this.cacheService.get<MultiSheetMigrationSession>(
      `${MULTI_SESSION_CACHE_KEY_PREFIX}${sessionId}`
    );

    if (!multiSession) {
      throw new NotFoundException({
        code: 'MIGRATION_SESSION_NOT_FOUND',
        message: '에러 리포트 세션을 찾을 수 없습니다.',
      });
    }

    const errorRows: MigrationRowPreview[] = [];
    for (const sheet of multiSession.sheets) {
      for (const row of sheet.rows) {
        if (row.status === 'error' || row.status === 'duplicate') errorRows.push(row);
      }
    }

    return this.excelParserService.generateErrorReport(this.toErrorReportRows(errorRows));
  }

  /**
   * 입력 템플릿 Excel 버퍼 반환
   */
  async getTemplate(): Promise<Buffer> {
    return this.excelParserService.generateTemplate();
  }

  // ── Private Methods ──────────────────────────────────────────────────────────

  /** generateErrorReport 전달용 행 매핑 (단일/멀티시트 공통) */
  private toErrorReportRows(rows: MigrationRowPreview[]) {
    return rows.map((r) => ({
      rowNumber: r.rowNumber,
      status: r.status,
      managementNumber: r.managementNumber,
      errors: r.errors.map((e) => ({ field: e.field, message: e.message })),
      data: r.data,
    }));
  }

  /**
   * MigrationRowPreview → DB INSERT 엔티티 빌드
   * EquipmentService.transformCreateDtoToEntity 로직을 재현
   */
  private buildEntityFromRow(
    row: MigrationRowPreview,
    _userId: string
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

  /** 행별 결과 집계 */
  private buildSummary(rows: MigrationRowPreview[]) {
    const counts = { validRows: 0, errorRows: 0, duplicateRows: 0, warningRows: 0 };
    for (const row of rows) {
      if (row.status === 'valid') counts.validRows++;
      else if (row.status === 'error') counts.errorRows++;
      else if (row.status === 'duplicate') counts.duplicateRows++;
      else if (row.status === 'warning') counts.warningRows++;
    }
    return counts;
  }

  /**
   * 3종 이력(교정/수리/사고) 배치 INSERT 공통 헬퍼
   *
   * - managementNumber → equipmentId 해석 실패 행은 errors 수집
   * - 유효 행을 MIGRATION_CHUNK_SIZE 단위로 배치 INSERT
   */
  private buildCalibrationValues(
    row: MigrationRowPreview,
    equipmentId: string,
    userId: string
  ): object {
    return {
      equipmentId,
      calibrationDate: row.data.calibrationDate as Date,
      agencyName: row.data.agencyName as string | undefined,
      certificateNumber: row.data.certificateNumber as string | undefined,
      result: row.data.result as string | undefined,
      cost: row.data.cost !== undefined ? String(row.data.cost) : undefined,
      notes: row.data.notes as string | undefined,
      status: 'completed',
      approvalStatus: 'approved',
      registeredBy: userId,
    };
  }

  private buildRepairValues(row: MigrationRowPreview, equipmentId: string, userId: string): object {
    return {
      equipmentId,
      repairDate: row.data.repairDate as Date,
      repairDescription: row.data.repairDescription as string,
      repairResult: row.data.repairResult as string | undefined,
      notes: row.data.notes as string | undefined,
      createdBy: userId,
    };
  }

  private buildIncidentValues(
    row: MigrationRowPreview,
    equipmentId: string,
    userId: string
  ): object {
    return {
      equipmentId,
      occurredAt: row.data.occurredAt as Date,
      incidentType: row.data.incidentType as string,
      content: row.data.content as string,
      reportedBy: userId,
    };
  }

  private async insertHistoryBatch(
    tx: AppDatabase,
    table: typeof calibrations | typeof repairHistory | typeof equipmentIncidentHistory,
    rows: MigrationRowPreview[],
    mgmtNumToId: Map<string, string>,
    buildValues: (row: MigrationRowPreview, equipmentId: string) => object
  ): Promise<{ createdCount: number; errors: MigrationRowPreview[] }> {
    const errors: MigrationRowPreview[] = [];
    const validValues: object[] = [];

    for (const row of rows) {
      const mgmtNum = row.managementNumber;
      const equipmentId = mgmtNum ? mgmtNumToId.get(mgmtNum) : undefined;

      if (!equipmentId) {
        errors.push({
          ...row,
          status: 'error' as const,
          errors: [
            {
              field: 'managementNumber',
              message: `장비를 찾을 수 없습니다: ${mgmtNum ?? '(없음)'}`,
              code: 'EQUIPMENT_NOT_FOUND',
            },
          ],
        });
        continue;
      }

      validValues.push(buildValues(row, equipmentId));
    }

    if (validValues.length === 0) return { createdCount: 0, errors };

    const chunks = chunkArray(validValues, BATCH_QUERY_LIMITS.MIGRATION_CHUNK_SIZE);
    for (const chunk of chunks) {
      // union table 타입을 Drizzle에 전달; buildValues가 올바른 shape를 보장
      await (tx.insert(table) as unknown as { values: (v: object[]) => Promise<void> }).values(
        chunk
      );
    }

    return { createdCount: validValues.length, errors };
  }
}
