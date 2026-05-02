/**
 * Self Inspection 도메인 에러 매핑 SSOT
 *
 * @see packages/schemas/src/errors.ts (ErrorCode SSOT)
 * @see apps/frontend/messages/{ko,en}/equipment.json (errors namespace)
 *   — 호출자 useTranslations('equipment') 사용 (SelfInspectionFormDialog 패턴)
 */
import { ErrorCode } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { extractErrorCode, type ErrorToast } from './disposal-errors';

type TranslationFunction = (key: string, values?: Record<string, string | number | Date>) => string;

const SELF_INSPECTION_ERROR_I18N_KEYS: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.SelfInspectionRejectionReasonRequired]: 'errors.rejectionReasonRequired',
  [ErrorCode.SelfInspectionInvalidStatusTransition]: 'errors.invalidStatusForReject',
};

const SELF_INSPECTION_ERROR_I18N_VARS: Partial<
  Record<ErrorCode, Record<string, string | number | Date>>
> = {
  [ErrorCode.SelfInspectionRejectionReasonRequired]: {
    min: VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH,
  },
};

export function mapSelfInspectionErrorToToast(error: unknown, t: TranslationFunction): ErrorToast {
  const code = extractErrorCode(error);
  const errorCode = code as ErrorCode | null;

  if (errorCode && SELF_INSPECTION_ERROR_I18N_KEYS[errorCode]) {
    return {
      title: t('errors.title'),
      description: t(
        SELF_INSPECTION_ERROR_I18N_KEYS[errorCode]!,
        SELF_INSPECTION_ERROR_I18N_VARS[errorCode]
      ),
    };
  }

  return {
    title: t('errors.title'),
    description: error instanceof Error ? error.message : String(error),
  };
}
