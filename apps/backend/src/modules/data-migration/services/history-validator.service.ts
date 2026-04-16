import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { MappedRow } from '../types/data-migration.types';
import type { MigrationRowPreview } from '@equipment-management/schemas';
import { REPAIR_RESULT_VALUES, INCIDENT_TYPE_VALUES } from '@equipment-management/schemas';
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

      // 크로스시트 관리번호 검증
      const mgmtNum = row.mappedData['managementNumber'] as string | undefined;
      if (mgmtNum && validManagementNumbers.size > 0 && !validManagementNumbers.has(mgmtNum)) {
        warnings.push(`관리번호 '${mgmtNum}'가 장비 시트에 없습니다. DB에서 조회합니다.`);
      }

      const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid';
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
