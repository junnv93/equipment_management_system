/**
 * SINGLE SOURCE OF TRUTH: 데이터 마이그레이션 에러 코드
 *
 * 백엔드(throw payload.code)와 프론트엔드(에러 코드 비교) 양측에서 사용.
 * 문자열 리터럴 직접 사용 금지 — 이 객체를 통해 참조할 것.
 */
export const MigrationErrorCode = {
  /** 파일이 업로드되지 않음 */
  FILE_REQUIRED: 'MIGRATION_FILE_REQUIRED',
  /** 파일에 데이터 행이 없음 */
  EMPTY_FILE: 'MIGRATION_EMPTY_FILE',
  /** 헤더 행만 있고 데이터 없음 */
  NO_DATA_ROWS: 'MIGRATION_NO_DATA_ROWS',
  /** 헤더를 인식할 수 없음 */
  NO_HEADERS: 'MIGRATION_NO_HEADERS',
  /** Preview 세션을 찾을 수 없음 (만료 또는 미존재) */
  SESSION_NOT_FOUND: 'MIGRATION_SESSION_NOT_FOUND',
  /** 세션 소유자가 다름 */
  SESSION_OWNERSHIP_DENIED: 'MIGRATION_SESSION_OWNERSHIP_DENIED',
  /** 세션이 이미 실행 중 */
  SESSION_ALREADY_EXECUTING: 'MIGRATION_SESSION_ALREADY_EXECUTING',
  /** 세션이 이미 완료됨 */
  SESSION_ALREADY_COMPLETED: 'MIGRATION_SESSION_ALREADY_COMPLETED',
  /** 세션이 실패 상태 */
  SESSION_FAILED: 'MIGRATION_SESSION_FAILED',
  /** 비-SYSTEM_ADMIN 사용자가 자신의 사이트 외 데이터 마이그레이션 시도 */
  SITE_ACCESS_DENIED: 'MIGRATION_SITE_ACCESS_DENIED',
  /** 파일 내 중복 관리번호 */
  IN_FILE_DUPLICATE: 'IN_FILE_DUPLICATE',
  /** DB에 이미 존재하는 관리번호 */
  DB_DUPLICATE: 'DB_DUPLICATE',
  /** 이력 행의 관리번호가 장비 시트에도 DB에도 없음 */
  EQUIPMENT_NOT_FOUND: 'EQUIPMENT_NOT_FOUND',
  /** 이력 행이 DB에 이미 존재 (재업로드 시 중복) */
  HISTORY_DB_DUPLICATE: 'HISTORY_DB_DUPLICATE',
  /** Zod 스키마 유효성 검사 실패 — 행별 필드 에러 */
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  /** 장비 시트가 2개 이상 포함된 경우 — FK 인덱스 단일 시트 계약 위반 */
  MULTIPLE_EQUIPMENT_SHEETS: 'MIGRATION_MULTIPLE_EQUIPMENT_SHEETS',
} as const;

export type MigrationErrorCode = (typeof MigrationErrorCode)[keyof typeof MigrationErrorCode];
