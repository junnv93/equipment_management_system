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
  RESOLUTION_TYPE_VALUES,
  CHECKOUT_PURPOSE_VALUES,
  CHECKOUT_TYPE_VALUES,
  MIGRATION_ROW_STATUS,
  VM,
} from '@equipment-management/schemas';
import { MigrationErrorCode, VALIDATION_RULES } from '@equipment-management/shared-constants';

const requiredText = (
  fieldName: string,
  requiredMessage: string,
  maxLength: number = VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH
) => z.string().trim().min(1, requiredMessage).max(maxLength, VM.string.max(fieldName, maxLength));

const optionalText = (
  fieldName: string,
  maxLength: number = VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH
) => z.string().trim().max(maxLength, VM.string.max(fieldName, maxLength)).optional();

const managementNumber = (message = '관리번호는 필수입니다.') =>
  requiredText('관리번호', message, VALIDATION_RULES.MANAGEMENT_NUMBER_MAX_LENGTH);

const calibrationRowSchema = z.object({
  managementNumber: managementNumber(),
  calibrationDate: z.date().refine((d) => d !== undefined, { message: '교정일은 필수입니다.' }),
  agencyName: optionalText('교정 기관'),
  certificateNumber: optionalText('교정성적서 번호'),
  result: optionalText('교정 결과'),
  notes: optionalText('비고', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH),
});

const repairRowSchema = z.object({
  managementNumber: managementNumber(),
  repairDate: z.date().refine((d) => d !== undefined, { message: '수리일은 필수입니다.' }),
  repairDescription: requiredText(
    '수리내용',
    '수리내용은 필수입니다.',
    VALIDATION_RULES.LONG_TEXT_MAX_LENGTH
  ),
  repairResult: z.enum([...REPAIR_RESULT_VALUES] as [string, ...string[]]).optional(),
  notes: optionalText('비고', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH),
});

const incidentRowSchema = z.object({
  managementNumber: managementNumber(),
  occurredAt: z.date().refine((d) => d !== undefined, { message: '발생일은 필수입니다.' }),
  incidentType: z.enum([...INCIDENT_TYPE_VALUES] as [string, ...string[]]),
  content: requiredText('내용', '내용은 필수입니다.', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH),
});

const cableRowSchema = z.object({
  managementNumber: managementNumber(),
  length: optionalText('길이', VALIDATION_RULES.SHORT_TEXT_MAX_LENGTH),
  connectorType: z.enum([...CABLE_CONNECTOR_TYPE_VALUES] as [string, ...string[]]).optional(),
  serialNumber: optionalText('시리얼번호', VALIDATION_RULES.CABLE_SERIAL_NUMBER_MAX_LENGTH),
  location: optionalText('위치', VALIDATION_RULES.CABLE_LOCATION_MAX_LENGTH),
  site: optionalText('사이트', VALIDATION_RULES.SHORT_TEXT_MAX_LENGTH),
});

const testSoftwareRowSchema = z.object({
  managementNumber: managementNumber('관리번호(P번호)는 필수입니다.'),
  name: requiredText('소프트웨어명', '소프트웨어명은 필수입니다.'),
  testField: requiredText('시험분야', '시험분야는 필수입니다.'),
  softwareVersion: optionalText('소프트웨어 버전'),
  manufacturer: optionalText('제조사', VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH),
  location: optionalText('위치', VALIDATION_RULES.CABLE_LOCATION_MAX_LENGTH),
  site: optionalText('사이트', VALIDATION_RULES.SHORT_TEXT_MAX_LENGTH),
});

const calibrationFactorRowSchema = z.object({
  managementNumber: managementNumber(),
  factorType: z.enum([...CALIBRATION_FACTOR_TYPE_VALUES] as [string, ...string[]]),
  factorName: requiredText(
    '인자명',
    '인자명은 필수입니다.',
    VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH
  ),
  factorValue: z.number({ error: '인자값은 필수입니다.' }),
  unit: requiredText('단위', '단위는 필수입니다.', VALIDATION_RULES.SHORT_TEXT_MAX_LENGTH),
  effectiveDate: z.date().refine((d) => d !== undefined, { message: '유효시작일은 필수입니다.' }),
  expiryDate: z.date().optional(),
});

const nonConformanceRowSchema = z.object({
  managementNumber: managementNumber(),
  discoveryDate: z.date().refine((d) => d !== undefined, { message: '발견일은 필수입니다.' }),
  ncType: z.enum([...NON_CONFORMANCE_TYPE_VALUES] as [string, ...string[]]),
  cause: requiredText('원인', '원인은 필수입니다.', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH),
  actionPlan: optionalText('조치 계획', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH),
  correctionContent: optionalText('시정 내용', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH),
  correctionDate: z.date().optional(),
  resolutionType: z.enum([...RESOLUTION_TYPE_VALUES] as [string, ...string[]]).optional(),
});

/**
 * 반출입 이력 행 스키마
 * requesterId는 NOT NULL — requesterEmail/requesterName 중 최소 1개 필수
 */
const checkoutRowSchema = z
  .object({
    managementNumber: managementNumber(),
    checkoutDate: z.date(),
    expectedReturnDate: z.date(),
    purpose: z.enum([...CHECKOUT_PURPOSE_VALUES] as [string, ...string[]], {
      error: '허용되지 않는 반출목적입니다.',
    }),
    destination: requiredText('반출장소', '반출장소는 필수입니다.'),
    reason: requiredText(
      '반출사유',
      '반출사유는 필수입니다.',
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH
    ),
    // 선택 필드
    actualReturnDate: z.date().optional(),
    checkoutType: z.enum([...CHECKOUT_TYPE_VALUES] as [string, ...string[]]).optional(),
    phoneNumber: optionalText('전화번호', VALIDATION_RULES.PHONE_MAX_LENGTH),
    address: optionalText('주소', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH),
    rejectionReason: optionalText('반려 사유', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH),
    // FK 가상 필드 (FkResolutionService에서 UUID로 변환)
    requesterEmail: z.string().email().optional(),
    requesterName: optionalText('신청자'),
    approverEmail: z.string().email().optional(),
    approverName: optionalText('승인자'),
    returnerEmail: z.string().email().optional(),
    returnerName: optionalText('반납자'),
  })
  .superRefine((data, ctx) => {
    if (!data.requesterEmail && !data.requesterName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '신청자이메일 또는 신청자 중 최소 1개는 필수입니다.',
        path: ['requesterEmail'],
      });
    }
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

  /**
   * 반출입 이력 배치 검증
   * - managementNumber 크로스 검증 (장비 시트 or DB 기준)
   * - requesterEmail/requesterName 중 최소 1개 필수 (checkoutRowSchema.superRefine)
   * - 실제 requester UUID 해석은 FkResolutionService.resolveCheckoutBatch에서 수행
   */
  validateCheckoutBatch(
    rows: MappedRow[],
    validManagementNumbers: Set<string>
  ): MigrationRowPreview[] {
    return this.validateBatch(rows, checkoutRowSchema, validManagementNumbers);
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
