/**
 * Zod Issue → i18n Key Mapper (Frontend SSOT — ADR-0008)
 *
 * Backend `BackendValidationIssue[]` 응답을 next-intl i18n 메시지로 변환한다.
 *
 * 변환 규칙:
 * - `tErrors = useTranslations('errors')` 전달 시: `key = 'validation.' + issue.code`
 * - `tErrors` 미전달 시 (하위 호환): `key = 'errors.validation.' + issue.code` (domain t 사용)
 * - `params.field = t('fields.' + issue.path[0])` 또는 `'fields.unknown'` fallback
 * - `params.{minimum, maximum, format, divisor, expected, ...}` 등 issue.params 1:1 forward
 *
 * **단방향 wire**: `packages/schemas` 는 본 mapper 에 의존하지 *않습니다*. schemas는 Zod issue
 * shape (path/code/params) 만 노출, 본 mapper 는 frontend 측 i18n routing 책임.
 *
 * **tErrors 패턴**: 도메인 scoped t(`useTranslations('teams')`)는 errors.json 네임스페이스에
 * 접근 불가. `tErrors = useTranslations('errors')` 를 별도로 주입해야 정확한 메시지 반환.
 * 모든 도메인 mapper 호출자는 `tErrors` 를 전달할 것을 권고 (미전달 시 raw key 노출 위험).
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
 * @param keyPrefix `'errors.'` (도메인 scoped t) 또는 `''` (errors namespace scoped tErrors).
 *   호출자는 `tErrors` 유무에 따라 prefix를 결정한다.
 */
export function mapZodIssueToI18nKey(
  issue: BackendValidationIssue,
  t: TranslationFunction,
  keyPrefix: string = 'errors.'
): MappedIssue {
  const code: ZodIssueCode = issue.code;
  const fieldKey =
    issue.path.length > 0 &&
    (typeof issue.path[0] === 'string' || typeof issue.path[0] === 'number')
      ? `${keyPrefix}fields.${String(issue.path[0])}`
      : `${keyPrefix}fields.unknown`;
  const fieldLabel = safeTranslate(t, fieldKey, `${keyPrefix}fields.unknown`);

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
    key: `${keyPrefix}validation.${code}`,
    params,
  };
}

function safeTranslate(
  t: TranslationFunction,
  key: string,
  fallback: string,
  params?: Record<string, string | number | Date>
): string {
  try {
    const value = params ? t(key, params) : t(key);
    // next-intl 미존재 키는 보통 key 자체 또는 missing message 반환 — 양쪽 모두 fallback 시도
    if (value === key || value === '') {
      return params ? t(fallback, params) : t(fallback);
    }
    return value;
  } catch {
    return params ? t(fallback, params) : t(fallback);
  }
}

export interface ErrorToast {
  title: string;
  description: string;
}

/**
 * Backend 에러 응답 → toast 메시지 (다중 issue 시 ", " 로 join).
 *
 * @param tErrors `useTranslations('errors')` — errors 네임스페이스 전용 t 함수.
 *   전달 시 key prefix `''` (e.g. `'validation.too_small'`), 미전달 시 `'errors.'` prefix.
 *   도메인 scoped t는 errors.json 접근 불가 → tErrors 전달 필수 (미전달 시 raw key 노출 위험).
 * @returns issues 미존재 시 null — 호출자는 ErrorCode mapper 로 fallback.
 */
export function mapZodIssuesToToast(
  error: unknown,
  t: TranslationFunction,
  tErrors?: TranslationFunction
): ErrorToast | null {
  const issues = extractValidationIssues(error);
  console.log('[ADR-0008-DEBUG] mapZodIssuesToToast issues:', issues);
  if (!issues || issues.length === 0) return null;

  const te = tErrors ?? t;
  const prefix = tErrors ? '' : 'errors.';

  const description = issues
    .map((issue) => {
      const mapped = mapZodIssueToI18nKey(issue, te, prefix);
      return safeTranslate(
        te,
        mapped.key,
        `${prefix}validation.custom`,
        mapped.params as Record<string, string | number | Date>
      );
    })
    .join(', ');

  const result = {
    title: safeTranslate(te, `${prefix}validation.title`, `${prefix}title`),
    description,
  };
  console.log('[ADR-0008-DEBUG] mapZodIssuesToToast result:', result);
  return result;
}
