/**
 * Zod Issue → i18n Key Mapper (Frontend SSOT — ADR-0008)
 *
 * Backend `BackendValidationIssue[]` 응답을 next-intl i18n 메시지로 변환한다.
 *
 * 변환 규칙:
 * - `key = 'errors.validation.' + issue.code` (11 ZodIssueCode 별 1:1)
 * - `params.field = t('errors.fields.' + issue.path[0])` 또는 `'errors.fields.unknown'` fallback
 * - `params.{minimum, maximum, format, divisor, expected, ...}` 등 issue.params 1:1 forward
 *
 * **단방향 wire**: `packages/schemas` 는 본 mapper 에 의존하지 *않습니다*. schemas는 Zod issue
 * shape (path/code/params) 만 노출, 본 mapper 는 frontend 측 i18n routing 책임.
 *
 * @see packages/schemas/src/validation/zod-issue.ts (BackendValidationIssue SSOT)
 * @see apps/frontend/messages/{ko,en}/errors.json (validation/fields namespace)
 */
import type { BackendValidationIssue, ZodIssueCode } from '@equipment-management/schemas';
import { extractValidationIssues } from './extract-error';

export type TranslationFunction = (
  key: string,
  values?: Record<string, string | number | Date>
) => string;

export interface MappedIssue {
  /** next-intl key (예: `errors.validation.too_small`) */
  key: string;
  /** next-intl ICU 변수 (예: `{ field, minimum, ... }`) */
  params: Record<string, string | number>;
}

/**
 * 단일 BackendValidationIssue → i18n key + params 변환.
 *
 * 호출자는 `t(mapped.key, mapped.params)` 로 사람 가독 메시지 생성.
 */
export function mapZodIssueToI18nKey(
  issue: BackendValidationIssue,
  t: TranslationFunction
): MappedIssue {
  const code: ZodIssueCode = issue.code;
  const fieldKey =
    issue.path.length > 0 &&
    (typeof issue.path[0] === 'string' || typeof issue.path[0] === 'number')
      ? `errors.fields.${String(issue.path[0])}`
      : 'errors.fields.unknown';
  const fieldLabel = safeTranslate(t, fieldKey, 'errors.fields.unknown');

  const params: Record<string, string | number> = { field: fieldLabel };
  if (issue.params) {
    for (const [pkey, pvalue] of Object.entries(issue.params)) {
      if (typeof pvalue === 'string' || typeof pvalue === 'number') {
        params[pkey] = pvalue;
      } else if (typeof pvalue === 'boolean') {
        params[pkey] = String(pvalue);
      } else if (Array.isArray(pvalue)) {
        params[pkey] = pvalue.map((v) => String(v)).join(', ');
      }
      // 나머지 (object/null) 는 i18n 변수로 전달하지 않음 (next-intl ICU 호환 X)
    }
  }

  return {
    key: `errors.validation.${code}`,
    params,
  };
}

function safeTranslate(t: TranslationFunction, key: string, fallback: string): string {
  try {
    const value = t(key);
    // next-intl 미존재 키는 보통 key 자체 또는 missing message 반환 — 양쪽 모두 fallback 시도
    if (value === key || value === '') {
      return t(fallback);
    }
    return value;
  } catch {
    return t(fallback);
  }
}

export interface ErrorToast {
  title: string;
  description: string;
}

/**
 * Backend 에러 응답 → toast 메시지 (다중 issue 시 ", " 로 join).
 *
 * @returns issues 미존재 시 null — 호출자는 ErrorCode mapper 로 fallback.
 */
export function mapZodIssuesToToast(error: unknown, t: TranslationFunction): ErrorToast | null {
  const issues = extractValidationIssues(error);
  if (!issues || issues.length === 0) return null;

  const description = issues
    .map((issue) => {
      const mapped = mapZodIssueToI18nKey(issue, t);
      return t(mapped.key, mapped.params);
    })
    .join(', ');

  return {
    title: safeTranslate(t, 'errors.validation.title', 'errors.title'),
    description,
  };
}
