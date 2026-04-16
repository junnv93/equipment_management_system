/**
 * Excel 라벨 상수 (SSOT)
 *
 * Excel 생성 시 사용하는 모든 한국어/영어 문자열을 중앙화.
 * 시트명, 상태 라벨, 컬럼 헤더 등을 인라인으로 하드코딩하지 않고 여기서 참조.
 */

/** 시트명 상수 */
export const EXCEL_SHEET_NAMES = {
  SUMMARY: '요약',
  MIGRATION_RESULT: '마이그레이션 결과',
  EQUIPMENT: '장비 등록',
  CALIBRATION: '교정 이력',
  REPAIR: '수리 이력',
  INCIDENT: '사고 이력',
  CABLE: '케이블',
  TEST_SOFTWARE: '시험용 소프트웨어',
  CALIBRATION_FACTOR: '교정 인자',
  NON_CONFORMANCE: '부적합',
  REFERENCE: '참고값',
} as const;

/** 에러 리포트 메타 컬럼 헤더 */
export const REPORT_META_HEADERS = {
  ROW_NUMBER: '행번호',
  RESULT: '처리결과',
  ERROR_DETAIL: '에러 상세',
  MANAGEMENT_NUMBER: '관리번호',
} as const;

/** 요약 시트 라벨 */
export const SUMMARY_LABELS = {
  ITEM: '항목',
  COUNT: '건수',
  TOTAL: '총 행수',
  SUCCESS: '성공',
  WARNING: '경고 (성공 처리)',
  ERROR: '에러',
  DUPLICATE: '중복',
} as const;

/** 참고값 시트 라벨 */
export const REFERENCE_LABELS = {
  FIELD_NAME: '필드명',
  ALLOWED_VALUES: '허용값',
  SITE: '사이트(site)',
  MANAGEMENT_METHOD: '관리방법(managementMethod)',
  CALIBRATION_REQUIRED: '교정필요(calibrationRequired)',
  REPAIR_RESULT: '수리결과(repairResult)',
  INCIDENT_TYPE: '사고유형(incidentType)',
  CONNECTOR_TYPE: '커넥터타입(connectorType)',
  TEST_FIELD: '시험분야(testField)',
  FACTOR_TYPE: '인자유형(factorType)',
  NC_TYPE: '부적합유형(ncType)',
  DATE_FORMAT: '날짜 형식',
  DATE_FORMAT_VALUE: 'YYYY-MM-DD 또는 YYYY.MM.DD',
} as const;

/** 마이그레이션 행 상태 → 표시 라벨 매핑 */
export const STATUS_LABELS: Record<string, string> = {
  valid: '성공',
  error: '오류',
  duplicate: '중복',
  warning: '경고',
};

/** 마이그레이션 위치 기록 메모 */
export const MIGRATION_NOTE = '데이터 마이그레이션';
