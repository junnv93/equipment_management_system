/**
 * Checkout 도메인 에러 매핑 SSOT
 *
 * @see packages/schemas/src/errors.ts (ErrorCode SSOT)
 * @see apps/frontend/messages/{ko,en}/checkouts.json (errors namespace)
 *   — 호출자 useTranslations('checkouts') 사용
 */
import { ErrorCode } from '@equipment-management/schemas';
import { extractErrorCode, type ErrorToast } from './disposal-errors';

type TranslationFunction = (key: string, values?: Record<string, string | number | Date>) => string;

const CHECKOUT_ERROR_I18N_KEYS: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.CheckoutNotFound]: 'errors.notFound',
  [ErrorCode.CheckoutAlreadyApproved]: 'errors.alreadyApproved',
  [ErrorCode.CheckoutNotPending]: 'errors.notPending',
  [ErrorCode.VersionConflict]: 'errors.versionConflict',
};

export function mapCheckoutErrorToToast(error: unknown, t: TranslationFunction): ErrorToast {
  const code = extractErrorCode(error);
  const errorCode = code as ErrorCode | null;

  if (errorCode && CHECKOUT_ERROR_I18N_KEYS[errorCode]) {
    return {
      title: t('errors.title'),
      description: t(CHECKOUT_ERROR_I18N_KEYS[errorCode]!),
    };
  }

  return {
    title: t('errors.title'),
    description: error instanceof Error ? error.message : String(error),
  };
}

export function mapBackendErrorCode(code?: string): string {
  return code ?? 'UNKNOWN_ERROR';
}
