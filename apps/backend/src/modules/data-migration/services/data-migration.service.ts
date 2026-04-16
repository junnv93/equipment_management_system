import { Injectable, Inject, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { getTableColumns, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import {
  parseManagementNumber,
  EquipmentStatusEnum,
  ApprovalStatusValues,
  CalibrationStatusEnum,
  CalibrationApprovalStatusValues,
} from '@equipment-management/schemas';
import type { Site } from '@equipment-management/schemas';
import { MigrationErrorCode } from '@equipment-management/shared-constants';
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
import {
  calculateNextCalibrationDate,
  chunkArray,
  bulkInsertInChunks,
} from '../../../common/utils';
import type {
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

  /** 멀티시트 Preview (Dry-run): 파싱 → 시트별 검증(장비/이력) → sessionId 발급 + 캐시 저장 */
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
        code: MigrationErrorCode.SITE_ACCESS_DENIED,
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

      // DB 중복 검사: 기존 장비 참조 행만 대상 (신규 장비는 DB에 없으므로 제외)
      const existingMgmtNums = [
        ...new Set(
          rowPreviews
            .filter(
              (r) =>
                (r.status === 'valid' || r.status === 'warning') &&
                r.managementNumber &&
                !equipmentMgmtNumbers.has(r.managementNumber)
            )
            .map((r) => r.managementNumber!)
        ),
      ];

      if (existingMgmtNums.length > 0) {
        const previewMgmtNumToId = await this.resolveExistingMgmtNumToId(existingMgmtNums);
        rowPreviews = await this.markPreviewHistoryDuplicates(
          rowPreviews,
          parsedSheet.sheetType,
          previewMgmtNumToId
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

  /** 멀티시트 Execute (Commit): 장비 배치 INSERT → mgmtNum→ID 맵 → 이력(교정/수리/사고) 배치 INSERT */
  async executeMultiSheet(
    dto: ExecuteEquipmentMigrationDto,
    userId: string
  ): Promise<MultiSheetExecuteResult> {
    const session = this.cacheService.get<MultiSheetMigrationSession>(
      `${MULTI_SESSION_CACHE_KEY_PREFIX}${dto.sessionId}`
    );
    if (!session) {
      throw new NotFoundException({
        code: MigrationErrorCode.SESSION_NOT_FOUND,
        message: '마이그레이션 세션을 찾을 수 없습니다. 파일을 다시 업로드하세요.',
      });
    }

    if (session.userId !== userId) {
      throw new ForbiddenException({
        code: MigrationErrorCode.SESSION_OWNERSHIP_DENIED,
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

        const candidateRows = sheet.rows.filter(
          (r) => r.status === 'valid' || r.status === 'warning'
        );
        const sheetErrors: MigrationRowPreview[] = sheet.rows.filter((r) => r.status === 'error');

        // DB 중복 검사: (equipmentId, calibrationDate) 동일 레코드 차단
        const { toInsert: calToInsert, duplicates: calDuplicates } =
          await this.filterCalibrationDuplicates(candidateRows, mgmtNumToId, (ids) =>
            tx
              .select({
                equipmentId: calibrations.equipmentId,
                calibrationDate: calibrations.calibrationDate,
              })
              .from(calibrations)
              .where(inArray(calibrations.equipmentId, ids))
          );
        sheetErrors.push(...calDuplicates);

        const { createdCount, errors } = await this.insertHistoryBatch(
          calToInsert,
          mgmtNumToId,
          (row, equipmentId) => this.buildCalibrationValues(row, equipmentId, userId),
          (chunk) => tx.insert(calibrations).values(chunk as (typeof calibrations.$inferInsert)[])
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

        const candidateRows = sheet.rows.filter(
          (r) => r.status === 'valid' || r.status === 'warning'
        );
        const sheetErrors: MigrationRowPreview[] = sheet.rows.filter((r) => r.status === 'error');

        // DB 중복 검사: (equipmentId, repairDate) 동일 레코드 차단
        const { toInsert: repairToInsert, duplicates: repairDuplicates } =
          await this.filterRepairDuplicates(candidateRows, mgmtNumToId, (ids) =>
            tx
              .select({
                equipmentId: repairHistory.equipmentId,
                repairDate: repairHistory.repairDate,
              })
              .from(repairHistory)
              .where(inArray(repairHistory.equipmentId, ids))
          );
        sheetErrors.push(...repairDuplicates);

        const { createdCount, errors } = await this.insertHistoryBatch(
          repairToInsert,
          mgmtNumToId,
          (row, equipmentId) => this.buildRepairValues(row, equipmentId, userId),
          (chunk) => tx.insert(repairHistory).values(chunk as (typeof repairHistory.$inferInsert)[])
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

        const candidateRows = sheet.rows.filter(
          (r) => r.status === 'valid' || r.status === 'warning'
        );
        const sheetErrors: MigrationRowPreview[] = sheet.rows.filter((r) => r.status === 'error');

        // DB 중복 검사: (equipmentId, occurredAt, incidentType) 동일 레코드 차단
        const { toInsert: incidentToInsert, duplicates: incidentDuplicates } =
          await this.filterIncidentDuplicates(candidateRows, mgmtNumToId, (ids) =>
            tx
              .select({
                equipmentId: equipmentIncidentHistory.equipmentId,
                occurredAt: equipmentIncidentHistory.occurredAt,
                incidentType: equipmentIncidentHistory.incidentType,
              })
              .from(equipmentIncidentHistory)
              .where(inArray(equipmentIncidentHistory.equipmentId, ids))
          );
        sheetErrors.push(...incidentDuplicates);

        const { createdCount, errors } = await this.insertHistoryBatch(
          incidentToInsert,
          mgmtNumToId,
          (row, equipmentId) => this.buildIncidentValues(row, equipmentId, userId),
          (chunk) =>
            tx
              .insert(equipmentIncidentHistory)
              .values(chunk as (typeof equipmentIncidentHistory.$inferInsert)[])
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
   * 에러 리포트 Excel 버퍼 반환 (멀티시트 세션 기준)
   */
  async getErrorReport(sessionId: string, userId: string): Promise<Buffer> {
    const session = this.cacheService.get<MultiSheetMigrationSession>(
      `${MULTI_SESSION_CACHE_KEY_PREFIX}${sessionId}`
    );

    if (!session) {
      throw new NotFoundException({
        code: MigrationErrorCode.SESSION_NOT_FOUND,
        message: '에러 리포트 세션을 찾을 수 없습니다.',
      });
    }

    if (session.userId !== userId) {
      throw new ForbiddenException({
        code: MigrationErrorCode.SESSION_OWNERSHIP_DENIED,
        message: '본인이 생성한 마이그레이션 세션의 에러 리포트만 다운로드할 수 있습니다.',
      });
    }

    const errorRows: MigrationRowPreview[] = [];
    for (const sheet of session.sheets) {
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
  private toErrorReportRows(rows: MigrationRowPreview[]): Array<{
    rowNumber: number;
    status: string;
    managementNumber?: string;
    errors: Array<{ field: string; message: string }>;
    data: Record<string, unknown>;
  }> {
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
  private buildSummary(rows: MigrationRowPreview[]): {
    validRows: number;
    errorRows: number;
    duplicateRows: number;
    warningRows: number;
  } {
    const counts = { validRows: 0, errorRows: 0, duplicateRows: 0, warningRows: 0 };
    for (const row of rows) {
      if (row.status === 'valid') counts.validRows++;
      else if (row.status === 'error') counts.errorRows++;
      else if (row.status === 'duplicate') counts.duplicateRows++;
      else if (row.status === 'warning') counts.warningRows++;
    }
    return counts;
  }

  private buildCalibrationValues(
    row: MigrationRowPreview,
    equipmentId: string,
    userId: string
  ): Partial<typeof calibrations.$inferInsert> {
    return {
      equipmentId,
      calibrationDate: row.data.calibrationDate as Date,
      agencyName: row.data.agencyName as string | undefined,
      certificateNumber: row.data.certificateNumber as string | undefined,
      result: row.data.result as string | undefined,
      cost: row.data.cost !== undefined ? String(row.data.cost) : undefined,
      notes: row.data.notes as string | undefined,
      status: CalibrationStatusEnum.enum.completed,
      approvalStatus: CalibrationApprovalStatusValues.APPROVED,
      registeredBy: userId,
    };
  }

  private buildRepairValues(
    row: MigrationRowPreview,
    equipmentId: string,
    userId: string
  ): Partial<typeof repairHistory.$inferInsert> {
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
  ): Partial<typeof equipmentIncidentHistory.$inferInsert> {
    return {
      equipmentId,
      occurredAt: row.data.occurredAt as Date,
      incidentType: row.data.incidentType as string,
      content: row.data.content as string,
      reportedBy: userId,
    };
  }

  /**
   * 이력 행 배치 INSERT 헬퍼
   *
   * bulkInsertInChunks를 사용해 `unknown as` 캐스팅 없이 타입 안전하게 처리.
   * 호출자가 table-specific insertFn을 제공 → union 타입 문제 회피.
   */
  private async insertHistoryBatch<T extends object>(
    rows: MigrationRowPreview[],
    mgmtNumToId: Map<string, string>,
    buildValues: (row: MigrationRowPreview, equipmentId: string) => T,
    insertFn: (chunk: T[]) => Promise<unknown>
  ): Promise<{ createdCount: number; errors: MigrationRowPreview[] }> {
    const errors: MigrationRowPreview[] = [];
    const validValues: T[] = [];

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
              code: MigrationErrorCode.EQUIPMENT_NOT_FOUND,
            },
          ],
        });
        continue;
      }

      validValues.push(buildValues(row, equipmentId));
    }

    if (validValues.length === 0) return { createdCount: 0, errors };

    await bulkInsertInChunks(insertFn, validValues);

    return { createdCount: validValues.length, errors };
  }

  // ── DB 중복 검사 헬퍼 ────────────────────────────────────────────────────────

  /**
   * 관리번호 배열 → 기존 장비 ID 맵 (Preview 단계 전용)
   * Execute 단계에서는 mgmtNumToId가 이미 트랜잭션 내에서 구축됨.
   */
  private async resolveExistingMgmtNumToId(mgmtNumbers: string[]): Promise<Map<string, string>> {
    if (mgmtNumbers.length === 0) return new Map();
    const rows = await this.db
      .select({ managementNumber: equipment.managementNumber, id: equipment.id })
      .from(equipment)
      .where(inArray(equipment.managementNumber, mgmtNumbers));
    return new Map(rows.map((r) => [r.managementNumber, r.id]));
  }

  /**
   * Preview 단계 이력 DB 중복 마킹 (기존 장비 참조 행 전용)
   * valid/warning 행 중 DB에 이미 존재하는 항목을 'duplicate'로 변환.
   */
  private async markPreviewHistoryDuplicates(
    rowPreviews: MigrationRowPreview[],
    sheetType: 'calibration' | 'repair' | 'incident',
    mgmtNumToId: Map<string, string>
  ): Promise<MigrationRowPreview[]> {
    let filterResult: { toInsert: MigrationRowPreview[]; duplicates: MigrationRowPreview[] };

    if (sheetType === 'calibration') {
      filterResult = await this.filterCalibrationDuplicates(rowPreviews, mgmtNumToId, (ids) =>
        this.db
          .select({
            equipmentId: calibrations.equipmentId,
            calibrationDate: calibrations.calibrationDate,
          })
          .from(calibrations)
          .where(inArray(calibrations.equipmentId, ids))
      );
    } else if (sheetType === 'repair') {
      filterResult = await this.filterRepairDuplicates(rowPreviews, mgmtNumToId, (ids) =>
        this.db
          .select({
            equipmentId: repairHistory.equipmentId,
            repairDate: repairHistory.repairDate,
          })
          .from(repairHistory)
          .where(inArray(repairHistory.equipmentId, ids))
      );
    } else {
      filterResult = await this.filterIncidentDuplicates(rowPreviews, mgmtNumToId, (ids) =>
        this.db
          .select({
            equipmentId: equipmentIncidentHistory.equipmentId,
            occurredAt: equipmentIncidentHistory.occurredAt,
            incidentType: equipmentIncidentHistory.incidentType,
          })
          .from(equipmentIncidentHistory)
          .where(inArray(equipmentIncidentHistory.equipmentId, ids))
      );
    }

    // 원본 순서(rowNumber) 유지하면서 duplicate 마킹 반영
    const duplicateByRowNum = new Map(filterResult.duplicates.map((r) => [r.rowNumber, r]));
    return rowPreviews.map((r) => duplicateByRowNum.get(r.rowNumber) ?? r);
  }

  /**
   * 교정 이력 DB 중복 필터
   * (equipmentId, calibrationDate) 복합키 기준으로 기존 레코드와 비교.
   */
  private async filterCalibrationDuplicates(
    rows: MigrationRowPreview[],
    mgmtNumToId: Map<string, string>,
    queryFn: (ids: string[]) => Promise<Array<{ equipmentId: string; calibrationDate: Date }>>
  ): Promise<{ toInsert: MigrationRowPreview[]; duplicates: MigrationRowPreview[] }> {
    const equipmentIds = [
      ...new Set(
        rows
          .map((r) => (r.managementNumber ? mgmtNumToId.get(r.managementNumber) : undefined))
          .filter((id): id is string => id !== undefined)
      ),
    ];

    if (equipmentIds.length === 0) return { toInsert: rows, duplicates: [] };

    const existing = await queryFn(equipmentIds);
    const existingKeys = new Set(
      existing.map((r) => `${r.equipmentId}:${r.calibrationDate.getTime()}`)
    );

    const toInsert: MigrationRowPreview[] = [];
    const duplicates: MigrationRowPreview[] = [];

    for (const row of rows) {
      if (row.status === 'error') {
        toInsert.push(row);
        continue;
      }
      const equipmentId = row.managementNumber ? mgmtNumToId.get(row.managementNumber) : undefined;
      if (!equipmentId) {
        toInsert.push(row);
        continue;
      }
      const date = row.data.calibrationDate as Date | undefined;
      if (date instanceof Date && existingKeys.has(`${equipmentId}:${date.getTime()}`)) {
        duplicates.push({
          ...row,
          status: 'duplicate' as const,
          errors: [
            {
              field: 'calibrationDate',
              message: `이미 동일 날짜(${date.toLocaleDateString('ko-KR')})의 교정 기록이 존재합니다.`,
              code: MigrationErrorCode.HISTORY_DB_DUPLICATE,
            },
          ],
        });
      } else {
        toInsert.push(row);
      }
    }

    return { toInsert, duplicates };
  }

  /**
   * 수리 이력 DB 중복 필터
   * (equipmentId, repairDate) 복합키 기준으로 기존 레코드와 비교.
   */
  private async filterRepairDuplicates(
    rows: MigrationRowPreview[],
    mgmtNumToId: Map<string, string>,
    queryFn: (ids: string[]) => Promise<Array<{ equipmentId: string; repairDate: Date }>>
  ): Promise<{ toInsert: MigrationRowPreview[]; duplicates: MigrationRowPreview[] }> {
    const equipmentIds = [
      ...new Set(
        rows
          .map((r) => (r.managementNumber ? mgmtNumToId.get(r.managementNumber) : undefined))
          .filter((id): id is string => id !== undefined)
      ),
    ];

    if (equipmentIds.length === 0) return { toInsert: rows, duplicates: [] };

    const existing = await queryFn(equipmentIds);
    const existingKeys = new Set(existing.map((r) => `${r.equipmentId}:${r.repairDate.getTime()}`));

    const toInsert: MigrationRowPreview[] = [];
    const duplicates: MigrationRowPreview[] = [];

    for (const row of rows) {
      if (row.status === 'error') {
        toInsert.push(row);
        continue;
      }
      const equipmentId = row.managementNumber ? mgmtNumToId.get(row.managementNumber) : undefined;
      if (!equipmentId) {
        toInsert.push(row);
        continue;
      }
      const date = row.data.repairDate as Date | undefined;
      if (date instanceof Date && existingKeys.has(`${equipmentId}:${date.getTime()}`)) {
        duplicates.push({
          ...row,
          status: 'duplicate' as const,
          errors: [
            {
              field: 'repairDate',
              message: `이미 동일 날짜(${date.toLocaleDateString('ko-KR')})의 수리 기록이 존재합니다.`,
              code: MigrationErrorCode.HISTORY_DB_DUPLICATE,
            },
          ],
        });
      } else {
        toInsert.push(row);
      }
    }

    return { toInsert, duplicates };
  }

  /**
   * 사고 이력 DB 중복 필터
   * (equipmentId, occurredAt, incidentType) 복합키 기준으로 기존 레코드와 비교.
   */
  private async filterIncidentDuplicates(
    rows: MigrationRowPreview[],
    mgmtNumToId: Map<string, string>,
    queryFn: (
      ids: string[]
    ) => Promise<Array<{ equipmentId: string; occurredAt: Date; incidentType: string }>>
  ): Promise<{ toInsert: MigrationRowPreview[]; duplicates: MigrationRowPreview[] }> {
    const equipmentIds = [
      ...new Set(
        rows
          .map((r) => (r.managementNumber ? mgmtNumToId.get(r.managementNumber) : undefined))
          .filter((id): id is string => id !== undefined)
      ),
    ];

    if (equipmentIds.length === 0) return { toInsert: rows, duplicates: [] };

    const existing = await queryFn(equipmentIds);
    const existingKeys = new Set(
      existing.map((r) => `${r.equipmentId}:${r.occurredAt.getTime()}:${r.incidentType}`)
    );

    const toInsert: MigrationRowPreview[] = [];
    const duplicates: MigrationRowPreview[] = [];

    for (const row of rows) {
      if (row.status === 'error') {
        toInsert.push(row);
        continue;
      }
      const equipmentId = row.managementNumber ? mgmtNumToId.get(row.managementNumber) : undefined;
      if (!equipmentId) {
        toInsert.push(row);
        continue;
      }
      const date = row.data.occurredAt as Date | undefined;
      const incidentType = row.data.incidentType as string | undefined;
      if (
        date instanceof Date &&
        incidentType &&
        existingKeys.has(`${equipmentId}:${date.getTime()}:${incidentType}`)
      ) {
        duplicates.push({
          ...row,
          status: 'duplicate' as const,
          errors: [
            {
              field: 'occurredAt',
              message: `이미 동일 날짜(${date.toLocaleDateString('ko-KR')})·유형(${incidentType})의 사고 기록이 존재합니다.`,
              code: MigrationErrorCode.HISTORY_DB_DUPLICATE,
            },
          ],
        });
      } else {
        toInsert.push(row);
      }
    }

    return { toInsert, duplicates };
  }
}
