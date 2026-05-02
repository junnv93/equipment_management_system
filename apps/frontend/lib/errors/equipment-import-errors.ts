/**
 * Equipment Import 도메인 에러 매핑 SSOT
 *
 * Backend `ErrorCode` 응답을 frontend i18n 메시지로 변환한다.
 * 호출처는 `mapEquipmentImportErrorToToast(error, t)`를 사용 — t는 useTranslations('equipment') 결과.
 *
 * @example
 * onError: async (error: Error) => {
 *   toast({ ...mapEquipmentImportErrorToToast(error, t), variant: 'destructive' });
 * }
 *
 * @see packages/schemas/src/errors.ts (ErrorCode SSOT)
 * @see apps/frontend/messages/{ko,en}/equipment.json (errors namespace)
 */
import { ErrorCode } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { extractErrorCode, type ErrorToast } from './disposal-errors';

type TranslationFunction = (key: string, values?: Record<string, string | number | Date>) => string;

const EQUIPMENT_IMPORT_ERROR_I18N_KEYS: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.EquipmentImportRejectionReasonRequired]: 'errors.rejectionReasonRequired',
  [ErrorCode.EquipmentImportOnlyPendingCanReject]: 'errors.invalidStatusForReject',
};

const EQUIPMENT_IMPORT_ERROR_I18N_VARS: Partial<
  Record<ErrorCode, Record<string, string | number | Date>>
> = {
  [ErrorCode.EquipmentImportRejectionReasonRequired]: {
    min: VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH,
  },
};

export function mapEquipmentImportErrorToToast(error: unknown, t: TranslationFunction): ErrorToast {
  const code = extractErrorCode(error);
  const errorCode = code as ErrorCode | null;

  if (errorCode && EQUIPMENT_IMPORT_ERROR_I18N_KEYS[errorCode]) {
    return {
      title: t('errors.title'),
      description: t(
        EQUIPMENT_IMPORT_ERROR_I18N_KEYS[errorCode]!,
        EQUIPMENT_IMPORT_ERROR_I18N_VARS[errorCode]
      ),
    };
  }

  return {
    title: t('errors.title'),
    description: error instanceof Error ? error.message : String(error),
  };
}
