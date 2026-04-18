/**
 * 데이터 마이그레이션 API 계약 타입 — SSOT
 *
 * 백엔드와 프론트엔드가 공유하는 타입 정의.
 * 내부 서비스 전용 타입(RawExcelRow, MappedRow, ManagementNumberGroup, MigrationSession)은
 * apps/backend/src/modules/data-migration/types/ 에서 별도 관리.
 */

/** 행별 처리 상태 상수 */
export const MIGRATION_ROW_STATUS = {
  VALID: 'valid',
  ERROR: 'error',
  DUPLICATE: 'duplicate',
  WARNING: 'warning',
} as const;

/** 행별 처리 상태 타입 */
export type MigrationRowStatus = (typeof MIGRATION_ROW_STATUS)[keyof typeof MIGRATION_ROW_STATUS];

/** INSERT 가능한 상태 집합 */
export const INSERTABLE_STATUSES = new Set<MigrationRowStatus>([
  MIGRATION_ROW_STATUS.VALID,
  MIGRATION_ROW_STATUS.WARNING,
]);

/** 행별 검증 에러 */
export interface RowFieldError {
  /** DB 필드명 또는 Excel 컬럼명 */
  field: string;
  /** 오류 메시지 */
  message: string;
  /** 에러 코드 (REQUIRED, INVALID_FORMAT, DUPLICATE 등) */
  code: string;
}

/** Preview 응답 — 행별 상태 */
export interface MigrationRowPreview {
  rowNumber: number;
  status: MigrationRowStatus;
  /** 파싱/매핑된 장비 데이터 (미리보기용) */
  data: Record<string, unknown>;
  /** 이 행에 대한 오류 목록 */
  errors: RowFieldError[];
  /** 확정된 관리번호 (자동 생성 포함) */
  managementNumber?: string;
  /** 중복 시 기존 장비 ID */
  existingEquipmentId?: string;
  /** 경고 메시지 (선택적 처리 가능한 문제) */
  warnings: string[];
}

/** Preview API 응답 */
export interface MigrationPreviewResult {
  /** 이 Preview 세션의 고유 ID (Execute 시 재사용) */
  sessionId: string;
  /** 업로드된 파일명 */
  fileName: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  duplicateRows: number;
  warningRows: number;
  /** 인식되지 않은 헤더 목록 */
  unmappedColumns: string[];
  rows: MigrationRowPreview[];
}

/** Execute API 응답 */
export interface MigrationExecuteResult {
  sessionId: string;
  createdCount: number;
  skippedCount: number;
  errorCount: number;
  /** 오류 행 상세 목록 (에러 리포트 다운로드용) */
  errors: MigrationRowPreview[];
}

/** 마이그레이션 세션 상태 상수 */
export const MIGRATION_SESSION_STATUS = {
  PREVIEW: 'preview',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

/** 마이그레이션 세션 상태 타입 */
export type MigrationSessionStatus =
  (typeof MIGRATION_SESSION_STATUS)[keyof typeof MIGRATION_SESSION_STATUS];

/** 멀티시트 마이그레이션 시트 타입 상수 */
export const MIGRATION_SHEET_TYPE = {
  EQUIPMENT: 'equipment',
  CALIBRATION: 'calibration',
  REPAIR: 'repair',
  INCIDENT: 'incident',
  CABLE: 'cable',
  TEST_SOFTWARE: 'test_software',
  CALIBRATION_FACTOR: 'calibration_factor',
  NON_CONFORMANCE: 'non_conformance',
} as const;

/** 멀티시트 마이그레이션 시트 타입 */
export type MigrationSheetType = (typeof MIGRATION_SHEET_TYPE)[keyof typeof MIGRATION_SHEET_TYPE];

/** 단일 시트 Preview 결과 */
export interface SheetPreviewResult {
  sheetType: MigrationSheetType;
  sheetName: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  duplicateRows: number;
  warningRows: number;
  unmappedColumns: string[];
  rows: MigrationRowPreview[];
}

/** FK 해석 요약 (담당자/부담당자/팀 자동 매칭 결과) */
export interface FkResolutionSummaryDto {
  resolvedManagers: number;
  unresolvedManagers: number;
  resolvedDeputyManagers: number;
  unresolvedDeputyManagers: number;
  resolvedTeams: number;
  unresolvedTeams: number;
}

/** 멀티시트 Preview 응답 */
export interface MultiSheetPreviewResult {
  sessionId: string;
  fileName: string;
  sheets: SheetPreviewResult[];
  /** 전체 합계 */
  totalRows: number;
  validRows: number;
  errorRows: number;
  /** FK 자동 해석 요약 (담당자/부담당자/팀) */
  fkResolutionSummary?: FkResolutionSummaryDto;
}

/** 멀티시트 Execute 응답 */
export interface MultiSheetExecuteResult {
  sessionId: string;
  sheets: {
    sheetType: MigrationSheetType;
    createdCount: number;
    skippedCount: number;
    errorCount: number;
  }[];
  totalCreated: number;
  totalSkipped: number;
  totalErrors: number;
  errors: MigrationRowPreview[];
}
