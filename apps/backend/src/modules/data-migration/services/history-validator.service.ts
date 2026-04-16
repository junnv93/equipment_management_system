import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { MappedRow } from '../types/data-migration.types';
import type { MigrationRowPreview } from '@equipment-management/schemas';
import {
  REPAIR_RESULT_VALUES,
  INCIDENT_TYPE_VALUES,
  CABLE_CONNECTOR_TYPE_VALUES,
  CALIBRATION_FACTOR_TYPE_VALUES,
  NON_CONFORMANCE_TYPE_VALUES,
  MIGRATION_ROW_STATUS,
} from '@equipment-management/schemas';
import { MigrationErrorCode } from '@equipment-management/shared-constants';

const calibrationRowSchema = z.object({
  managementNumber: z.string().min(1),
  calibrationDate: z.date().refine((d) => d !== undefined, { message: '교정일은 필수입니다.' }),
  agencyName: z.string().optional(),
  certificateNumber: z.string().optional(),
  result: z.string().optional(),
  cost: z.number().optional(),
  notes: z.string().optional(),
});

const repairRowSchema = z.object({
  managementNumber: z.string().min(1),
  repairDate: z.date().refine((d) => d !== undefined, { message: '수리일은 필수입니다.' }),
  repairDescription: z.string().min(1, '수리내용은 필수입니다.'),
  repairResult: z.enum([...REPAIR_RESULT_VALUES] as [string, ...string[]]).optional(),
  notes: z.string().optional(),
});

const incidentRowSchema = z.object({
  managementNumber: z.string().min(1),
  occurredAt: z.date().refine((d) => d !== undefined, { message: '발생일은 필수입니다.' }),
  incidentType: z.enum([...INCIDENT_TYPE_VALUES] as [string, ...string[]]),
  content: z.string().min(1, '내용은 필수입니다.'),
});

const cableRowSchema = z.object({
  managementNumber: z.string().min(1, '관리번호는 필수입니다.'),
  length: z.string().optional(),
  connectorType: z.enum([...CABLE_CONNECTOR_TYPE_VALUES] as [string, ...string[]]).optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  site: z.string().optional(),
});

const testSoftwareRowSchema = z.object({
  managementNumber: z.string().min(1, '관리번호(P번호)는 필수입니다.'),
  name: z.string().min(1, '소프트웨어명은 필수입니다.'),
  testField: z.string().min(1, '시험분야는 필수입니다.'),
  softwareVersion: z.string().optional(),
  manufacturer: z.string().optional(),
  location: z.string().optional(),
  site: z.string().optional(),
});

const calibrationFactorRowSchema = z.object({
  managementNumber: z.string().min(1),
  factorType: z.enum([...CALIBRATION_FACTOR_TYPE_VALUES] as [string, ...string[]]),
  factorName: z.string().min(1, '인자명은 필수입니다.'),
  factorValue: z.number({ error: '인자값은 필수입니다.' }),
  unit: z.string().min(1, '단위는 필수입니다.'),
  effectiveDate: z.date().refine((d) => d !== undefined, { message: '유효시작일은 필수입니다.' }),
  expiryDate: z.date().optional(),
});

const nonConformanceRowSchema = z.object({
  managementNumber: z.string().min(1),
  discoveryDate: z.date().refine((d) => d !== undefined, { message: '발견일은 필수입니다.' }),
  ncType: z.enum([...NON_CONFORMANCE_TYPE_VALUES] as [string, ...string[]]),
  cause: z.string().min(1, '원인은 필수입니다.'),
  actionPlan: z.string().optional(),
  correctionContent: z.string().optional(),
  correctionDate: z.date().optional(),
});

@Injectable()
export class HistoryValidatorService {
  validateCalibrationBatch(
    rows: MappedRow[],
    validManagementNumbers: Set<string>
  ): MigrationRowPreview[] {
    return this.validateBatch(rows, calibrationRowSchema, validManagementNumbers);
  }

  validateRepairBatch(
    rows: MappedRow[],
    validManagementNumbers: Set<string>
  ): MigrationRowPreview[] {
    return this.validateBatch(rows, repairRowSchema, validManagementNumbers);
  }

  validateIncidentBatch(
    rows: MappedRow[],
    validManagementNumbers: Set<string>
  ): MigrationRowPreview[] {
    return this.validateBatch(rows, incidentRowSchema, validManagementNumbers);
  }

  /** 케이블: 독립 엔티티 — 장비 참조 검증 불필요 */
  validateCableBatch(rows: MappedRow[]): MigrationRowPreview[] {
    return this.validateBatch(rows, cableRowSchema, new Set());
  }

  /** 시험용 소프트웨어: 독립 엔티티 — 장비 참조 검증 불필요 */
  validateTestSoftwareBatch(rows: MappedRow[]): MigrationRowPreview[] {
    return this.validateBatch(rows, testSoftwareRowSchema, new Set());
  }

  /** 교정 인자: 장비 참조 — 관리번호 크로스 검증 */
  validateCalibrationFactorBatch(
    rows: MappedRow[],
    validManagementNumbers: Set<string>
  ): MigrationRowPreview[] {
    return this.validateBatch(rows, calibrationFactorRowSchema, validManagementNumbers);
  }

  /** 부적합: 장비 참조 — 관리번호 크로스 검증 */
  validateNonConformanceBatch(
    rows: MappedRow[],
    validManagementNumbers: Set<string>
  ): MigrationRowPreview[] {
    return this.validateBatch(rows, nonConformanceRowSchema, validManagementNumbers);
  }

  private validateBatch(
    rows: MappedRow[],
    schema: z.ZodSchema,
    validManagementNumbers: Set<string>
  ): MigrationRowPreview[] {
    return rows.map((row) => {
      const errors: { field: string; message: string; code: string }[] = [];
      const warnings: string[] = [];

      // Zod 검증
      const parsed = schema.safeParse(row.mappedData);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          errors.push({
            field: issue.path.join('.') || 'unknown',
            message: issue.message,
            code: MigrationErrorCode.VALIDATION_ERROR,
          });
        }
      }

      // 크로스시트 관리번호 검증 (장비 시트 or DB에서 확보된 관리번호 기준)
      const mgmtNum = row.mappedData['managementNumber'] as string | undefined;
      if (mgmtNum && validManagementNumbers.size > 0 && !validManagementNumbers.has(mgmtNum)) {
        errors.push({
          field: 'managementNumber',
          message: `관리번호 '${mgmtNum}'에 해당하는 장비가 장비 시트에도 DB에도 없습니다.`,
          code: MigrationErrorCode.EQUIPMENT_NOT_FOUND,
        });
      }

      const status =
        errors.length > 0
          ? MIGRATION_ROW_STATUS.ERROR
          : warnings.length > 0
            ? MIGRATION_ROW_STATUS.WARNING
            : MIGRATION_ROW_STATUS.VALID;
      return {
        rowNumber: row.rowNumber,
        status,
        data: parsed.success ? (parsed.data as Record<string, unknown>) : row.mappedData,
        errors,
        warnings,
        managementNumber: mgmtNum,
      };
    });
  }
}
