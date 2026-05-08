import type { BackendValidationIssue } from '@equipment-management/schemas';
import { extractValidationIssues, extractErrorCodeOrIssues } from '../extract-error';
import {
  mapZodIssueToI18nKey,
  mapZodIssuesToToast,
  type TranslationFunction,
} from '../zod-issue-mapper';

const mockT: TranslationFunction = (key, values) => {
  if (key === 'errors.fields.unknown') return '입력값';
  if (key === 'errors.fields.destination') return '반출 장소';
  if (key === 'errors.fields.email') return '이메일';
  if (key === 'errors.fields.casVersion') return '버전';
  if (key === 'errors.validation.title') return '입력 값 검증 오류';
  if (key === 'errors.title') return '에러';
  if (key.startsWith('errors.validation.')) {
    const code = key.replace('errors.validation.', '');
    if (!values) return `[${code}]`;
    const inserted = Object.entries(values)
      .map(([k, v]) => `${k}=${String(v)}`)
      .join(';');
    return `[${code}:${inserted}]`;
  }
  return key;
};

const issueOf = (overrides: Partial<BackendValidationIssue>): BackendValidationIssue => ({
  code: 'invalid_type',
  path: ['destination'],
  ...overrides,
});

describe('mapZodIssueToI18nKey — 11 ZodIssueCode 별 1:1 라우팅', () => {
  it('invalid_type → errors.validation.invalid_type + expected param', () => {
    const result = mapZodIssueToI18nKey(
      issueOf({ code: 'invalid_type', params: { expected: 'string' } }),
      mockT
    );
    expect(result.key).toBe('errors.validation.invalid_type');
    expect(result.params.field).toBe('반출 장소');
    expect(result.params.expected).toBe('string');
  });

  it('too_small → minimum forwarded', () => {
    const result = mapZodIssueToI18nKey(
      issueOf({
        code: 'too_small',
        params: { origin: 'string', minimum: 5, inclusive: true },
      }),
      mockT
    );
    expect(result.key).toBe('errors.validation.too_small');
    expect(result.params.minimum).toBe(5);
    expect(result.params.origin).toBe('string');
  });

  it('too_big → maximum forwarded', () => {
    const result = mapZodIssueToI18nKey(
      issueOf({
        code: 'too_big',
        params: { origin: 'string', maximum: 100, inclusive: true },
      }),
      mockT
    );
    expect(result.key).toBe('errors.validation.too_big');
    expect(result.params.maximum).toBe(100);
  });

  it('invalid_format → format / pattern forwarded', () => {
    const result = mapZodIssueToI18nKey(
      issueOf({
        code: 'invalid_format',
        path: ['email'],
        params: { format: 'email', origin: 'string', pattern: '/^.+@.+$/' },
      }),
      mockT
    );
    expect(result.key).toBe('errors.validation.invalid_format');
    expect(result.params.field).toBe('이메일');
    expect(result.params.format).toBe('email');
    expect(result.params.pattern).toBe('/^.+@.+$/');
  });

  it('not_multiple_of → divisor forwarded', () => {
    const result = mapZodIssueToI18nKey(
      issueOf({ code: 'not_multiple_of', params: { origin: 'number', divisor: 3 } }),
      mockT
    );
    expect(result.key).toBe('errors.validation.not_multiple_of');
    expect(result.params.divisor).toBe(3);
  });

  it('unrecognized_keys → keys array → comma-joined string', () => {
    const result = mapZodIssueToI18nKey(
      issueOf({ code: 'unrecognized_keys', params: { keys: ['extraField', 'otherField'] } }),
      mockT
    );
    expect(result.key).toBe('errors.validation.unrecognized_keys');
    expect(result.params.keys).toBe('extraField, otherField');
  });

  it('invalid_union → params 미존재 통과', () => {
    const result = mapZodIssueToI18nKey(
      issueOf({ code: 'invalid_union', params: undefined }),
      mockT
    );
    expect(result.key).toBe('errors.validation.invalid_union');
    expect(result.params.field).toBe('반출 장소');
  });

  it('invalid_key → 라우팅', () => {
    const result = mapZodIssueToI18nKey(issueOf({ code: 'invalid_key' }), mockT);
    expect(result.key).toBe('errors.validation.invalid_key');
  });

  it('invalid_element → 라우팅', () => {
    const result = mapZodIssueToI18nKey(issueOf({ code: 'invalid_element' }), mockT);
    expect(result.key).toBe('errors.validation.invalid_element');
  });

  it('invalid_value → values array → comma-joined', () => {
    const result = mapZodIssueToI18nKey(
      issueOf({ code: 'invalid_value', params: { values: ['admin', 'user'] } }),
      mockT
    );
    expect(result.key).toBe('errors.validation.invalid_value');
    expect(result.params.values).toBe('admin, user');
  });

  it('custom → 라우팅', () => {
    const result = mapZodIssueToI18nKey(issueOf({ code: 'custom' }), mockT);
    expect(result.key).toBe('errors.validation.custom');
  });

  it('path[0] 미존재 시 errors.fields.unknown fallback', () => {
    const result = mapZodIssueToI18nKey(
      issueOf({ code: 'invalid_type', path: [], params: { expected: 'string' } }),
      mockT
    );
    expect(result.params.field).toBe('입력값');
  });

  it('path[0] 가 number 인 경우 (array index) 도 안전', () => {
    const result = mapZodIssueToI18nKey(
      issueOf({ code: 'too_small', path: [0, 'name'], params: { minimum: 1 } }),
      mockT
    );
    // path[0]=0 → errors.fields.0 → mock T 반환값 그대로 (= key) → fallback 'unknown' 트리거
    expect(typeof result.params.field).toBe('string');
  });
});

describe('extractValidationIssues — 다양한 error shape 호환', () => {
  it('plain object — error.issues 직접 추출', () => {
    const issues = extractValidationIssues({
      code: 'VALIDATION_ERROR',
      issues: [{ code: 'too_small', path: ['name'] }],
    });
    expect(issues).toHaveLength(1);
    expect(issues?.[0].code).toBe('too_small');
  });

  it('Axios error — error.response.data.issues 추출', () => {
    const issues = extractValidationIssues({
      response: { data: { issues: [{ code: 'invalid_type', path: ['email'] }] } },
    });
    expect(issues).toHaveLength(1);
    expect(issues?.[0].code).toBe('invalid_type');
  });

  it('null / undefined / 비-issue 응답 → null', () => {
    expect(extractValidationIssues(null)).toBeNull();
    expect(extractValidationIssues(undefined)).toBeNull();
    expect(extractValidationIssues({ code: 'OTHER_ERROR' })).toBeNull();
    expect(extractValidationIssues({ issues: [] })).toBeNull();
    expect(extractValidationIssues({ issues: 'not an array' })).toBeNull();
  });

  it('issues 배열에 invalid item 섞여있으면 valid item 만 추출', () => {
    const issues = extractValidationIssues({
      issues: [
        { code: 'too_small', path: ['name'] },
        { invalid: 'object' },
        { code: 'invalid_type', path: ['email'] },
      ],
    });
    expect(issues).toHaveLength(2);
  });
});

describe('extractErrorCodeOrIssues — hub wrapper', () => {
  it('code + issues 동시 추출', () => {
    const result = extractErrorCodeOrIssues({
      code: 'VALIDATION_ERROR',
      issues: [{ code: 'too_small', path: ['name'] }],
    });
    expect(result.code).toBe('VALIDATION_ERROR');
    expect(result.issues).toHaveLength(1);
  });

  it('code 만 존재 (non-validation 도메인 에러)', () => {
    const result = extractErrorCodeOrIssues({ code: 'EQUIPMENT_NOT_FOUND' });
    expect(result.code).toBe('EQUIPMENT_NOT_FOUND');
    expect(result.issues).toBeNull();
  });

  it('둘 다 미존재 — Error instance', () => {
    const result = extractErrorCodeOrIssues(new Error('network'));
    expect(result.code).toBeNull();
    expect(result.issues).toBeNull();
  });
});

describe('mapZodIssuesToToast — 통합', () => {
  it('단일 issue → description = mapped 메시지', () => {
    const error = {
      code: 'VALIDATION_ERROR',
      issues: [{ code: 'too_small', path: ['destination'], params: { minimum: 5 } }],
    };
    const toast = mapZodIssuesToToast(error, mockT);
    expect(toast).not.toBeNull();
    expect(toast?.title).toBe('입력 값 검증 오류');
    expect(toast?.description).toContain('too_small');
    expect(toast?.description).toContain('field=반출 장소');
    expect(toast?.description).toContain('minimum=5');
  });

  it('다중 issue → ", " 로 join', () => {
    const error = {
      issues: [
        { code: 'too_small', path: ['destination'], params: { minimum: 5 } },
        { code: 'invalid_type', path: ['email'], params: { expected: 'string' } },
      ],
    };
    const toast = mapZodIssuesToToast(error, mockT);
    expect(toast?.description).toContain(',');
    expect(toast?.description).toContain('too_small');
    expect(toast?.description).toContain('invalid_type');
  });

  it('issues 미존재 → null (호출자가 ErrorCode mapper fallback)', () => {
    const error = { code: 'EQUIPMENT_NOT_FOUND' };
    expect(mapZodIssuesToToast(error, mockT)).toBeNull();
  });

  it('Axios error 응답 shape 도 정상 라우팅', () => {
    const error = {
      response: {
        data: {
          code: 'VALIDATION_ERROR',
          issues: [{ code: 'invalid_format', path: ['email'], params: { format: 'email' } }],
        },
      },
    };
    const toast = mapZodIssuesToToast(error, mockT);
    expect(toast).not.toBeNull();
    expect(toast?.description).toContain('invalid_format');
  });
});
