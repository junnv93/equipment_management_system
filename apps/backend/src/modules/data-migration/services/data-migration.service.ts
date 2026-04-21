import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { getTableColumns, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import {
  parseManagementNumber,
  EquipmentStatusEnum,
  ApprovalStatusValues,
  CalibrationStatusEnum,
  CalibrationApprovalStatusValues,
  MIGRATION_ROW_STATUS,
  MIGRATION_SHEET_TYPE,
  MIGRATION_SESSION_STATUS,
  INSERTABLE_STATUSES,
  CableStatusValues,
  SoftwareAvailabilityValues,
  CalibrationFactorApprovalStatusValues,
  NonConformanceStatusValues,
} from '@equipment-management/schemas';
import type { Site, MigrationSheetType } from '@equipment-management/schemas';
import { MigrationErrorCode } from '@equipment-management/shared-constants';
import { equipment } from '@equipment-management/db/schema/equipment';
import { calibrations } from '@equipment-management/db/schema/calibrations';
import { repairHistory } from '@equipment-management/db/schema/repair-history';
import { equipmentIncidentHistory } from '@equipment-management/db/schema/equipment-incident-history';
import { cables } from '@equipment-management/db/schema/cables';
import { testSoftware } from '@equipment-management/db/schema/test-software';
import { calibrationFactors } from '@equipment-management/db/schema/calibration-factors';
import { nonConformances } from '@equipment-management/db/schema/non-conformances';
import type { AppDatabase } from '@equipment-management/db';
import type { MulterFile } from '../../../types/common.types';
import { FileUploadService } from '../../../common/file-upload/file-upload.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES, CABLES_CACHE_PREFIX } from '../../../common/cache/cache-key-prefixes';
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
import { MIGRATION_NOTE } from '../constants/excel-labels';
import { MigrationValidatorService } from './migration-validator.service';
import { HistoryValidatorService } from './history-validator.service';
import { FkResolutionService } from './fk-resolution.service';
import type { FkResolutionResult } from './fk-resolution.service';
import { BATCH_QUERY_LIMITS } from '@equipment-management/shared-constants';
import type { PreviewEquipmentMigrationDto } from '../dto/preview-migration.dto';
import type { ExecuteEquipmentMigrationDto } from '../dto/execute-migration.dto';

/** DB equipment 테이블의 유효 컬럼 이름 (SSOT: Drizzle 스키마에서 동적 추출) */
const EQUIPMENT_COLUMNS = new Set(Object.keys(getTableColumns(equipment)));

import {
  MIGRATION_SESSION_TTL_MS,
  MIGRATION_EXECUTION_TIMEOUT_MS,
} from '@equipment-management/shared-constants';
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
    private readonly historyValidatorService: HistoryValidatorService,
    private readonly fkResolutionService: FkResolutionService
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

    try {
      const parsedSheets = await this.excelParserService.parseMultiSheetBuffer(file.buffer);

      // 장비 시트 유효 관리번호 Set 구축 (이력 시트 크로스 검증용)
      const equipmentMgmtNumbers = new Set<string>();
      const sheetResults: SheetPreviewResult[] = [];

      for (const parsedSheet of parsedSheets) {
        if (parsedSheet.sheetType === MIGRATION_SHEET_TYPE.EQUIPMENT) {
          const rowPreviews = await this.migrationValidatorService.validateBatch(parsedSheet.rows, {
            autoGenerateManagementNumber: dto.autoGenerateManagementNumber ?? false,
            defaultSite: effectiveSite,
            skipDuplicates: dto.skipDuplicates ?? true,
          });

          // 유효 관리번호 수집
          for (const row of rowPreviews) {
            if (row.managementNumber && INSERTABLE_STATUSES.has(row.status)) {
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

      // 장비 시트는 1개만 지원 — FK 해석 Map이 단일 validRows 인덱스 기준으로 구성되기 때문
      const equipmentSheets = sheetResults.filter(
        (s) => s.sheetType === MIGRATION_SHEET_TYPE.EQUIPMENT
      );
      if (equipmentSheets.length > 1) {
        throw new BadRequestException({
          code: MigrationErrorCode.MULTIPLE_EQUIPMENT_SHEETS,
          message: '장비 시트는 1개만 허용됩니다.',
        });
      }

      // FK 해석: 장비 시트의 유효 행에서 담당자/부담당자/팀 UUID 해석
      let fkResolutions: Map<number, FkResolutionResult> | undefined;
      let fkResolutionSummary: import('./fk-resolution.service').FkResolutionSummary | undefined;
      const equipmentSheet = sheetResults.find(
        (s) => s.sheetType === MIGRATION_SHEET_TYPE.EQUIPMENT
      );
      if (equipmentSheet) {
        const validRows = equipmentSheet.rows.filter((r) => INSERTABLE_STATUSES.has(r.status));
        const hasFkFields = validRows.some(
          (r) =>
            r.data.managerEmail ||
            r.data.managerName ||
            r.data.deputyManagerEmail ||
            r.data.deputyManagerName
        );
        if (hasFkFields) {
          const resolved = await this.fkResolutionService.resolveBatch(validRows);
          fkResolutions = resolved.results;
          fkResolutionSummary = resolved.summary;

          // FK 해석 경고를 행의 warnings에 추가
          for (const [idx, res] of resolved.results) {
            const row = validRows[idx];
            if (row && res.warnings.length > 0) {
              row.warnings.push(...res.warnings);
            }
          }
        }
      }

      // FK 해석: 시험용 SW 시트의 주담당자/부담당자 UUID 해석
      let testSoftwareFkResolutions: Map<number, FkResolutionResult> | undefined;
      const testSoftwareSheet = sheetResults.find(
        (s) => s.sheetType === MIGRATION_SHEET_TYPE.TEST_SOFTWARE
      );
      if (testSoftwareSheet) {
        const validRows = testSoftwareSheet.rows.filter((r) => INSERTABLE_STATUSES.has(r.status));
        const hasFkFields = validRows.some(
          (r) =>
            r.data.primaryManagerEmail ||
            r.data.primaryManagerName ||
            r.data.secondaryManagerEmail ||
            r.data.secondaryManagerName
        );
        if (hasFkFields) {
          const resolved = await this.fkResolutionService.resolveBatch(validRows, {
            managerEmail: 'primaryManagerEmail',
            managerName: 'primaryManagerName',
            deputyEmail: 'secondaryManagerEmail',
            deputyName: 'secondaryManagerName',
          });
          testSoftwareFkResolutions = resolved.results;

          // FK 요약에 합산 (장비 + 시험용 SW)
          if (fkResolutionSummary) {
            fkResolutionSummary.resolvedManagers += resolved.summary.resolvedManagers;
            fkResolutionSummary.unresolvedManagers += resolved.summary.unresolvedManagers;
            fkResolutionSummary.resolvedDeputyManagers += resolved.summary.resolvedDeputyManagers;
            fkResolutionSummary.unresolvedDeputyManagers +=
              resolved.summary.unresolvedDeputyManagers;
          } else {
            fkResolutionSummary = resolved.summary;
          }

          for (const [idx, res] of resolved.results) {
            const row = validRows[idx];
            if (row && res.warnings.length > 0) {
              row.warnings.push(...res.warnings);
            }
          }
        }
      }

      // 장비 시트가 없을 때: 이력 행의 관리번호를 DB에서 검증하여 merge
      if (equipmentMgmtNumbers.size === 0) {
        const historyMgmtNums = new Set<string>();
        for (const ps of parsedSheets) {
          if (ps.sheetType === MIGRATION_SHEET_TYPE.EQUIPMENT) continue;
          for (const row of ps.rows) {
            const mn = row.mappedData?.managementNumber as string | undefined;
            if (mn) historyMgmtNums.add(mn);
          }
        }
        if (historyMgmtNums.size > 0) {
          const dbMgmtNumToId = await this.resolveExistingMgmtNumToId([...historyMgmtNums]);
          for (const mn of dbMgmtNumToId.keys()) {
            equipmentMgmtNumbers.add(mn);
          }
        }
      }

      // 이력 시트 처리 (장비 시트 완료 후)
      for (const parsedSheet of parsedSheets) {
        if (parsedSheet.sheetType === MIGRATION_SHEET_TYPE.EQUIPMENT) continue;

        let rowPreviews: MigrationRowPreview[];

        if (parsedSheet.sheetType === MIGRATION_SHEET_TYPE.CALIBRATION) {
          rowPreviews = this.historyValidatorService.validateCalibrationBatch(
            parsedSheet.rows,
            equipmentMgmtNumbers
          );
        } else if (parsedSheet.sheetType === MIGRATION_SHEET_TYPE.REPAIR) {
          rowPreviews = this.historyValidatorService.validateRepairBatch(
            parsedSheet.rows,
            equipmentMgmtNumbers
          );
        } else if (parsedSheet.sheetType === MIGRATION_SHEET_TYPE.INCIDENT) {
          rowPreviews = this.historyValidatorService.validateIncidentBatch(
            parsedSheet.rows,
            equipmentMgmtNumbers
          );
        } else if (parsedSheet.sheetType === MIGRATION_SHEET_TYPE.CABLE) {
          rowPreviews = this.historyValidatorService.validateCableBatch(parsedSheet.rows);
        } else if (parsedSheet.sheetType === MIGRATION_SHEET_TYPE.TEST_SOFTWARE) {
          rowPreviews = this.historyValidatorService.validateTestSoftwareBatch(parsedSheet.rows);
        } else if (parsedSheet.sheetType === MIGRATION_SHEET_TYPE.CALIBRATION_FACTOR) {
          rowPreviews = this.historyValidatorService.validateCalibrationFactorBatch(
            parsedSheet.rows,
            equipmentMgmtNumbers
          );
        } else {
          // NON_CONFORMANCE
          rowPreviews = this.historyValidatorService.validateNonConformanceBatch(
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
                  INSERTABLE_STATUSES.has(r.status) &&
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
        fkResolutionSummary,
      };

      // 멀티시트 세션 캐시 저장
      const session: MultiSheetMigrationSession = {
        sessionId,
        fileName: file.originalname,
        uploadedAt: new Date(),
        userId,
        status: MIGRATION_SESSION_STATUS.PREVIEW,
        filePath: savedFile.filePath,
        fkResolutions,
        testSoftwareFkResolutions,
        fkResolutionSummary,
        sheets: sheetResults.map((s) => ({
          sheetType: s.sheetType,
          sheetName: s.sheetName,
          rows: s.rows,
        })),
      };
      this.cacheService.set(
        `${MULTI_SESSION_CACHE_KEY_PREFIX}${sessionId}`,
        session,
        MIGRATION_SESSION_TTL_MS
      );

      this.logger.log(
        `MultiSheet Preview complete: sessionId=${sessionId}, ` +
          `sheets=${sheetResults.length}, total=${totalRows}, valid=${validRows}, errors=${errorRows}`
      );

      return result;
    } catch (e) {
      // 파싱/검증 중 에러 발생 시 업로드된 임시 파일 정리 (세션 캐시에 저장되지 않아 executeMultiSheet가 참조 불가)
      try {
        await this.fileUploadService.deleteFile(savedFile.filePath);
      } catch (cleanupError) {
        this.logger.warn(
          `Preview 실패 후 임시 파일 삭제 실패: ${savedFile.filePath}`,
          cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
        );
      }
      throw e;
    }
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

    // 세션 상태 머신: 이중 실행 방지
    if (session.status === MIGRATION_SESSION_STATUS.EXECUTING) {
      const isStale =
        session.executionStartedAt !== undefined &&
        Date.now() - session.executionStartedAt.getTime() > MIGRATION_EXECUTION_TIMEOUT_MS;

      if (isStale) {
        // PREVIEW로 리셋: 이후 FAILED 체크를 통과해 현재 요청이 재실행됨
        this.logger.warn('EXECUTING 세션 stale 판정 — PREVIEW 리셋 후 재실행 허용', {
          sessionId: dto.sessionId,
          elapsedMs: Date.now() - (session.executionStartedAt?.getTime() ?? 0),
        });
        session.status = MIGRATION_SESSION_STATUS.PREVIEW;
        session.executionStartedAt = undefined;
        this.cacheService.set(
          `${MULTI_SESSION_CACHE_KEY_PREFIX}${dto.sessionId}`,
          session,
          MIGRATION_SESSION_TTL_MS
        );
      } else {
        throw new ConflictException({
          code: MigrationErrorCode.SESSION_ALREADY_EXECUTING,
          message: '이미 실행 중인 세션입니다. 완료될 때까지 기다려주세요.',
        });
      }
    }
    if (session.status === MIGRATION_SESSION_STATUS.COMPLETED) {
      throw new ConflictException({
        code: MigrationErrorCode.SESSION_ALREADY_COMPLETED,
        message: '이미 완료된 세션입니다. 추가 마이그레이션은 새로 업로드하세요.',
      });
    }
    if (session.status === MIGRATION_SESSION_STATUS.FAILED) {
      throw new ConflictException({
        code: MigrationErrorCode.SESSION_FAILED,
        message: '실패한 세션입니다. 파일을 다시 업로드하세요.',
      });
    }

    // CAS: status → executing 전환 + stale 판정용 타임스탬프 기록
    session.status = MIGRATION_SESSION_STATUS.EXECUTING;
    session.executionStartedAt = new Date();
    this.cacheService.set(
      `${MULTI_SESSION_CACHE_KEY_PREFIX}${dto.sessionId}`,
      session,
      MIGRATION_SESSION_TTL_MS
    );

    const sheetSummaries: MultiSheetExecuteResult['sheets'] = [];
    const allErrors: MigrationRowPreview[] = [];
    let totalCreated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // managementNumber → equipmentId 맵 (이력 INSERT에 사용)
    const mgmtNumToId = new Map<string, string>();

    try {
      await this.db.transaction(async (tx) => {
        // ── 1. 장비 시트 INSERT ────────────────────────────────────────────────
        for (const sheet of session.sheets) {
          if (sheet.sheetType !== MIGRATION_SHEET_TYPE.EQUIPMENT) continue;

          const validRows = sheet.rows.filter((r) => INSERTABLE_STATUSES.has(r.status));
          const errorRowsForSheet = sheet.rows.filter(
            (r) =>
              r.status === MIGRATION_ROW_STATUS.ERROR || r.status === MIGRATION_ROW_STATUS.DUPLICATE
          );
          const skippedCount = sheet.rows.length - validRows.length - errorRowsForSheet.length;

          let createdCount = 0;
          const sheetErrors: MigrationRowPreview[] = [...errorRowsForSheet];

          const locationEntries: Parameters<
            typeof this.equipmentHistoryService.createLocationHistoryBatch
          >[0] = [];

          const equipChunks = chunkArray(validRows, BATCH_QUERY_LIMITS.MIGRATION_CHUNK_SIZE);
          let chunkOffset = 0;
          for (const chunk of equipChunks) {
            const entities = chunk.map((row, chunkIdx) => {
              // Preview의 fkResolutions Map key = validRows의 numeric index
              // indexOf(row) 대신 chunkOffset + chunkIdx로 명시적 계산 (O(1), object identity 불의존)
              const globalIdx = chunkOffset + chunkIdx;
              const fkResult = session.fkResolutions?.get(globalIdx);
              return this.buildEntityFromRow(
                row,
                userId,
                fkResult
              ) as typeof equipment.$inferInsert;
            });
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
                  notes: MIGRATION_NOTE,
                });
              }
            }
            chunkOffset += chunk.length;
          }

          await this.equipmentHistoryService.createLocationHistoryBatch(
            locationEntries,
            userId,
            tx
          );
          createdCount = validRows.length;

          sheetSummaries.push({
            sheetType: MIGRATION_SHEET_TYPE.EQUIPMENT,
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
          if (sheet.sheetType === MIGRATION_SHEET_TYPE.EQUIPMENT) continue;
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
          if (sheet.sheetType !== MIGRATION_SHEET_TYPE.CALIBRATION) continue;

          const candidateRows = sheet.rows.filter((r) => INSERTABLE_STATUSES.has(r.status));
          const sheetErrors: MigrationRowPreview[] = sheet.rows.filter(
            (r) => r.status === MIGRATION_ROW_STATUS.ERROR
          );

          // DB 중복 검사: (equipmentId, calibrationDate, agencyName) 동일 레코드 차단
          const { toInsert: calToInsert, duplicates: calDuplicates } =
            await this.filterCalibrationDuplicates(candidateRows, mgmtNumToId, (ids) =>
              tx
                .select({
                  equipmentId: calibrations.equipmentId,
                  calibrationDate: calibrations.calibrationDate,
                  agencyName: calibrations.agencyName,
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
            sheetType: MIGRATION_SHEET_TYPE.CALIBRATION,
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
          if (sheet.sheetType !== MIGRATION_SHEET_TYPE.REPAIR) continue;

          const candidateRows = sheet.rows.filter((r) => INSERTABLE_STATUSES.has(r.status));
          const sheetErrors: MigrationRowPreview[] = sheet.rows.filter(
            (r) => r.status === MIGRATION_ROW_STATUS.ERROR
          );

          // DB 중복 검사: (equipmentId, repairDate, repairDescription) 동일 레코드 차단
          const { toInsert: repairToInsert, duplicates: repairDuplicates } =
            await this.filterRepairDuplicates(candidateRows, mgmtNumToId, (ids) =>
              tx
                .select({
                  equipmentId: repairHistory.equipmentId,
                  repairDate: repairHistory.repairDate,
                  repairDescription: repairHistory.repairDescription,
                })
                .from(repairHistory)
                .where(inArray(repairHistory.equipmentId, ids))
            );
          sheetErrors.push(...repairDuplicates);

          const { createdCount, errors } = await this.insertHistoryBatch(
            repairToInsert,
            mgmtNumToId,
            (row, equipmentId) => this.buildRepairValues(row, equipmentId, userId),
            (chunk) =>
              tx.insert(repairHistory).values(chunk as (typeof repairHistory.$inferInsert)[])
          );
          sheetErrors.push(...errors);

          sheetSummaries.push({
            sheetType: MIGRATION_SHEET_TYPE.REPAIR,
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
          if (sheet.sheetType !== MIGRATION_SHEET_TYPE.INCIDENT) continue;

          const candidateRows = sheet.rows.filter((r) => INSERTABLE_STATUSES.has(r.status));
          const sheetErrors: MigrationRowPreview[] = sheet.rows.filter(
            (r) => r.status === MIGRATION_ROW_STATUS.ERROR
          );

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
            sheetType: MIGRATION_SHEET_TYPE.INCIDENT,
            createdCount,
            skippedCount: 0,
            errorCount: sheetErrors.length,
          });
          allErrors.push(...sheetErrors);
          totalCreated += createdCount;
          totalErrors += sheetErrors.length;
        }

        // ── 6. 케이블 INSERT (독립 엔티티) ──────────────────────────────────────
        for (const sheet of session.sheets) {
          if (sheet.sheetType !== MIGRATION_SHEET_TYPE.CABLE) continue;
          const candidateRows = sheet.rows.filter((r) => INSERTABLE_STATUSES.has(r.status));
          const sheetErrors: MigrationRowPreview[] = sheet.rows.filter(
            (r) => r.status === MIGRATION_ROW_STATUS.ERROR
          );

          const values = candidateRows.map((row) => this.buildCableValues(row, userId));
          if (values.length > 0) {
            await bulkInsertInChunks(
              (chunk) => tx.insert(cables).values(chunk as (typeof cables.$inferInsert)[]),
              values
            );
          }

          sheetSummaries.push({
            sheetType: MIGRATION_SHEET_TYPE.CABLE,
            createdCount: values.length,
            skippedCount: 0,
            errorCount: sheetErrors.length,
          });
          allErrors.push(...sheetErrors);
          totalCreated += values.length;
          totalErrors += sheetErrors.length;
        }

        // ── 7. 시험용 소프트웨어 INSERT (독립 엔티티) ──────────────────────────
        for (const sheet of session.sheets) {
          if (sheet.sheetType !== MIGRATION_SHEET_TYPE.TEST_SOFTWARE) continue;
          const candidateRows = sheet.rows.filter((r) => INSERTABLE_STATUSES.has(r.status));
          const sheetErrors: MigrationRowPreview[] = sheet.rows.filter(
            (r) => r.status === MIGRATION_ROW_STATUS.ERROR
          );

          const values = candidateRows.map((row, idx) => {
            const fkResult = session.testSoftwareFkResolutions?.get(idx);
            return this.buildTestSoftwareValues(row, userId, fkResult);
          });
          if (values.length > 0) {
            await bulkInsertInChunks(
              (chunk) =>
                tx.insert(testSoftware).values(chunk as (typeof testSoftware.$inferInsert)[]),
              values
            );
          }

          sheetSummaries.push({
            sheetType: MIGRATION_SHEET_TYPE.TEST_SOFTWARE,
            createdCount: values.length,
            skippedCount: 0,
            errorCount: sheetErrors.length,
          });
          allErrors.push(...sheetErrors);
          totalCreated += values.length;
          totalErrors += sheetErrors.length;
        }

        // ── 8. 교정 인자 INSERT (장비 참조) ──────────────────────────────────────
        for (const sheet of session.sheets) {
          if (sheet.sheetType !== MIGRATION_SHEET_TYPE.CALIBRATION_FACTOR) continue;
          const candidateRows = sheet.rows.filter((r) => INSERTABLE_STATUSES.has(r.status));
          const sheetErrors: MigrationRowPreview[] = sheet.rows.filter(
            (r) => r.status === MIGRATION_ROW_STATUS.ERROR
          );

          const { createdCount, errors } = await this.insertHistoryBatch(
            candidateRows,
            mgmtNumToId,
            (row, equipmentId) => this.buildCalibrationFactorValues(row, equipmentId, userId),
            (chunk) =>
              tx
                .insert(calibrationFactors)
                .values(chunk as (typeof calibrationFactors.$inferInsert)[])
          );
          sheetErrors.push(...errors);

          sheetSummaries.push({
            sheetType: MIGRATION_SHEET_TYPE.CALIBRATION_FACTOR,
            createdCount,
            skippedCount: 0,
            errorCount: sheetErrors.length,
          });
          allErrors.push(...sheetErrors);
          totalCreated += createdCount;
          totalErrors += sheetErrors.length;
        }

        // ── 9. 부적합 INSERT (장비 참조) ──────────────────────────────────────────
        for (const sheet of session.sheets) {
          if (sheet.sheetType !== MIGRATION_SHEET_TYPE.NON_CONFORMANCE) continue;
          const candidateRows = sheet.rows.filter((r) => INSERTABLE_STATUSES.has(r.status));
          const sheetErrors: MigrationRowPreview[] = sheet.rows.filter(
            (r) => r.status === MIGRATION_ROW_STATUS.ERROR
          );

          const { createdCount, errors } = await this.insertHistoryBatch(
            candidateRows,
            mgmtNumToId,
            (row, equipmentId) => this.buildNonConformanceValues(row, equipmentId, userId),
            (chunk) =>
              tx.insert(nonConformances).values(chunk as (typeof nonConformances.$inferInsert)[])
          );
          sheetErrors.push(...errors);

          sheetSummaries.push({
            sheetType: MIGRATION_SHEET_TYPE.NON_CONFORMANCE,
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
      if (
        sheetSummaries.some(
          (s) => s.sheetType === MIGRATION_SHEET_TYPE.CALIBRATION && s.createdCount > 0
        )
      ) {
        this.cacheService.deleteByPrefix(`${CACHE_KEY_PREFIXES.CALIBRATION}list:`);
        this.cacheService.deleteByPrefix(`${CACHE_KEY_PREFIXES.CALIBRATION}pending:`);
      }
      // 수리/사고 이력이 등록된 경우 장비 detail 캐시 무효화 (이력 탭 stale 방지)
      if (
        sheetSummaries.some(
          (s) =>
            (s.sheetType === MIGRATION_SHEET_TYPE.REPAIR ||
              s.sheetType === MIGRATION_SHEET_TYPE.INCIDENT) &&
            s.createdCount > 0
        )
      ) {
        this.cacheService.deleteByPrefix(`${CACHE_KEY_PREFIXES.EQUIPMENT}detail:`);
      }
      // 시험용 소프트웨어가 등록된 경우 목록 캐시 무효화
      if (
        sheetSummaries.some(
          (s) => s.sheetType === MIGRATION_SHEET_TYPE.TEST_SOFTWARE && s.createdCount > 0
        )
      ) {
        this.cacheService.deleteByPrefix(CACHE_KEY_PREFIXES.TEST_SOFTWARE);
      }
      // 교정 인자가 등록된 경우 목록 캐시 무효화
      if (
        sheetSummaries.some(
          (s) => s.sheetType === MIGRATION_SHEET_TYPE.CALIBRATION_FACTOR && s.createdCount > 0
        )
      ) {
        this.cacheService.deleteByPrefix(CACHE_KEY_PREFIXES.CALIBRATION_FACTORS);
      }
      // 부적합이 등록된 경우 목록 캐시 무효화
      if (
        sheetSummaries.some(
          (s) => s.sheetType === MIGRATION_SHEET_TYPE.NON_CONFORMANCE && s.createdCount > 0
        )
      ) {
        this.cacheService.deleteByPrefix(CACHE_KEY_PREFIXES.NON_CONFORMANCES);
      }
      // 케이블이 등록된 경우 목록 캐시 무효화
      if (
        sheetSummaries.some((s) => s.sheetType === MIGRATION_SHEET_TYPE.CABLE && s.createdCount > 0)
      ) {
        this.cacheService.deleteByPrefix(CABLES_CACHE_PREFIX);
      }

      // 세션 상태 → completed (에러 리포트 접근용으로 캐시 유지)
      session.status = MIGRATION_SESSION_STATUS.COMPLETED;
      session.executionStartedAt = undefined;
      this.cacheService.set(
        `${MULTI_SESSION_CACHE_KEY_PREFIX}${dto.sessionId}`,
        session,
        MIGRATION_SESSION_TTL_MS
      );

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
    } catch (error) {
      // 트랜잭션 실패 시 세션 상태 → failed
      session.status = MIGRATION_SESSION_STATUS.FAILED;
      session.executionStartedAt = undefined;
      this.cacheService.set(
        `${MULTI_SESSION_CACHE_KEY_PREFIX}${dto.sessionId}`,
        session,
        MIGRATION_SESSION_TTL_MS
      );
      throw error;
    } finally {
      // 업로드된 임시 파일 삭제 — 성공/실패 모두 실행하여 스토리지 누적 방지
      if (session.filePath) {
        try {
          await this.fileUploadService.deleteFile(session.filePath);
        } catch (e) {
          this.logger.warn(
            `마이그레이션 임시 파일 삭제 실패: ${session.filePath}`,
            e instanceof Error ? e.message : String(e)
          );
        }
      }
    }
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

    const allRows: MigrationRowPreview[] = [];
    for (const sheet of session.sheets) {
      allRows.push(...sheet.rows);
    }

    return this.excelParserService.generateErrorReport(this.toErrorReportRows(allRows));
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
    _userId: string,
    fkResult?: FkResolutionResult
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

    // location: initialLocation 우선, fallback으로 Excel 'location' 직접입력도 반영
    const resolvedLocation = (data.initialLocation ?? data.location) as string | undefined;
    if (resolvedLocation) {
      entity['location'] = resolvedLocation;
    }

    // FK 해석 결과 주입 (FkResolutionService가 Preview 시 해석)
    if (fkResult?.managerId) entity['managerId'] = fkResult.managerId;
    if (fkResult?.deputyManagerId) entity['deputyManagerId'] = fkResult.deputyManagerId;
    if (fkResult?.teamId) entity['teamId'] = fkResult.teamId;

    // CUSTOM_HANDLED: 위에서 이미 처리된 필드 + FK 가상 필드 (DB 컬럼 아님)
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
      'location', // initialLocation ?? location 기반으로 설정 완료
      'managerId', // FK 해석으로 처리
      'deputyManagerId', // FK 해석으로 처리
      'teamId', // FK 해석으로 처리
      'managerEmail', // 가상 해석 필드 (DB 컬럼 아님)
      'managerName', // 가상 해석 필드 (DB 컬럼 아님)
      'deputyManagerEmail', // 가상 해석 필드 (DB 컬럼 아님)
      'deputyManagerName', // 가상 해석 필드 (DB 컬럼 아님)
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
      if (row.status === MIGRATION_ROW_STATUS.VALID) counts.validRows++;
      else if (row.status === MIGRATION_ROW_STATUS.ERROR) counts.errorRows++;
      else if (row.status === MIGRATION_ROW_STATUS.DUPLICATE) counts.duplicateRows++;
      else if (row.status === MIGRATION_ROW_STATUS.WARNING) counts.warningRows++;
    }
    return counts;
  }

  private buildCalibrationValues(
    row: MigrationRowPreview,
    equipmentId: string,
    userId: string
  ): Partial<typeof calibrations.$inferInsert> {
    const calibrationDate = row.data.calibrationDate as Date;
    return {
      equipmentId,
      calibrationDate,
      completionDate: (row.data.completionDate as Date | undefined) ?? calibrationDate,
      agencyName: row.data.agencyName as string | undefined,
      certificateNumber: row.data.certificateNumber as string | undefined,
      result: row.data.result as string | undefined,
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

  /** 케이블 행 → DB values 변환 (독립 엔티티) */
  private buildCableValues(
    row: MigrationRowPreview,
    userId: string
  ): Partial<typeof cables.$inferInsert> {
    type CableInsert = typeof cables.$inferInsert;
    return {
      managementNumber: row.managementNumber ?? (row.data.managementNumber as string),
      length: row.data.length as string | undefined,
      connectorType: row.data.connectorType as CableInsert['connectorType'],
      frequencyRangeMin: row.data.frequencyRangeMin as number | undefined,
      frequencyRangeMax: row.data.frequencyRangeMax as number | undefined,
      serialNumber: row.data.serialNumber as string | undefined,
      location: row.data.location as string | undefined,
      site: row.data.site as CableInsert['site'],
      lastMeasurementDate: row.data.lastMeasurementDate as Date | undefined,
      status: CableStatusValues.ACTIVE,
      createdBy: userId,
      version: 1,
    };
  }

  /** 시험용 소프트웨어 행 → DB values 변환 (독립 엔티티) */
  private buildTestSoftwareValues(
    row: MigrationRowPreview,
    userId: string,
    fkResult?: FkResolutionResult
  ): Partial<typeof testSoftware.$inferInsert> {
    type TsInsert = typeof testSoftware.$inferInsert;
    return {
      managementNumber: row.managementNumber ?? (row.data.managementNumber as string),
      name: row.data.name as string,
      softwareVersion: row.data.softwareVersion as string | undefined,
      testField: row.data.testField as TsInsert['testField'],
      manufacturer: row.data.manufacturer as string | undefined,
      location: row.data.location as string | undefined,
      installedAt: row.data.installedAt as TsInsert['installedAt'],
      requiresValidation: (row.data.requiresValidation as boolean | undefined) ?? true,
      availability: SoftwareAvailabilityValues.AVAILABLE,
      site: row.data.site as TsInsert['site'],
      primaryManagerId: fkResult?.managerId,
      secondaryManagerId: fkResult?.deputyManagerId,
      createdBy: userId,
      version: 1,
    };
  }

  /** 교정 인자 행 → DB values 변환 (장비 참조) */
  private buildCalibrationFactorValues(
    row: MigrationRowPreview,
    equipmentId: string,
    userId: string
  ): Partial<typeof calibrationFactors.$inferInsert> {
    type CfInsert = typeof calibrationFactors.$inferInsert;
    const effectiveDate = row.data.effectiveDate as Date;
    const expiryDate = row.data.expiryDate as Date | undefined;
    return {
      equipmentId,
      factorType: row.data.factorType as CfInsert['factorType'],
      factorName: row.data.factorName as string,
      factorValue: String(row.data.factorValue),
      unit: row.data.unit as string,
      effectiveDate: effectiveDate.toISOString(),
      expiryDate: expiryDate?.toISOString() ?? null,
      approvalStatus: CalibrationFactorApprovalStatusValues.APPROVED,
      requestedBy: userId,
      approvedBy: userId,
      approvedAt: new Date(),
      version: 1,
    };
  }

  /** 부적합 행 → DB values 변환 (장비 참조) */
  private buildNonConformanceValues(
    row: MigrationRowPreview,
    equipmentId: string,
    userId: string
  ): Partial<typeof nonConformances.$inferInsert> {
    type NcInsert = typeof nonConformances.$inferInsert;
    const correctionDate = row.data.correctionDate as Date | undefined;
    const discoveryDate = row.data.discoveryDate as Date;
    return {
      equipmentId,
      discoveryDate: discoveryDate.toISOString(),
      discoveredBy: userId,
      ncType: row.data.ncType as NcInsert['ncType'],
      cause: row.data.cause as string,
      actionPlan: row.data.actionPlan as string | undefined,
      correctionContent: row.data.correctionContent as string | undefined,
      resolutionType: row.data.resolutionType as NcInsert['resolutionType'],
      correctionDate: correctionDate?.toISOString() ?? null,
      correctedBy: correctionDate ? userId : undefined,
      status: correctionDate ? NonConformanceStatusValues.CLOSED : NonConformanceStatusValues.OPEN,
      closedBy: correctionDate ? userId : undefined,
      closedAt: correctionDate ? new Date() : undefined,
      version: 1,
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
          status: MIGRATION_ROW_STATUS.ERROR,
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
    sheetType: Exclude<MigrationSheetType, 'equipment'>,
    mgmtNumToId: Map<string, string>
  ): Promise<MigrationRowPreview[]> {
    let filterResult: { toInsert: MigrationRowPreview[]; duplicates: MigrationRowPreview[] };

    if (sheetType === MIGRATION_SHEET_TYPE.CALIBRATION) {
      filterResult = await this.filterCalibrationDuplicates(rowPreviews, mgmtNumToId, (ids) =>
        this.db
          .select({
            equipmentId: calibrations.equipmentId,
            calibrationDate: calibrations.calibrationDate,
            agencyName: calibrations.agencyName,
          })
          .from(calibrations)
          .where(inArray(calibrations.equipmentId, ids))
      );
    } else if (sheetType === MIGRATION_SHEET_TYPE.REPAIR) {
      filterResult = await this.filterRepairDuplicates(rowPreviews, mgmtNumToId, (ids) =>
        this.db
          .select({
            equipmentId: repairHistory.equipmentId,
            repairDate: repairHistory.repairDate,
            repairDescription: repairHistory.repairDescription,
          })
          .from(repairHistory)
          .where(inArray(repairHistory.equipmentId, ids))
      );
    } else if (sheetType === MIGRATION_SHEET_TYPE.INCIDENT) {
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
    } else {
      // CABLE / TEST_SOFTWARE / CALIBRATION_FACTOR / NON_CONFORMANCE:
      // 독립 엔티티 — equipment FK 기반 중복 필터 없음. 모두 삽입 대상.
      filterResult = { toInsert: rowPreviews, duplicates: [] };
    }

    // 원본 순서(rowNumber) 유지하면서 duplicate 마킹 반영
    const duplicateByRowNum = new Map(filterResult.duplicates.map((r) => [r.rowNumber, r]));
    return rowPreviews.map((r) => duplicateByRowNum.get(r.rowNumber) ?? r);
  }

  /**
   * 교정 이력 DB 중복 필터
   * (equipmentId, calibrationDate, agencyName) 복합키 기준으로 기존 레코드와 비교.
   */
  private async filterCalibrationDuplicates(
    rows: MigrationRowPreview[],
    mgmtNumToId: Map<string, string>,
    queryFn: (
      ids: string[]
    ) => Promise<Array<{ equipmentId: string; calibrationDate: Date; agencyName: string | null }>>
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
      existing.map((r) => `${r.equipmentId}:${r.calibrationDate.getTime()}:${r.agencyName ?? ''}`)
    );

    const toInsert: MigrationRowPreview[] = [];
    const duplicates: MigrationRowPreview[] = [];

    for (const row of rows) {
      if (row.status === MIGRATION_ROW_STATUS.ERROR) {
        toInsert.push(row);
        continue;
      }
      const equipmentId = row.managementNumber ? mgmtNumToId.get(row.managementNumber) : undefined;
      if (!equipmentId) {
        toInsert.push(row);
        continue;
      }
      const date = row.data.calibrationDate as Date | undefined;
      const agency = (row.data.agencyName as string) ?? '';
      const key = `${equipmentId}:${date instanceof Date ? date.getTime() : ''}:${agency}`;
      if (date instanceof Date && existingKeys.has(key)) {
        duplicates.push({
          ...row,
          status: MIGRATION_ROW_STATUS.DUPLICATE,
          errors: [
            {
              field: 'calibrationDate',
              message: `동일 날짜(${date.toLocaleDateString('ko-KR')}) + 동일 기관(${agency || '미지정'})의 교정 기록이 이미 존재합니다.`,
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
   * (equipmentId, repairDate, repairDescription) 복합키 기준으로 기존 레코드와 비교.
   */
  private async filterRepairDuplicates(
    rows: MigrationRowPreview[],
    mgmtNumToId: Map<string, string>,
    queryFn: (
      ids: string[]
    ) => Promise<Array<{ equipmentId: string; repairDate: Date; repairDescription: string | null }>>
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
      existing.map((r) => `${r.equipmentId}:${r.repairDate.getTime()}:${r.repairDescription ?? ''}`)
    );

    const toInsert: MigrationRowPreview[] = [];
    const duplicates: MigrationRowPreview[] = [];

    for (const row of rows) {
      if (row.status === MIGRATION_ROW_STATUS.ERROR) {
        toInsert.push(row);
        continue;
      }
      const equipmentId = row.managementNumber ? mgmtNumToId.get(row.managementNumber) : undefined;
      if (!equipmentId) {
        toInsert.push(row);
        continue;
      }
      const date = row.data.repairDate as Date | undefined;
      const desc = (row.data.repairDescription as string) ?? '';
      const key = `${equipmentId}:${date instanceof Date ? date.getTime() : ''}:${desc}`;
      if (date instanceof Date && existingKeys.has(key)) {
        duplicates.push({
          ...row,
          status: MIGRATION_ROW_STATUS.DUPLICATE,
          errors: [
            {
              field: 'repairDate',
              message: `동일 날짜(${date.toLocaleDateString('ko-KR')}) + 동일 수리내용의 수리 기록이 이미 존재합니다.`,
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
      if (row.status === MIGRATION_ROW_STATUS.ERROR) {
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
          status: MIGRATION_ROW_STATUS.DUPLICATE,
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
