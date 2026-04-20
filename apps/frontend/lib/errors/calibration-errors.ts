/**
 * 교정 관련 에러 코드 (SSOT)
 *
 * 백엔드 에러 코드와 1:1 매핑 — 하드코딩 금지, 반드시 이 enum 경유.
 * 코드베이스 패턴: equipment-errors.ts와 동일하게 TypeScript enum 사용.
 */
export enum CalibrationErrorCode {
  FILE_REQUIRED = 'CALIBRATION_FILE_REQUIRED',
  CERTIFICATE_REQUIRED = 'CALIBRATION_CERTIFICATE_REQUIRED',
  DOCUMENT_TYPE_COUNT_MISMATCH = 'DOCUMENT_TYPE_COUNT_MISMATCH',
  DOCUMENT_TYPE_INVALID = 'DOCUMENT_TYPE_INVALID',
  FILE_LIMIT_EXCEEDED = 'CALIBRATION_FILE_LIMIT_EXCEEDED',
  DUPLICATE_SAME_DAY = 'CALIBRATION_DUPLICATE_SAME_DAY',
  TX_FAILED = 'CALIBRATION_TX_FAILED',
  NOT_FOUND = 'CALIBRATION_NOT_FOUND',
  ENDPOINT_DEPRECATED = 'ENDPOINT_DEPRECATED',
  PLAN_ITEM_NOT_EXECUTED = 'PLAN_ITEM_NOT_EXECUTED',
}

/**
 * 에러 코드 → 사용자 대면 i18n 키 매핑
 *
 * i18n namespace: `calibration.errors.*`
 */
export const CALIBRATION_ERROR_I18N_KEY: Record<CalibrationErrorCode, string> = {
  [CalibrationErrorCode.FILE_REQUIRED]: 'calibration.errors.fileRequired',
  [CalibrationErrorCode.CERTIFICATE_REQUIRED]: 'calibration.errors.certificateRequired',
  [CalibrationErrorCode.DOCUMENT_TYPE_COUNT_MISMATCH]:
    'calibration.errors.documentTypeCountMismatch',
  [CalibrationErrorCode.DOCUMENT_TYPE_INVALID]: 'calibration.errors.documentTypeInvalid',
  [CalibrationErrorCode.FILE_LIMIT_EXCEEDED]: 'calibration.errors.fileLimitExceeded',
  [CalibrationErrorCode.DUPLICATE_SAME_DAY]: 'calibration.errors.duplicateSameDay',
  [CalibrationErrorCode.TX_FAILED]: 'calibration.errors.txFailed',
  [CalibrationErrorCode.NOT_FOUND]: 'calibration.errors.notFound',
  [CalibrationErrorCode.ENDPOINT_DEPRECATED]: 'calibration.errors.endpointDeprecated',
  [CalibrationErrorCode.PLAN_ITEM_NOT_EXECUTED]: 'calibration.errors.planItemNotExecuted',
};

/** API 응답 에러 코드를 i18n 키로 변환 */
export function getCalibrationErrorI18nKey(code: string): string {
  return CALIBRATION_ERROR_I18N_KEY[code as CalibrationErrorCode] ?? 'calibration.errors.unknown';
}
