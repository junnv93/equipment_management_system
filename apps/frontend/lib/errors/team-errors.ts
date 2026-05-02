/**
 * Team 도메인 에러 매핑 SSOT
 *
 * @see packages/schemas/src/errors.ts (ErrorCode SSOT)
 * @see apps/frontend/messages/{ko,en}/teams.json (errors namespace)
 *   — 호출자 useTranslations('teams') 사용
 */
import { ErrorCode } from '@equipment-management/schemas';
import { extractErrorCode, type ErrorToast } from './disposal-errors';

type TranslationFunction = (key: string, values?: Record<string, string | number | Date>) => string;

const TEAM_ERROR_I18N_KEYS: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.TeamNotFound]: 'errors.notFound',
  [ErrorCode.TeamNameAlreadyExists]: 'errors.nameAlreadyExists',
  [ErrorCode.TeamLeaderSiteMismatch]: 'errors.leaderSiteMismatch',
};

export function mapTeamErrorToToast(error: unknown, t: TranslationFunction): ErrorToast {
  const code = extractErrorCode(error);
  const errorCode = code as ErrorCode | null;

  if (errorCode && TEAM_ERROR_I18N_KEYS[errorCode]) {
    return {
      title: t('errors.title'),
      description: t(TEAM_ERROR_I18N_KEYS[errorCode]!),
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
