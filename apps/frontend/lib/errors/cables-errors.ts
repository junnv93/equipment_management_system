/**
 * Cables 도메인 에러 매핑 SSOT
 *
 * @see packages/schemas/src/errors.ts (ErrorCode SSOT)
 * @see apps/frontend/messages/{ko,en}/cables.json (errors namespace)
 *   — 호출자 useTranslations('cables') 사용 (CableDetailContent 패턴)
 */
import { ErrorCode } from '@equipment-management/schemas';
import { extractErrorCode, type ErrorToast } from './disposal-errors';
import { extractValidationIssues } from './extract-error';
import { mapZodIssuesToToast } from './zod-issue-mapper';

type TranslationFunction = (key: string, values?: Record<string, string | number | Date>) => string;

const CABLE_ERROR_I18N_KEYS: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.CableNotFound]: 'errors.notFound',
  [ErrorCode.CableLossMeasurementNotFound]: 'errors.lossMeasurementNotFound',
};

export function mapCableErrorToToast(
  error: unknown,
  t: TranslationFunction,
  tErrors?: TranslationFunction
): ErrorToast {
  const code = extractErrorCode(error);
  const errorCode = code as ErrorCode | null;

  if (errorCode && CABLE_ERROR_I18N_KEYS[errorCode]) {
    return {
      title: t('errors.title'),
      description: t(CABLE_ERROR_I18N_KEYS[errorCode]!),
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
