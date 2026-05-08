import { z } from 'zod';
import {
  BackendValidationIssueSchema,
  ZOD_ISSUE_CODE_VALUES,
  redactIssueReceived,
  serializeZodIssue,
  type BackendValidationIssue,
} from '../validation/zod-issue';

function captureIssues(fn: () => unknown): z.core.$ZodIssue[] {
  try {
    fn();
  } catch (err) {
    if (err instanceof z.ZodError) {
      return err.issues as z.core.$ZodIssue[];
    }
  }
  throw new Error('expected ZodError but none was thrown');
}

describe('serializeZodIssue (zod v4 11 issue codes)', () => {
  it('invalid_type — captures expected', () => {
    const [issue] = captureIssues(() => z.string().parse(123));
    const out = serializeZodIssue(issue);
    expect(out.code).toBe('invalid_type');
    expect(out.params).toEqual({ expected: 'string' });
  });

  it('too_small — captures origin / minimum / inclusive', () => {
    const [issue] = captureIssues(() => z.string().min(5).parse('a'));
    const out = serializeZodIssue(issue);
    expect(out.code).toBe('too_small');
    expect(out.params).toEqual({ origin: 'string', minimum: 5, inclusive: true });
  });

  it('too_big — captures origin / maximum / inclusive', () => {
    const [issue] = captureIssues(() => z.string().max(3).parse('hello'));
    const out = serializeZodIssue(issue);
    expect(out.code).toBe('too_big');
    expect(out.params).toEqual({ origin: 'string', maximum: 3, inclusive: true });
  });

  it('invalid_format — captures origin / format / pattern (regex string)', () => {
    const [issue] = captureIssues(() => z.email().parse('notanemail'));
    const out = serializeZodIssue(issue);
    expect(out.code).toBe('invalid_format');
    expect(out.params?.format).toBe('email');
    expect(out.params?.origin).toBe('string');
    expect(typeof out.params?.pattern).toBe('string');
  });

  it('not_multiple_of — captures origin / divisor', () => {
    const [issue] = captureIssues(() => z.number().multipleOf(3).parse(5));
    const out = serializeZodIssue(issue);
    expect(out.code).toBe('not_multiple_of');
    expect(out.params).toEqual({ origin: 'number', divisor: 3 });
  });

  it('unrecognized_keys — captures keys array', () => {
    const issues = captureIssues(() =>
      z.strictObject({ a: z.string() }).parse({ a: 'x', b: 'y' } as Record<string, unknown>)
    );
    const out = serializeZodIssue(issues[0]);
    expect(out.code).toBe('unrecognized_keys');
    expect(out.params?.keys).toEqual(['b']);
  });

  it('invalid_union — params 비어있음 (subtree 구조는 path 로 충분)', () => {
    const [issue] = captureIssues(() => z.union([z.string(), z.number()]).parse(true));
    const out = serializeZodIssue(issue);
    expect(out.code).toBe('invalid_union');
    expect(out.params).toBeUndefined();
  });

  it('invalid_value — captures values (allowed enum literals)', () => {
    const [issue] = captureIssues(() => z.enum(['a', 'b']).parse('c' as unknown as 'a'));
    const out = serializeZodIssue(issue);
    expect(out.code).toBe('invalid_value');
    expect(out.params?.values).toEqual(['a', 'b']);
  });

  it('custom — params 통과', () => {
    const schema = z.string().refine(() => false, { error: 'always fail', params: { id: 'x' } });
    const [issue] = captureIssues(() => schema.parse('hello'));
    const out = serializeZodIssue(issue);
    expect(out.code).toBe('custom');
  });

  it('알 수 없는 code 는 custom 으로 normalize', () => {
    const fakeIssue = { code: 'totally_new_zod_v6_code', path: ['x'] } as unknown as Parameters<
      typeof serializeZodIssue
    >[0];
    const out = serializeZodIssue(fakeIssue);
    expect(out.code).toBe('custom');
  });

  it('path 는 그대로 복사', () => {
    const [issue] = captureIssues(() =>
      z.object({ user: z.object({ age: z.number() }) }).parse({ user: { age: 'oops' } })
    );
    const out = serializeZodIssue(issue);
    expect(out.path).toEqual(['user', 'age']);
  });
});

describe('redactIssueReceived', () => {
  const issueWithPattern: BackendValidationIssue = {
    code: 'invalid_format',
    path: ['email'],
    params: { format: 'email', origin: 'string', pattern: '/^[a-z]+$/' },
  };

  it('production: pattern → [REDACTED]', () => {
    const out = redactIssueReceived(issueWithPattern, true);
    expect(out.params?.pattern).toBe('[REDACTED]');
    expect(out.params?.format).toBe('email');
    expect(out.params?.origin).toBe('string');
  });

  it('development: pattern 그대로', () => {
    const out = redactIssueReceived(issueWithPattern, false);
    expect(out.params?.pattern).toBe('/^[a-z]+$/');
  });

  it('params 미존재 issue 는 식별 변환 없이 통과', () => {
    const issue: BackendValidationIssue = {
      code: 'invalid_union',
      path: ['x'],
    };
    expect(redactIssueReceived(issue, true)).toBe(issue);
  });

  it('redact 대상 필드 미포함 시 새 객체 만들지 않음', () => {
    const issue: BackendValidationIssue = {
      code: 'invalid_value',
      path: ['role'],
      params: { values: ['admin', 'user'] },
    };
    expect(redactIssueReceived(issue, true)).toBe(issue);
  });
});

describe('SSOT invariants', () => {
  it('ZOD_ISSUE_CODE_VALUES 는 11개 zod v4 issue codes', () => {
    expect(ZOD_ISSUE_CODE_VALUES).toHaveLength(11);
    expect(new Set(ZOD_ISSUE_CODE_VALUES)).toEqual(
      new Set([
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
      ])
    );
  });

  it('BackendValidationIssueSchema 는 모든 11개 code 를 enum 으로 허용', () => {
    for (const code of ZOD_ISSUE_CODE_VALUES) {
      const result = BackendValidationIssueSchema.safeParse({ path: [], code });
      expect(result.success).toBe(true);
    }
  });

  it('BackendValidationIssueSchema 는 알 수 없는 code 거부', () => {
    const result = BackendValidationIssueSchema.safeParse({ path: [], code: 'unknown_code' });
    expect(result.success).toBe(false);
  });
});
