/**
 * 소프트웨어 유효성 확인 에러 매핑 SSOT (UL-QP-18-09)
 *
 * @see packages/schemas/src/errors.ts (ErrorCode SSOT)
 * @see apps/frontend/messages/{ko,en}/software.json (errors namespace)
 *   — 호출자 useTranslations('software') 사용
 */
import { ErrorCode } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { extractErrorCode, type ErrorToast } from './disposal-errors';
import { extractValidationIssues } from './extract-error';
import { mapZodIssuesToToast } from './zod-issue-mapper';

type TranslationFunction = (key: string, values?: Record<string, string | number | Date>) => string;

/**
 * Software Validation reject defense-in-depth ErrorCode → toast (5-layer SSOT)
 *
 * 호출자 useTranslations('software') — `errors.rejectionReasonRequired` 키는 software.json에 존재.
 *
 * @see ErrorCode.SoftwareValidationRejectionReasonRequired
 */
const SOFTWARE_VALIDATION_REJECT_ERROR_I18N_KEYS: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.SoftwareValidationNotFound]: 'errors.notFound',
  [ErrorCode.SoftwareValidationRejectionReasonRequired]: 'errors.rejectionReasonRequired',
  [ErrorCode.SoftwareValidationInvalidStatusTransition]: 'errors.invalidStatusForReject',
  [ErrorCode.SoftwareValidationOnlyDraftCanUpdate]: 'errors.onlyDraftCanUpdate',
  [ErrorCode.SoftwareValidationOnlyDraftCanSubmit]: 'errors.onlyDraftCanSubmit',
  [ErrorCode.SoftwareValidationOnlySubmittedCanApprove]: 'errors.onlySubmittedCanApprove',
  [ErrorCode.SoftwareValidationOnlyApprovedCanQualityApprove]:
    'errors.onlyApprovedCanQualityApprove',
  [ErrorCode.SoftwareValidationOnlyRejectedCanRevise]: 'errors.onlyRejectedCanRevise',
};

const SOFTWARE_VALIDATION_REJECT_ERROR_I18N_VARS: Partial<
  Record<ErrorCode, Record<string, string | number | Date>>
> = {
  [ErrorCode.SoftwareValidationRejectionReasonRequired]: {
    min: VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH,
  },
};

export function mapSoftwareValidationErrorToToast(
  error: unknown,
  t: TranslationFunction,
  tErrors?: TranslationFunction
): ErrorToast {
  const code = extractErrorCode(error);
  const errorCode = code as ErrorCode | null;

  if (errorCode && SOFTWARE_VALIDATION_REJECT_ERROR_I18N_KEYS[errorCode]) {
    return {
      title: t('errors.title'),
      description: t(
        SOFTWARE_VALIDATION_REJECT_ERROR_I18N_KEYS[errorCode]!,
        SOFTWARE_VALIDATION_REJECT_ERROR_I18N_VARS[errorCode]
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
