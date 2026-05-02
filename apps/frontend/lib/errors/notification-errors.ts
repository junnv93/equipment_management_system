/**
 * Notification 도메인 에러 매핑 SSOT
 *
 * @see packages/schemas/src/errors.ts (ErrorCode SSOT)
 * @see apps/frontend/messages/{ko,en}/notifications.json (errors namespace)
 *   — 호출자 useTranslations('notifications') 사용
 */
import { ErrorCode } from '@equipment-management/schemas';
import { extractErrorCode, type ErrorToast } from './disposal-errors';

type TranslationFunction = (key: string, values?: Record<string, string | number | Date>) => string;

const NOTIFICATION_ERROR_I18N_KEYS: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.NotificationNotFound]: 'errors.notFound',
};

export function mapNotificationErrorToToast(error: unknown, t: TranslationFunction): ErrorToast {
  const code = extractErrorCode(error);
  const errorCode = code as ErrorCode | null;

  if (errorCode && NOTIFICATION_ERROR_I18N_KEYS[errorCode]) {
    return {
      title: t('errors.title'),
      description: t(NOTIFICATION_ERROR_I18N_KEYS[errorCode]!),
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
