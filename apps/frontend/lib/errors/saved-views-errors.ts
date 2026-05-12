/**
 * Saved Views 도메인 frontend error mapper — Layer 5 of 5-layer defense.
 *
 * Backend `ErrorCode` 응답 → i18n key 매핑 SSOT. mutation 의 onError 에서 toast 메시지 생성.
 *
 * SSOT 관계:
 *   - packages/schemas/src/errors.ts (ErrorCode enum)
 *   - apps/backend/src/modules/saved-views/saved-views-error-codes.ts (백엔드 SSOT)
 *   - apps/frontend/messages/{ko,en}/errors.json `savedView.*` (i18n 메시지)
 */
import { ErrorCode } from '@equipment-management/schemas';
import { extractErrorCode, extractValidationIssues } from './extract-error';
import { mapZodIssuesToToast } from './zod-issue-mapper';

export { extractErrorCode };

export interface ErrorToast {
  title: string;
  description: string;
}

type TranslationFunction = (key: string, values?: Record<string, string | number | Date>) => string;

const SAVED_VIEW_ERROR_I18N_KEYS: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.SavedViewNotFound]: 'errors.notFound',
  [ErrorCode.SavedViewScopeForbidden]: 'errors.scopeForbidden',
  [ErrorCode.SavedViewMaxReached]: 'errors.maxReached',
  [ErrorCode.SavedViewTeamRequiredForScope]: 'errors.teamRequiredForScope',
  [ErrorCode.VersionConflict]: 'errors.versionConflict',
};

/**
 * Saved Views mutation onError 에서 toast props 생성.
 *
 * @param error - mutation error (ApiError / Axios / plain Error)
 * @param t - `useTranslations('checkouts.savedViews')` 결과
 *            (savedViews.* 네임스페이스의 errorTitle / errors.* 매핑)
 * @param tErrors - `useTranslations('errors')` 결과 (Zod fallback)
 */
export function mapSavedViewErrorToToast(
  error: unknown,
  t: TranslationFunction,
  tErrors: TranslationFunction
): ErrorToast {
  const code = extractErrorCode(error);
  const errorCode = code as ErrorCode | null;

  if (errorCode && SAVED_VIEW_ERROR_I18N_KEYS[errorCode]) {
    return {
      title: t('errorTitle'),
      description: t(SAVED_VIEW_ERROR_I18N_KEYS[errorCode]!),
    };
  }

  if (extractValidationIssues(error)) {
    const zodToast = mapZodIssuesToToast(error, t, tErrors);
    if (zodToast) return zodToast;
  }

  return {
    title: t('errorTitle'),
    description: t('errors.genericError'),
  };
}
