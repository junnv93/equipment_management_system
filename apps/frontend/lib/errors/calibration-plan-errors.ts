/**
 * Calibration Plan 도메인 에러 매핑 SSOT
 *
 * Backend `ErrorCode` 응답을 frontend i18n 메시지로 변환한다.
 * Disposal 도메인과 동일한 패턴 (mapDisposalErrorToToast 참조).
 *
 * @see packages/schemas/src/errors.ts (ErrorCode SSOT)
 * @see apps/frontend/messages/{ko,en}/calibration.json (planErrors namespace)
 */
import { ErrorCode } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { extractErrorCode, type ErrorToast } from './disposal-errors';
import { extractValidationIssues } from './extract-error';
import { mapZodIssuesToToast } from './zod-issue-mapper';

type TranslationFunction = (key: string, values?: Record<string, string | number | Date>) => string;

/**
 * Calibration Plan 도메인 ErrorCode → i18n key 매핑 (SSOT)
 */
const CALIBRATION_PLAN_ERROR_I18N_KEYS: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.CalibrationPlanNotFound]: 'planErrors.notFound',
  [ErrorCode.CalibrationPlanItemNotFound]: 'planErrors.itemNotFound',
  [ErrorCode.CalibrationPlanAlreadyExists]: 'planErrors.alreadyExists',
  [ErrorCode.CalibrationPlanRejectionReasonRequired]: 'planErrors.rejectionReasonRequired',
  [ErrorCode.CalibrationPlanInvalidStatusForReject]: 'planErrors.invalidStatusForReject',
  [ErrorCode.CalibrationPlanInvalidStatusForSubmit]: 'planErrors.invalidStatusForSubmit',
  [ErrorCode.CalibrationPlanOnlyApprovedCanConfirm]: 'planErrors.onlyApprovedCanConfirm',
  [ErrorCode.CalibrationPlanOnlyApprovedCanCreateVersion]:
    'planErrors.onlyApprovedCanCreateVersion',
  [ErrorCode.CalibrationPlanOnlyDraftCanDelete]: 'planErrors.onlyDraftCanDelete',
  [ErrorCode.CalibrationPlanOnlyDraftCanUpdate]: 'planErrors.onlyDraftCanUpdate',
  [ErrorCode.CalibrationPlanOnlyDraftCanUpdateItem]: 'planErrors.onlyDraftCanUpdateItem',
  [ErrorCode.CalibrationPlanOnlyPendingReviewCanReview]: 'planErrors.onlyPendingReviewCanReview',
  [ErrorCode.CalibrationPlanOnlyPendingApprovalCanApprove]:
    'planErrors.onlyPendingApprovalCanApprove',
  [ErrorCode.CalibrationPlanItemNotExecuted]: 'planErrors.itemNotExecuted',
  [ErrorCode.CalibrationPlanNonExportableStatus]: 'planErrors.nonExportableStatus',
};

/**
 * ErrorCode 별 i18n 메시지 변수
 */
const CALIBRATION_PLAN_ERROR_I18N_VARS: Partial<
  Record<ErrorCode, Record<string, string | number | Date>>
> = {
  [ErrorCode.CalibrationPlanRejectionReasonRequired]: {
    min: VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH,
  },
};

/**
 * Calibration Plan mutation onError에서 toast props 생성
 *
 * @param error - mutation error
 * @param t - next-intl translation function (`useTranslations('calibration')` 결과)
 */
export function mapCalibrationPlanErrorToToast(
  error: unknown,
  t: TranslationFunction,
  tErrors?: TranslationFunction
): ErrorToast {
  const code = extractErrorCode(error);
  const errorCode = code as ErrorCode | null;

  if (errorCode && CALIBRATION_PLAN_ERROR_I18N_KEYS[errorCode]) {
    return {
      title: t('planErrors.title'),
      description: t(
        CALIBRATION_PLAN_ERROR_I18N_KEYS[errorCode]!,
        CALIBRATION_PLAN_ERROR_I18N_VARS[errorCode]
      ),
    };
  }

  // ADR-0008: ErrorCode 미매핑 시 Zod validation issues fallback
  if (extractValidationIssues(error)) {
    const zodToast = mapZodIssuesToToast(error, t, tErrors);
    if (zodToast) return zodToast;
  }

  return {
    title: t('planErrors.title'),
    description: t('planErrors.genericError'),
  };
}
