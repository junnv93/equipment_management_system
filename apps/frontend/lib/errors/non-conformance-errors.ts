/**
 * Non-Conformance 도메인 에러 매핑 SSOT
 *
 * @see packages/schemas/src/errors.ts (ErrorCode SSOT)
 * @see apps/frontend/messages/{ko,en}/non-conformances.json (errors namespace)
 *   — 호출자 useTranslations('non-conformances') 사용
 */
import { ErrorCode } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { extractErrorCode, type ErrorToast } from './disposal-errors';
import { extractValidationIssues } from './extract-error';
import { mapZodIssuesToToast } from './zod-issue-mapper';

type TranslationFunction = (key: string, values?: Record<string, string | number | Date>) => string;

const NON_CONFORMANCE_ERROR_I18N_KEYS: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.NonConformanceNotFound]: 'errors.notFound',
  [ErrorCode.NonConformanceRejectionReasonRequired]: 'errors.rejectionReasonRequired',
  [ErrorCode.NonConformanceInvalidTransition]: 'errors.invalidTransition',
  [ErrorCode.NcClosedCannotUpdate]: 'errors.closedCannotUpdate',
  [ErrorCode.NcClosedCannotLinkRepair]: 'errors.closedCannotLinkRepair',
  [ErrorCode.NcTypeRequired]: 'errors.ncTypeRequired',
  [ErrorCode.NcEquipmentAlreadyNonConforming]: 'errors.equipmentAlreadyNonConforming',
  [ErrorCode.NcRepairRecordRequired]: 'errors.repairRecordRequired',
  [ErrorCode.NcRecalibrationRequired]: 'errors.recalibrationRequired',
  [ErrorCode.NcRepairAlreadyLinked]: 'errors.repairAlreadyLinked',
};

const NON_CONFORMANCE_ERROR_I18N_VARS: Partial<
  Record<ErrorCode, Record<string, string | number | Date>>
> = {
  [ErrorCode.NonConformanceRejectionReasonRequired]: {
    min: VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH,
  },
};

export function mapNonConformanceErrorToToast(
  error: unknown,
  t: TranslationFunction,
  tErrors?: TranslationFunction
): ErrorToast {
  const code = extractErrorCode(error);
  const errorCode = code as ErrorCode | null;

  if (errorCode && NON_CONFORMANCE_ERROR_I18N_KEYS[errorCode]) {
    return {
      title: t('errors.title'),
      description: t(
        NON_CONFORMANCE_ERROR_I18N_KEYS[errorCode]!,
        NON_CONFORMANCE_ERROR_I18N_VARS[errorCode]
      ),
    };
  }

  // ADR-0008: ErrorCode 미매핑 시 Zod validation issues fallback
  if (extractValidationIssues(error)) {
    const zodToast = mapZodIssuesToToast(error, t, tErrors);
    if (zodToast) return zodToast;
  }

  return {
    title: t('errors.title'),
    description: t('errors.genericError'),
  };
}

export function mapBackendErrorCode(code?: string): string {
  return code ?? 'UNKNOWN_ERROR';
}
