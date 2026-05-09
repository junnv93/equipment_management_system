/**
 * Approval 도메인 에러 매핑 SSOT (delegation 등 승인 위임 ErrorCode 라우팅).
 *
 * @see packages/schemas/src/errors.ts (ErrorCode SSOT)
 * @see apps/frontend/messages/{ko,en}/approvals.json (errors namespace)
 *   — 호출자 useTranslations('approvals') 사용
 */
import { ErrorCode } from '@equipment-management/schemas';
import { extractErrorCode, type ErrorToast } from './disposal-errors';
import { extractValidationIssues } from './extract-error';
import { mapZodIssuesToToast } from './zod-issue-mapper';

type TranslationFunction = (key: string, values?: Record<string, string | number | Date>) => string;

const APPROVAL_ERROR_I18N_KEYS: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.ApprovalDelegationSelfDelegationForbidden]: 'errors.delegationSelfForbidden',
  [ErrorCode.ApprovalDelegationInvalidPeriod]: 'errors.delegationInvalidPeriod',
};

export function mapApprovalErrorToToast(
  error: unknown,
  t: TranslationFunction,
  tErrors?: TranslationFunction
): ErrorToast {
  const code = extractErrorCode(error);
  const errorCode = code as ErrorCode | null;

  if (errorCode && APPROVAL_ERROR_I18N_KEYS[errorCode]) {
    return {
      title: t('errors.title'),
      description: t(APPROVAL_ERROR_I18N_KEYS[errorCode]!),
    };
  }

  // ADR-0008: ErrorCode 미매핑 시 Zod validation issues fallback
  if (extractValidationIssues(error)) {
    const zodToast = mapZodIssuesToToast(error, t, tErrors);
    if (zodToast) return zodToast;
  }

  return {
    title: t('errors.title'),
    description: error instanceof Error ? error.message : String(error),
  };
}
