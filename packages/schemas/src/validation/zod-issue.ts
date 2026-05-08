import { z } from 'zod';

/**
 * Backend Validation Issue SSOT (ADR-0008)
 *
 * Zod 검증 실패를 backend → frontend로 전달하는 *machine-readable* 응답 shape.
 *
 * **단방향 wire**: 본 모듈은 frontend i18n에 의존하지 *않습니다*. frontend가 본 모듈에서
 * `BackendValidationIssue` shape를 import하여 path/code/params를 i18n key로 변환합니다.
 *
 * @see docs/adr/0008-backend-zod-error-i18n.md
 * @see apps/frontend/lib/errors/zod-issue-mapper.ts
 */

const ZOD_ISSUE_CODES = [
  'invalid_type',
  'too_big',
  'too_small',
  'invalid_format',
  'not_multiple_of',
  'unrecognized_keys',
  'invalid_union',
  'invalid_key',
  'invalid_element',
  'invalid_value',
  'custom',
] as const;

export type ZodIssueCode = (typeof ZOD_ISSUE_CODES)[number];

export const ZOD_ISSUE_CODE_VALUES: ReadonlyArray<ZodIssueCode> = ZOD_ISSUE_CODES;

export interface BackendValidationIssue {
  path: Array<string | number>;
  code: ZodIssueCode;
  params?: Record<string, unknown>;
}

/** zod v4 invalid_format `pattern` 필드는 정규식 정의 노출 — production redact 대상. */
const PII_REDACT_FIELDS_PRODUCTION: ReadonlyArray<string> = ['pattern'];

const REDACTED = '[REDACTED]';

/**
 * Minimum shape required for serialization — compatible with zod v4 `$ZodIssue` family
 * (whose `path` is `PropertyKey[]` and whose extra fields vary by `code`).
 */
export interface ZodLikeIssue {
  readonly code: string;
  readonly path: ReadonlyArray<PropertyKey>;
}

function normalizePath(path: ReadonlyArray<PropertyKey>): Array<string | number> {
  return path.map((segment): string | number =>
    typeof segment === 'symbol' ? segment.toString() : segment
  );
}

const KNOWN_PARAM_KEYS_BY_CODE: Readonly<Record<ZodIssueCode, ReadonlyArray<string>>> = {
  invalid_type: ['expected'],
  too_big: ['origin', 'maximum', 'inclusive'],
  too_small: ['origin', 'minimum', 'inclusive'],
  invalid_format: ['origin', 'format', 'pattern'],
  not_multiple_of: ['origin', 'divisor'],
  unrecognized_keys: ['keys'],
  invalid_union: [],
  invalid_key: ['origin'],
  invalid_element: ['origin'],
  invalid_value: ['values'],
  custom: ['params'],
};

function isKnownZodIssueCode(code: string): code is ZodIssueCode {
  return (ZOD_ISSUE_CODES as ReadonlyArray<string>).includes(code);
}

/**
 * Zod issue → BackendValidationIssue 변환.
 *
 * - `path` / `code` 그대로 복사
 * - `params`: code별 known 필드만 추출 (allow-list 정책 — 알 수 없는 필드 자동 제외)
 * - `message` (한국어/영어 fallback) 는 응답 path에서 사용 안 함 — VM SSOT 격하 (ADR-0008)
 *
 * 알 수 없는 issue code (zod major bump 신규 추가 등) 는 `custom` 로 normalize.
 */
export function serializeZodIssue(issue: ZodLikeIssue): BackendValidationIssue {
  const code: ZodIssueCode = isKnownZodIssueCode(issue.code) ? issue.code : 'custom';
  const knownKeys = KNOWN_PARAM_KEYS_BY_CODE[code];
  const params: Record<string, unknown> = {};
  const indexed = issue as unknown as Record<string, unknown>;
  for (const key of knownKeys) {
    if (key in indexed && indexed[key] !== undefined) {
      params[key] = indexed[key];
    }
  }
  return {
    path: normalizePath(issue.path),
    code,
    ...(Object.keys(params).length > 0 ? { params } : {}),
  };
}

/**
 * Production 환경에서 PII 가능성이 있는 필드 redact.
 *
 * zod v4 기본 issue 는 input 값을 노출하지 않아 (`received` 필드 미존재) 대부분 안전.
 * 단, `invalid_format.pattern` (정규식 정의) 은 운영 logs/응답에 노출 시 보안 정보 누설
 * 가능 — production redact 대상.
 */
export function redactIssueReceived(
  issue: BackendValidationIssue,
  isProduction: boolean
): BackendValidationIssue {
  if (!isProduction) return issue;
  if (!issue.params) return issue;

  let redactedAny = false;
  const nextParams: Record<string, unknown> = { ...issue.params };
  for (const field of PII_REDACT_FIELDS_PRODUCTION) {
    if (field in nextParams) {
      nextParams[field] = REDACTED;
      redactedAny = true;
    }
  }
  if (!redactedAny) return issue;
  return {
    ...issue,
    params: nextParams,
  };
}

export const BackendValidationIssueSchema = z.object({
  path: z.array(z.union([z.string(), z.number()])),
  code: z.enum(ZOD_ISSUE_CODES),
  params: z.record(z.string(), z.unknown()).optional(),
});

/** Type-level exhaustive guard — 신규 ZodIssueCode 누락 시 컴파일 FAIL. */
const _exhaustiveGuard: Record<ZodIssueCode, ReadonlyArray<string>> = KNOWN_PARAM_KEYS_BY_CODE;
void _exhaustiveGuard;
