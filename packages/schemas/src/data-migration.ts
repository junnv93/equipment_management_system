/**
 * 데이터 마이그레이션 API 계약 타입 — SSOT
 *
 * 백엔드와 프론트엔드가 공유하는 타입 정의.
 * 내부 서비스 전용 타입(RawExcelRow, MappedRow, ManagementNumberGroup, MigrationSession)은
 * apps/backend/src/modules/data-migration/types/ 에서 별도 관리.
 */

/** 행별 처리 상태 */
export type MigrationRowStatus = 'valid' | 'error' | 'duplicate' | 'warning';

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

/** 멀티시트 마이그레이션 시트 타입 */
export type MigrationSheetType = 'equipment' | 'calibration' | 'repair' | 'incident';

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

/** 멀티시트 Preview 응답 */
export interface MultiSheetPreviewResult {
  sessionId: string;
  fileName: string;
  sheets: SheetPreviewResult[];
  /** 전체 합계 */
  totalRows: number;
  validRows: number;
  errorRows: number;
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
