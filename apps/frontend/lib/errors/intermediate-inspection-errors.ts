/**
 * Intermediate Inspection 도메인 에러 매핑 SSOT
 *
 * @see packages/schemas/src/errors.ts (ErrorCode SSOT)
 * @see apps/frontend/messages/{ko,en}/calibration.json (errors namespace)
 *   — 호출자 useTranslations('calibration') 사용 (IntermediateInspectionList 패턴)
 */
import { ErrorCode } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { extractErrorCode, type ErrorToast } from './disposal-errors';
import { extractValidationIssues } from './extract-error';
import { mapZodIssuesToToast } from './zod-issue-mapper';

type TranslationFunction = (key: string, values?: Record<string, string | number | Date>) => string;

const INTERMEDIATE_INSPECTION_ERROR_I18N_KEYS: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.IntermediateInspectionNotFound]: 'errors.intermediateInspection.notFound',
  [ErrorCode.InspectionItemNotFound]: 'errors.intermediateInspection.itemNotFound',
  [ErrorCode.InspectionTemplateNotFound]: 'errors.intermediateInspection.templateNotFound',
  [ErrorCode.ResultSectionNotFound]: 'errors.intermediateInspection.resultSectionNotFound',
  [ErrorCode.IntermediateInspectionRejectionReasonRequired]: 'errors.rejectionReasonRequired',
  [ErrorCode.IntermediateInspectionInvalidStatusTransition]: 'errors.invalidStatusForReject',
  [ErrorCode.IntermediateInspectionOnlyDraftCanUpdate]:
    'errors.intermediateInspection.onlyDraftCanUpdate',
  [ErrorCode.IntermediateInspectionOnlyDraftCanSubmit]:
    'errors.intermediateInspection.onlyDraftCanSubmit',
  [ErrorCode.IntermediateInspectionOnlySubmittedCanReview]:
    'errors.intermediateInspection.onlySubmittedCanReview',
  [ErrorCode.IntermediateInspectionOnlyReviewedCanApprove]:
    'errors.intermediateInspection.onlyReviewedCanApprove',
  [ErrorCode.IntermediateInspectionOnlySubmittedCanWithdraw]:
    'errors.intermediateInspection.onlySubmittedCanWithdraw',
  [ErrorCode.IntermediateInspectionOnlyRejectedCanResubmit]:
    'errors.intermediateInspection.onlyRejectedCanResubmit',
  [ErrorCode.IntermediateInspectionWithdrawNotSubmitter]:
    'errors.intermediateInspection.withdrawNotSubmitter',
};

const INTERMEDIATE_INSPECTION_ERROR_I18N_VARS: Partial<
  Record<ErrorCode, Record<string, string | number | Date>>
> = {
  [ErrorCode.IntermediateInspectionRejectionReasonRequired]: {
    min: VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH,
  },
};

export function mapIntermediateInspectionErrorToToast(
  error: unknown,
  t: TranslationFunction,
  tErrors?: TranslationFunction
): ErrorToast {
  const code = extractErrorCode(error);
  const errorCode = code as ErrorCode | null;

  if (errorCode && INTERMEDIATE_INSPECTION_ERROR_I18N_KEYS[errorCode]) {
    return {
      title: t('errors.title'),
      description: t(
        INTERMEDIATE_INSPECTION_ERROR_I18N_KEYS[errorCode]!,
        INTERMEDIATE_INSPECTION_ERROR_I18N_VARS[errorCode]
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
