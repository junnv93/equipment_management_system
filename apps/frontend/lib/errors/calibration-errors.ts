/**
 * 교정 관련 에러 코드 (SSOT)
 *
 * 백엔드 에러 코드와 1:1 매핑 — 하드코딩 금지, 반드시 schemas ErrorCode 경유.
 */
import {
  CALIBRATION_ERROR_CODES,
  ErrorCode,
  type CalibrationErrorCode as CalibrationErrorCodeValue,
} from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { extractErrorCode, type ErrorToast } from './disposal-errors';

type TranslationFunction = (key: string, values?: Record<string, string | number | Date>) => string;

export const CalibrationErrorCode = CALIBRATION_ERROR_CODES;
export type CalibrationErrorCode = CalibrationErrorCodeValue;

/**
 * 에러 코드 → 사용자 대면 i18n 키 매핑
 *
 * i18n namespace: `calibration.errors.*`
 */
export const CALIBRATION_ERROR_I18N_KEY: Record<CalibrationErrorCode, string> = {
  [CALIBRATION_ERROR_CODES.FILE_REQUIRED]: 'calibration.errors.fileRequired',
  [CALIBRATION_ERROR_CODES.CERTIFICATE_REQUIRED]: 'calibration.errors.certificateRequired',
  [CALIBRATION_ERROR_CODES.DOCUMENT_TYPE_COUNT_MISMATCH]:
    'calibration.errors.documentTypeCountMismatch',
  [CALIBRATION_ERROR_CODES.DOCUMENT_TYPE_INVALID]: 'calibration.errors.documentTypeInvalid',
  [CALIBRATION_ERROR_CODES.FILE_LIMIT_EXCEEDED]: 'calibration.errors.fileLimitExceeded',
  [CALIBRATION_ERROR_CODES.DUPLICATE_SAME_DAY]: 'calibration.errors.duplicateSameDay',
  [CALIBRATION_ERROR_CODES.TX_FAILED]: 'calibration.errors.txFailed',
  [CALIBRATION_ERROR_CODES.NOT_FOUND]: 'calibration.errors.notFound',
  [CALIBRATION_ERROR_CODES.ENDPOINT_DEPRECATED]: 'calibration.errors.endpointDeprecated',
  [CALIBRATION_ERROR_CODES.PLAN_ITEM_NOT_EXECUTED]: 'calibration.errors.planItemNotExecuted',
};

/** API 응답 에러 코드를 i18n 키로 변환 */
export function getCalibrationErrorI18nKey(code: string): string {
  return CALIBRATION_ERROR_I18N_KEY[code as CalibrationErrorCode] ?? 'calibration.errors.unknown';
}

/**
 * Calibration reject defense-in-depth ErrorCode → toast (5-layer SSOT)
 *
 * 호출자 useTranslations('equipment') 또는 useTranslations('calibration') —
 * `errors.rejectionReasonRequired` 키는 양쪽 namespace에 모두 존재(parity).
 *
 * @see ErrorCode.CalibrationRejectionReasonRequired
 */
const CALIBRATION_REJECT_ERROR_I18N_KEYS: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.CalibrationRejectionReasonRequired]: 'errors.rejectionReasonRequired',
  [ErrorCode.CalibrationOnlyPendingCanReject]: 'errors.invalidStatusForReject',
  [ErrorCode.CalibrationNotFound]: 'errors.notFound',
  [ErrorCode.CalibrationInvalidStatusForComplete]: 'errors.invalidStatusForComplete',
  [ErrorCode.CalibrationOnlyPendingCanApprove]: 'errors.onlyPendingCanApprove',
  [ErrorCode.CalibrationNoIntermediateCheck]: 'errors.noIntermediateCheck',
};

const CALIBRATION_REJECT_ERROR_I18N_VARS: Partial<
  Record<ErrorCode, Record<string, string | number | Date>>
> = {
  [ErrorCode.CalibrationRejectionReasonRequired]: {
    min: VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH,
  },
};

export function mapCalibrationErrorToToast(error: unknown, t: TranslationFunction): ErrorToast {
  const code = extractErrorCode(error);
  const errorCode = code as ErrorCode | null;

  if (errorCode && CALIBRATION_REJECT_ERROR_I18N_KEYS[errorCode]) {
    return {
      title: t('errors.title'),
      description: t(
        CALIBRATION_REJECT_ERROR_I18N_KEYS[errorCode]!,
        CALIBRATION_REJECT_ERROR_I18N_VARS[errorCode]
      ),
    };
  }

  return {
    title: t('errors.title'),
    description: error instanceof Error ? error.message : String(error),
  };
}
