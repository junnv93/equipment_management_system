/**
 * Disposal 도메인 에러 매핑 SSOT
 *
 * Backend `ErrorCode` 응답을 frontend i18n 메시지로 변환한다.
 * 호출처는 `mapDisposalErrorToToast(error, t)`를 사용하여 type-safe하게 toast 메시지 구성.
 *
 * @example
 * onError: async (error: Error) => {
 *   toast({ ...mapDisposalErrorToToast(error, t), variant: 'destructive' });
 * }
 *
 * @see packages/schemas/src/errors.ts (ErrorCode SSOT)
 * @see apps/frontend/messages/{ko,en}/disposal.json (errors namespace)
 */
import { ErrorCode } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { extractErrorCode, extractValidationIssues } from './extract-error';
import { mapZodIssuesToToast } from './zod-issue-mapper';

// 호환성 re-export — 21+ 도메인 mapper(`approval-errors`/`calibration-errors` 등)가
// `import { extractErrorCode } from './disposal-errors'` 형태로 import 중. extract-error.ts SSOT
// 신설 후에도 호출자 0 변경 보장 (ADR-0008 §Phase 4 hub 통합).
export { extractErrorCode };

export interface ErrorToast {
  title: string;
  description: string;
}

type TranslationFunction = (key: string, values?: Record<string, string | number | Date>) => string;

/**
 * Disposal 도메인 ErrorCode → i18n key 매핑 (SSOT)
 *
 * 매핑되지 않은 ErrorCode는 fallback으로 처리됨 (error.message 또는 'common.error').
 */
const DISPOSAL_ERROR_I18N_KEYS: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.DisposalRejectCommentRequired]: 'errors.rejectCommentRequired',
  [ErrorCode.DisposalReviewedNotFound]: 'errors.reviewedNotFound',
  [ErrorCode.DisposalPendingNotFound]: 'errors.pendingNotFound',
  [ErrorCode.DisposalReviewerNotFound]: 'errors.reviewerNotFound',
  [ErrorCode.DisposalTeamScopeOnly]: 'errors.teamScopeOnly',
  [ErrorCode.DisposalAlreadyInProgress]: 'errors.alreadyInProgress',
  [ErrorCode.DisposalOnlyRequesterCanCancel]: 'errors.onlyRequesterCanCancel',
  [ErrorCode.DisposalRequestNotFound]: 'errors.requestNotFound',
  [ErrorCode.EquipmentNotFound]: 'errors.equipmentNotFound',
  [ErrorCode.UserNotFound]: 'errors.userNotFound',
};

/**
 * ErrorCode 별 i18n 메시지 변수 (예: rejectCommentRequired의 {min})
 */
const DISPOSAL_ERROR_I18N_VARS: Partial<Record<ErrorCode, Record<string, string | number | Date>>> =
  {
    [ErrorCode.DisposalRejectCommentRequired]: {
      min: VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH,
    },
  };

/**
 * Disposal mutation onError에서 toast props 생성
 *
 * @param error - mutation error (ApiError / Axios / plain Error)
 * @param t - next-intl translation function (`useTranslations('disposal')` 결과)
 * @returns toast title + description
 */
export function mapDisposalErrorToToast(
  error: unknown,
  t: TranslationFunction,
  tErrors?: TranslationFunction
): ErrorToast {
  const code = extractErrorCode(error);
  const errorCode = code as ErrorCode | null;

  if (errorCode && DISPOSAL_ERROR_I18N_KEYS[errorCode]) {
    return {
      title: t('errors.title'),
      description: t(DISPOSAL_ERROR_I18N_KEYS[errorCode]!, DISPOSAL_ERROR_I18N_VARS[errorCode]),
    };
  }

  // ADR-0008: ErrorCode 미매핑 시 Zod validation issues fallback
  if (extractValidationIssues(error)) {
    const zodToast = mapZodIssuesToToast(error, t, tErrors);
    if (zodToast) return zodToast;
  }

  // Fallback: backend message 또는 generic
  return {
    title: t('errors.title'),
    description: error instanceof Error ? error.message : String(error),
  };
}
