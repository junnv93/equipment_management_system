/**
 * Intermediate Inspection 도메인 에러 매핑 SSOT
 *
 * @see packages/schemas/src/errors.ts (ErrorCode SSOT)
 * @see apps/frontend/messages/{ko,en}/calibration.json (errors namespace)
 *   — 호출자 useTranslations('calibration') 사용 (IntermediateInspectionList 패턴)
 */
import { ErrorCode } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { extractErrorCode, type ErrorToast } from './disposal-errors';

type TranslationFunction = (key: string, values?: Record<string, string | number | Date>) => string;

const INTERMEDIATE_INSPECTION_ERROR_I18N_KEYS: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.IntermediateInspectionRejectionReasonRequired]: 'errors.rejectionReasonRequired',
};

const INTERMEDIATE_INSPECTION_ERROR_I18N_VARS: Partial<
  Record<ErrorCode, Record<string, string | number | Date>>
> = {
  [ErrorCode.IntermediateInspectionRejectionReasonRequired]: {
    min: VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH,
  },
};

export function mapIntermediateInspectionErrorToToast(
  error: unknown,
  t: TranslationFunction
): ErrorToast {
  const code = extractErrorCode(error);
  const errorCode = code as ErrorCode | null;

  if (errorCode && INTERMEDIATE_INSPECTION_ERROR_I18N_KEYS[errorCode]) {
    return {
      title: t('errors.title'),
      description: t(
        INTERMEDIATE_INSPECTION_ERROR_I18N_KEYS[errorCode]!,
        INTERMEDIATE_INSPECTION_ERROR_I18N_VARS[errorCode]
      ),
    };
  }

  return {
    title: t('errors.title'),
    description: error instanceof Error ? error.message : String(error),
  };
}
