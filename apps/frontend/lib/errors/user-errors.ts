/**
 * User 도메인 에러 매핑 SSOT
 *
 * @see packages/schemas/src/errors.ts (ErrorCode SSOT)
 * @see apps/frontend/messages/{ko,en}/users.json (errors namespace)
 *   — 호출자 useTranslations('users') 사용
 */
import { ErrorCode } from '@equipment-management/schemas';
import { extractErrorCode, type ErrorToast } from './disposal-errors';
import { extractValidationIssues } from './extract-error';
import { mapZodIssuesToToast } from './zod-issue-mapper';

type TranslationFunction = (key: string, values?: Record<string, string | number | Date>) => string;

const USER_ERROR_FALLBACK_I18N_KEY = 'errors.unknown';

const USER_ERROR_I18N_KEYS: Readonly<Partial<Record<ErrorCode, string>>> = {
  [ErrorCode.UserNotFound]: 'errors.notFound',
  [ErrorCode.UserEmailAlreadyExists]: 'errors.emailAlreadyExists',
  [ErrorCode.UserNoRoleChangePermission]: 'errors.noRoleChangePermission',
  [ErrorCode.UserCannotChangeOwnRole]: 'errors.cannotChangeOwnRole',
  [ErrorCode.UserCannotChangeSeniorRole]: 'errors.cannotChangeSeniorRole',
  [ErrorCode.UserTeamScopeOnly]: 'errors.teamScopeOnly',
  [ErrorCode.UserSiteScopeOnly]: 'errors.siteScopeOnly',
};

export function mapUserErrorToToast(
  error: unknown,
  t: TranslationFunction,
  tErrors?: TranslationFunction
): ErrorToast {
  const code = extractErrorCode(error);
  const i18nKey = mapBackendErrorCode(code ?? undefined);

  if (i18nKey !== USER_ERROR_FALLBACK_I18N_KEY) {
    return {
      title: t('errors.title'),
      description: t(i18nKey),
    };
  }

  // ADR-0008: ErrorCode 미매핑 시 Zod validation issues fallback (변형 패턴: mapBackendErrorCode 헬퍼 경유)
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
  if (!code) return USER_ERROR_FALLBACK_I18N_KEY;

  const normalizedCode = code.toUpperCase() as ErrorCode;
  return USER_ERROR_I18N_KEYS[normalizedCode] ?? USER_ERROR_FALLBACK_I18N_KEY;
}
