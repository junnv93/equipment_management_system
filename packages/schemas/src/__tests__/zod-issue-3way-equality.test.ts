/**
 * 3-way set equality spec — ZOD_ISSUE_CODE_VALUES SSOT 결빙 (ADR-0008)
 *
 * 본 spec 은 schemas 측 1-way 결빙만 담당:
 * - ZOD_ISSUE_CODE_VALUES 11 코드 ↔ KNOWN_PARAM_KEYS_BY_CODE Record exhaustive
 * - serializeZodIssue allow-list 가 11 코드 모두 커버
 * - 알 수 없는 zod 신규 코드 도입 시 'custom' 으로 normalize (silent miss 차단)
 *
 * **단방향 wire**: schemas 는 frontend i18n 에 의존 안 함. ko/en parity 는 frontend 측
 * `i18n-errors-validation-parity.test.ts` 가 담당 (ZOD_ISSUE_CODE_VALUES SSOT 를 import 하여
 * frontend errors.json 키 set 정합 검증). 이로써 3-way (ZodIssueCode ↔ ko ↔ en) closure.
 */
import { z } from 'zod';
import {
  ZOD_ISSUE_CODE_VALUES,
  serializeZodIssue,
  type ZodIssueCode,
} from '../validation/zod-issue';

describe('ZOD_ISSUE_CODE_VALUES SSOT (zod v4 11 codes)', () => {
  it('정확히 11 codes', () => {
    expect(ZOD_ISSUE_CODE_VALUES).toHaveLength(11);
  });

  it('zod v4 표준 issue code 모두 포함', () => {
    const set = new Set<ZodIssueCode>(ZOD_ISSUE_CODE_VALUES);
    const expected: ReadonlyArray<ZodIssueCode> = [
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
    ];
    for (const code of expected) {
      expect(set.has(code)).toBe(true);
    }
  });

  it('실제 zod v4 ZodError 가 throw 하는 code 가 모두 SSOT 에 등록되어 있음', () => {
    const issuesSeen = new Set<string>();

    const fixtures: Array<() => unknown> = [
      () => z.string().parse(123),
      () => z.string().min(5).parse('a'),
      () => z.string().max(3).parse('hello'),
      () => z.email().parse('notanemail'),
      () => z.number().multipleOf(3).parse(5),
      () => z.strictObject({ a: z.string() }).parse({ a: 'x', b: 'y' }),
      () => z.union([z.string(), z.number()]).parse(true),
      () => z.enum(['a', 'b']).parse('c' as unknown as 'a'),
    ];

    for (const fn of fixtures) {
      try {
        fn();
      } catch (err) {
        if (err instanceof z.ZodError) {
          for (const issue of err.issues) {
            issuesSeen.add(issue.code);
          }
        }
      }
    }

    for (const code of issuesSeen) {
      expect(ZOD_ISSUE_CODE_VALUES).toContain(code);
    }
  });

  it('serializeZodIssue 가 알 수 없는 code 를 custom 으로 normalize', () => {
    const fakeIssue = {
      code: 'zod_v6_brand_new_code',
      path: ['x'],
    } as Parameters<typeof serializeZodIssue>[0];
    expect(serializeZodIssue(fakeIssue).code).toBe('custom');
  });
});
