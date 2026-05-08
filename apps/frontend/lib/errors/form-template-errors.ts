/**
 * Form template 도메인 에러 매핑 SSOT.
 *
 * @see packages/schemas/src/errors.ts (ErrorCode SSOT)
 * @see apps/frontend/messages/{ko,en}/form-templates.json (errors/uploadDialog namespace)
 */
import { ErrorCode } from '@equipment-management/schemas';
import { extractErrorCode, type ErrorToast } from './disposal-errors';
import { extractValidationIssues } from './extract-error';
import { mapZodIssuesToToast } from './zod-issue-mapper';

type TranslationFunction = (key: string, values?: Record<string, string | number | Date>) => string;

const FORM_TEMPLATE_FALLBACK_I18N_KEY = 'uploadDialog.error';

const FORM_TEMPLATE_ERROR_I18N_KEYS: Readonly<Record<string, string>> = {
  [ErrorCode.FormNumberAlreadyExists]: 'uploadDialog.errorNumberExists',
  [ErrorCode.InvalidFormName]: FORM_TEMPLATE_FALLBACK_I18N_KEY,
  [ErrorCode.InvalidFormNumberFormat]: FORM_TEMPLATE_FALLBACK_I18N_KEY,
  [ErrorCode.FormTemplateNotFound]: 'errors.notFound',
  [ErrorCode.InspectionTemplateNotFound]: 'errors.inspectionTemplateNotFound',
};

export function mapFormTemplateErrorCode(code?: string): string {
  if (!code) return FORM_TEMPLATE_FALLBACK_I18N_KEY;

  return FORM_TEMPLATE_ERROR_I18N_KEYS[code.toUpperCase()] ?? FORM_TEMPLATE_FALLBACK_I18N_KEY;
}

export function mapFormTemplateErrorToToast(error: unknown, t: TranslationFunction): ErrorToast {
  const code = extractErrorCode(error) ?? undefined;
  const key = mapFormTemplateErrorCode(code);

  // ErrorCode가 특정 키로 매핑된 경우 즉시 반환
  if (key !== FORM_TEMPLATE_FALLBACK_I18N_KEY) {
    return {
      title: t('errors.title'),
      description: t(key),
    };
  }

  // ADR-0008: ErrorCode 미매핑 시 Zod validation issues fallback (변형 패턴: 단일 return 구조)
  if (extractValidationIssues(error)) {
    const zodToast = mapZodIssuesToToast(error, t);
    if (zodToast) return zodToast;
  }

  return {
    title: t('errors.title'),
    description: t(key),
  };
}
