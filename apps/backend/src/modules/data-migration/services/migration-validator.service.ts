import { Injectable, Inject } from '@nestjs/common';
import { and, eq, inArray, max, like } from 'drizzle-orm';
import { z } from 'zod';
import {
  createEquipmentSchema,
  baseEquipmentSchema,
  parseManagementNumber,
  generateManagementNumber,
  generateTemporaryManagementNumber,
  SITE_TO_CODE,
  CLASSIFICATION_TO_CODE,
  ClassificationEnum,
  type Site,
  type Classification,
  MIGRATION_ROW_STATUS,
  INSERTABLE_STATUSES,
  ApprovalStatusValues,
  EquipmentStatusEnum,
} from '@equipment-management/schemas';
import { equipment } from '@equipment-management/db/schema/equipment';
import type { AppDatabase } from '@equipment-management/db';
import type {
  MappedRow,
  MigrationRowPreview,
  RowFieldError,
  ManagementNumberGroup,
} from '../types/data-migration.types';
import { EQUIPMENT_COLUMN_MAPPING } from '../constants/equipment-column-mapping';
import { SHARED_EQUIPMENT_COLUMN_MAPPING } from '../constants/shared-equipment-column-mapping';
import { MigrationErrorCode } from '@equipment-management/shared-constants';

/**
 * 공용장비 마이그레이션 전용 Zod 스키마
 * baseEquipmentSchema에서 공용장비 필수 필드만 추려서 검증
 */
const createSharedEquipmentMigrationSchema = baseEquipmentSchema.extend({
  initialLocation: z.string().min(1, '설치위치는 필수입니다.'),
  owner: z.string().min(1, '소유처는 필수입니다.'),
  classification: ClassificationEnum,
  usagePeriodStart: z.coerce.date(),
});

/**
 * 마이그레이션 행 검증 서비스
 *
 * 역할:
 * - MappedRow → Zod 스키마 검증 (createEquipmentSchema 재사용)
 * - DB 관리번호 중복 배치 조회 (N+1 방지)
 * - 파일 내 중복 탐지
 * - 관리번호 자동 생성 (site + classification 그룹별 sequential)
 */
@Injectable()
export class MigrationValidatorService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

  /**
   * 배치 검증 (Preview용)
   *
   * 1. 관리번호 자동 생성 (옵션)
   * 2. DB 중복 배치 조회 (WHERE IN — 단일 쿼리)
   * 3. 행별 Zod 검증
   * 4. 파일 내 중복 탐지
   */
  async validateBatch(
    mappedRows: MappedRow[],
    options: {
      autoGenerateManagementNumber: boolean;
      defaultSite?: string;
      skipDuplicates: boolean;
    }
  ): Promise<MigrationRowPreview[]> {
    // defaultSite 적용
    const rowsWithSite = mappedRows.map((row) => {
      if (!row.mappedData.site && options.defaultSite) {
        return {
          ...row,
          mappedData: { ...row.mappedData, site: options.defaultSite },
        };
      }
      return row;
    });

    // 자동 관리번호 생성
    const rowsWithMgmtNum = options.autoGenerateManagementNumber
      ? await this.assignManagementNumbers(rowsWithSite)
      : rowsWithSite;

    // DB 중복 체크를 위한 배치 조회
    const allMgmtNumbers = rowsWithMgmtNum
      .map((r) => r.mappedData.managementNumber)
      .filter((n): n is string => typeof n === 'string' && n.trim().length > 0);

    const existingInDb = await this.fetchExistingManagementNumbers(allMgmtNumbers);

    // 파일 내 중복 탐지
    const inFileDuplicates = this.detectInFileDuplicates(rowsWithMgmtNum);

    // 행별 검증
    const results: MigrationRowPreview[] = [];
    for (const row of rowsWithMgmtNum) {
      const preview = this.validateRow(row, existingInDb, inFileDuplicates);
      results.push(preview);
    }

    return results;
  }

  /**
   * 공용장비 배치 검증 (Preview용)
   *
   * 일반 장비와의 차이점:
   * - isShared=true, status='temporary', approvalStatus='approved' 자동 주입
   * - 관리번호 미기입 시 TEMP- 형식 자동 생성 (site + classification 기반)
   * - createSharedEquipmentMigrationSchema로 공용장비 필수 필드 검증
   */
  async validateSharedBatch(
    mappedRows: MappedRow[],
    options: { defaultSite?: string }
  ): Promise<MigrationRowPreview[]> {
    // 자동 주입: 사용자가 입력하지 않는 필드
    const rowsWithDefaults = mappedRows.map((row) => ({
      ...row,
      mappedData: {
        ...row.mappedData,
        ...(!row.mappedData.site && options.defaultSite ? { site: options.defaultSite } : {}),
        isShared: true,
        status: EquipmentStatusEnum.enum.temporary,
        approvalStatus: ApprovalStatusValues.APPROVED,
      },
    }));

    // TEMP- 관리번호 자동 생성
    const rowsWithMgmtNum = await this.assignTemporaryManagementNumbers(rowsWithDefaults);

    // DB 중복 체크 (TEMP- 번호 포함)
    const allMgmtNumbers = rowsWithMgmtNum
      .map((r) => r.mappedData.managementNumber)
      .filter((n): n is string => typeof n === 'string' && n.trim().length > 0);
    const existingInDb = await this.fetchExistingManagementNumbers(allMgmtNumbers);

    // 파일 내 중복 탐지
    const inFileDuplicates = this.detectInFileDuplicates(rowsWithMgmtNum);

    const results: MigrationRowPreview[] = [];
    for (const row of rowsWithMgmtNum) {
      const errors: RowFieldError[] = [];
      const warnings: string[] = [];
      const data = { ...row.mappedData };

      // 파일 내 중복
      if (inFileDuplicates.has(row.rowNumber)) {
        const firstRow = inFileDuplicates.get(row.rowNumber)!;
        results.push({
          rowNumber: row.rowNumber,
          status: MIGRATION_ROW_STATUS.DUPLICATE,
          data,
          errors: [
            {
              field: 'managementNumber',
              message: `파일 내 중복 관리번호입니다. (첫 번째 발생: ${firstRow}행)`,
              code: MigrationErrorCode.IN_FILE_DUPLICATE,
            },
          ],
          warnings: [],
          managementNumber: data.managementNumber as string | undefined,
        });
        continue;
      }

      // DB 중복
      const mgmtNum = data.managementNumber as string | undefined;
      if (mgmtNum && existingInDb.has(mgmtNum)) {
        results.push({
          rowNumber: row.rowNumber,
          status: MIGRATION_ROW_STATUS.DUPLICATE,
          data,
          errors: [
            {
              field: 'managementNumber',
              message: '이미 등록된 관리번호입니다.',
              code: MigrationErrorCode.DB_DUPLICATE,
            },
          ],
          warnings: [],
          managementNumber: mgmtNum,
          existingEquipmentId: existingInDb.get(mgmtNum),
        });
        continue;
      }

      // Zod 검증 (공용장비 전용 스키마)
      const parseResult = createSharedEquipmentMigrationSchema.safeParse(data);
      if (!parseResult.success) {
        const zodErrors = parseResult.error.issues.map(
          (e): RowFieldError => ({
            field: e.path.join('.') || 'unknown',
            message: this.translateSharedZodError(e.message, e.path[0] as string),
            code: e.code.toUpperCase(),
          })
        );
        errors.push(...zodErrors);
      }

      if (row.unmappedColumns.length > 0) {
        warnings.push(`인식되지 않은 컬럼: ${row.unmappedColumns.join(', ')}`);
      }

      results.push({
        rowNumber: row.rowNumber,
        status:
          errors.length > 0
            ? MIGRATION_ROW_STATUS.ERROR
            : warnings.length > 0
              ? MIGRATION_ROW_STATUS.WARNING
              : MIGRATION_ROW_STATUS.VALID,
        data,
        errors,
        warnings,
        managementNumber: mgmtNum,
      });
    }

    return results;
  }

  /**
   * 유효한 행만 추출 (Execute용)
   * selectedRowNumbers가 있으면 해당 행만 필터링
   */
  filterValidRows(
    previews: MigrationRowPreview[],
    selectedRowNumbers?: number[]
  ): MigrationRowPreview[] {
    const validStatuses = INSERTABLE_STATUSES;
    return previews.filter((p) => {
      if (!validStatuses.has(p.status)) return false;
      if (selectedRowNumbers && !selectedRowNumbers.includes(p.rowNumber)) return false;
      return true;
    });
  }

  // ── Private Methods ──────────────────────────────────────────────────────────

  /**
   * 단일 행 Zod 검증 + 중복 상태 결정
   */
  private validateRow(
    row: MappedRow,
    existingInDb: Map<string, string>, // managementNumber → equipmentId
    inFileDuplicates: Map<number, number> // rowNumber → firstOccurrenceRowNumber
  ): MigrationRowPreview {
    const errors: RowFieldError[] = [];
    const warnings: string[] = [];
    const data = { ...row.mappedData };

    // 파일 내 중복 체크
    if (inFileDuplicates.has(row.rowNumber)) {
      const firstRow = inFileDuplicates.get(row.rowNumber)!;
      return {
        rowNumber: row.rowNumber,
        status: MIGRATION_ROW_STATUS.DUPLICATE,
        data,
        errors: [
          {
            field: 'managementNumber',
            message: `파일 내 중복 관리번호입니다. (첫 번째 발생: ${firstRow}행)`,
            code: MigrationErrorCode.IN_FILE_DUPLICATE,
          },
        ],
        warnings: [],
        managementNumber: data.managementNumber as string | undefined,
      };
    }

    // DB 중복 체크
    const mgmtNum = data.managementNumber as string | undefined;
    if (mgmtNum && existingInDb.has(mgmtNum)) {
      return {
        rowNumber: row.rowNumber,
        status: MIGRATION_ROW_STATUS.DUPLICATE,
        data,
        errors: [
          {
            field: 'managementNumber',
            message: `이미 등록된 관리번호입니다.`,
            code: MigrationErrorCode.DB_DUPLICATE,
          },
        ],
        warnings: [],
        managementNumber: mgmtNum,
        existingEquipmentId: existingInDb.get(mgmtNum),
      };
    }

    // Zod 스키마 검증
    const parseResult = createEquipmentSchema.safeParse(data);
    if (!parseResult.success) {
      const zodErrors = parseResult.error.issues.map(
        (e): RowFieldError => ({
          field: e.path.join('.') || 'unknown',
          message: this.translateZodError(e.message, e.path[0] as string),
          code: e.code.toUpperCase(),
        })
      );
      errors.push(...zodErrors);
    }

    // 인식되지 않은 헤더 경고
    if (row.unmappedColumns.length > 0) {
      warnings.push(`인식되지 않은 컬럼: ${row.unmappedColumns.join(', ')}`);
    }

    return {
      rowNumber: row.rowNumber,
      status:
        errors.length > 0
          ? MIGRATION_ROW_STATUS.ERROR
          : warnings.length > 0
            ? MIGRATION_ROW_STATUS.WARNING
            : MIGRATION_ROW_STATUS.VALID,
      data,
      errors,
      warnings,
      managementNumber: mgmtNum,
    };
  }

  /**
   * 관리번호 자동 생성 (autoGenerateManagementNumber=true일 때)
   *
   * 1. 행들을 (site, classification) 그룹으로 분류
   * 2. 각 그룹의 DB max serial 조회
   * 3. 관리번호 없는 행에 순차 할당
   */
  private async assignManagementNumbers(rows: MappedRow[]): Promise<MappedRow[]> {
    // managementNumber가 없고 site + classification이 있는 행 추출
    const rowsNeedingNumber = rows.filter(
      (r) => !r.mappedData.managementNumber && r.mappedData.site
    );

    if (rowsNeedingNumber.length === 0) return rows;

    // 그룹 식별: classification은 managementNumber 없이 알 수 없으므로 기본값 사용
    // 실제 사용 시에는 Excel에 classification 컬럼을 추가하거나 defaultClassification 옵션 제공
    // 지금은 관리번호 없는 행을 error로 처리하되 site별로 existing max 조회

    // site별 그룹핑하여 max serial 조회
    const groups = new Map<string, ManagementNumberGroup>();

    for (const row of rowsNeedingNumber) {
      const site = row.mappedData.site as string;
      const classificationCode = this.inferClassificationFromRow(row.mappedData);
      if (!classificationCode) continue;

      const groupKey = `${site}:${classificationCode}`;
      if (!groups.has(groupKey)) {
        const siteCode = SITE_TO_CODE[site as keyof typeof SITE_TO_CODE];
        if (!siteCode) continue;

        // DB에서 해당 (site, classification) 그룹의 최대 일련번호 조회
        const classificationDbCode =
          CLASSIFICATION_TO_CODE[classificationCode as keyof typeof CLASSIFICATION_TO_CODE];
        const [result] = await this.db
          .select({ maxSerial: max(equipment.managementSerialNumber) })
          .from(equipment)
          .where(
            and(
              eq(equipment.siteCode, siteCode),
              classificationDbCode
                ? eq(equipment.classificationCode, classificationDbCode)
                : undefined
            )
          );

        const maxSerial = result?.maxSerial ?? 0;
        groups.set(groupKey, {
          site,
          classification: classificationCode,
          maxSerial,
          nextSerial: maxSerial + 1,
        });
      }

      const group = groups.get(groupKey)!;
      const siteCode = SITE_TO_CODE[site as keyof typeof SITE_TO_CODE];
      if (!siteCode) continue;

      const managementNumber = generateManagementNumber(
        site as Site,
        classificationCode as Classification,
        String(group.nextSerial).padStart(4, '0')
      );
      group.nextSerial++;

      row.mappedData.managementNumber = managementNumber;
    }

    return rows;
  }

  /**
   * 행 데이터에서 분류코드 추론
   * (향후 classificationCode 컬럼 지원 시 확장)
   */
  private inferClassificationFromRow(data: Record<string, unknown>): string | undefined {
    // managementNumber에서 파싱 시도 (이미 있는 경우)
    if (data.managementNumber && typeof data.managementNumber === 'string') {
      const parsed = parseManagementNumber(data.managementNumber);
      return parsed?.classificationCode ?? undefined;
    }
    // 기본값: 'E' (FCC EMC/RF) - 실제로는 UI에서 선택하게 해야 함
    return undefined;
  }

  /**
   * DB 기존 관리번호 배치 조회 (N+1 방지 — WHERE IN 단일 쿼리)
   */
  private async fetchExistingManagementNumbers(
    managementNumbers: string[]
  ): Promise<Map<string, string>> {
    if (managementNumbers.length === 0) return new Map();

    const existing = await this.db
      .select({
        managementNumber: equipment.managementNumber,
        id: equipment.id,
      })
      .from(equipment)
      .where(inArray(equipment.managementNumber, managementNumbers));

    return new Map(existing.map((e) => [e.managementNumber, e.id]));
  }

  /**
   * 파일 내 중복 탐지
   * @returns Map<중복행번호, 첫번째발생행번호>
   */
  private detectInFileDuplicates(rows: MappedRow[]): Map<number, number> {
    const seen = new Map<string, number>(); // managementNumber → 첫 번째 rowNumber
    const duplicates = new Map<number, number>();

    for (const row of rows) {
      const mgmtNum = row.mappedData.managementNumber;
      if (!mgmtNum || typeof mgmtNum !== 'string') continue;

      if (seen.has(mgmtNum)) {
        duplicates.set(row.rowNumber, seen.get(mgmtNum)!);
      } else {
        seen.set(mgmtNum, row.rowNumber);
      }
    }

    return duplicates;
  }

  /**
   * Zod 에러 메시지 한국어 번역
   */
  private translateZodError(message: string, field?: string): string {
    const fieldLabel = this.getFieldLabel(field);
    const prefix = fieldLabel ? `${fieldLabel}: ` : '';

    if (message.includes('Required') || message.includes('required')) {
      return `${prefix}필수 입력 항목입니다.`;
    }
    if (message.includes('min')) {
      return `${prefix}최소 길이를 충족해야 합니다.`;
    }
    if (message.includes('max')) {
      return `${prefix}최대 길이를 초과했습니다.`;
    }
    if (message.includes('Invalid enum')) {
      return `${prefix}허용되지 않는 값입니다.`;
    }
    if (message.includes('Invalid date') || message.includes('date')) {
      return `${prefix}올바른 날짜 형식이 아닙니다. (예: 2024-01-15)`;
    }
    if (message.includes('Expected number') || message.includes('number')) {
      return `${prefix}숫자를 입력해 주세요.`;
    }
    return `${prefix}${message}`;
  }

  /**
   * TEMP- 관리번호 자동 생성 (공용장비 전용)
   * site + classification 기반으로 그룹별 max 조회 후 순차 할당
   */
  private async assignTemporaryManagementNumbers(rows: MappedRow[]): Promise<MappedRow[]> {
    const rowsNeedingNumber = rows.filter((r) => !r.mappedData.managementNumber);
    if (rowsNeedingNumber.length === 0) return rows;

    // (site, classification) 그룹별 최대 TEMP- 일련번호 조회
    const groups = new Map<string, { nextSerial: number }>();

    for (const row of rowsNeedingNumber) {
      const site = row.mappedData.site as string | undefined;
      const classification = row.mappedData.classification as string | undefined;
      if (!site || !classification) continue; // 필수 필드 누락 — Zod 검증에서 에러 처리

      const siteCode = SITE_TO_CODE[site as keyof typeof SITE_TO_CODE];
      const classCode =
        CLASSIFICATION_TO_CODE[classification as keyof typeof CLASSIFICATION_TO_CODE];
      if (!siteCode || !classCode) continue;

      const groupKey = `${siteCode}-${classCode}`;
      if (!groups.has(groupKey)) {
        // DB에서 해당 그룹의 최대 TEMP- 번호 조회 (LIKE 패턴)
        const prefix = `TEMP-${siteCode}-${classCode}`;
        const existingRows = await this.db
          .select({ managementNumber: equipment.managementNumber })
          .from(equipment)
          .where(like(equipment.managementNumber, `${prefix}%`));

        let maxSerial = 0;
        for (const r of existingRows) {
          const numPart = r.managementNumber.substring(prefix.length);
          const parsed = parseInt(numPart, 10);
          if (!isNaN(parsed) && parsed > maxSerial) maxSerial = parsed;
        }
        groups.set(groupKey, { nextSerial: maxSerial + 1 });
      }

      const group = groups.get(groupKey)!;
      const siteCode2 = SITE_TO_CODE[site as keyof typeof SITE_TO_CODE];
      row.mappedData.managementNumber = generateTemporaryManagementNumber(
        site as Site,
        classification as Classification,
        String(group.nextSerial).padStart(4, '0')
      );
      group.nextSerial++;
    }

    return rows;
  }

  /**
   * DB 필드명 → 한국어 라벨 (공용장비 매핑 기반)
   */
  private translateSharedZodError(message: string, field?: string): string {
    const fieldLabel = this.getSharedFieldLabel(field);
    const prefix = fieldLabel ? `${fieldLabel}: ` : '';
    if (message.includes('Required') || message.includes('required')) {
      return `${prefix}필수 입력 항목입니다.`;
    }
    if (message.includes('Invalid enum')) return `${prefix}허용되지 않는 값입니다.`;
    if (message.includes('date')) return `${prefix}올바른 날짜 형식이 아닙니다.`;
    return `${prefix}${message}`;
  }

  private getSharedFieldLabel(field?: string): string {
    if (!field) return '';
    const entry = SHARED_EQUIPMENT_COLUMN_MAPPING.find((e) => e.dbField === field);
    if (entry) return entry.aliases[0];
    const equipEntry = EQUIPMENT_COLUMN_MAPPING.find((e) => e.dbField === field);
    return equipEntry?.aliases[0] ?? field;
  }

  /**
   * DB 필드명 → 한국어 라벨
   */
  private getFieldLabel(field?: string): string {
    if (!field) return '';
    const entry = EQUIPMENT_COLUMN_MAPPING.find((e) => e.dbField === field);
    return entry?.aliases[0] ?? field;
  }
}
