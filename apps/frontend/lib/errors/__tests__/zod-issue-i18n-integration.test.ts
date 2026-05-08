/**
 * Backend mock issues → mapZodIssuesToToast → 실제 ko/en errors.json 통합 (ADR-0008)
 *
 * Round 2: 11 ZodIssueCode 별 mock issue → mapped 메시지가 한국어/영어 텍스트
 * Round 2: ko / en locale 양쪽 모두 사람 가독 (한·영 mix 0건)
 * Round 2: missing field path → `errors.fields.unknown` fallback 텍스트
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ZOD_ISSUE_CODE_VALUES, type BackendValidationIssue } from '@equipment-management/schemas';
import { mapZodIssuesToToast, type TranslationFunction } from '../zod-issue-mapper';

const ROOT = resolve(__dirname, '../../../');

interface MessageNode {
  [key: string]: string | MessageNode;
}

function loadMessages(locale: 'ko' | 'en'): MessageNode {
  const path = resolve(ROOT, 'messages', locale, 'errors.json');
  return JSON.parse(readFileSync(path, 'utf-8'));
}

/**
 * `errors.X.Y.Z` 형식 next-intl key를 ko/en JSON 에서 lookup + ICU substitute.
 *
 * (next-intl 의 message format 은 ICU 이지만 여기서는 단순 `{var}` 치환만 시뮬레이션 — 본 spec 의
 * 의도는 "실제 message 가 dictionary 에 존재하는가" + "params 가 흘러들어가는가" 검증.)
 */
function makeT(messages: MessageNode): TranslationFunction {
  return (key, values) => {
    const segments = key.replace(/^errors\./, '').split('.');
    let node: MessageNode | string = messages;
    for (const segment of segments) {
      if (typeof node === 'string') return key;
      const next: string | MessageNode | undefined = node[segment];
      if (next === undefined) return key;
      node = next;
    }
    if (typeof node !== 'string') return key;
    if (!values) return node;
    return node.replace(/\{(\w+)\}/g, (_match, varName: string) => {
      const v = values[varName];
      return v === undefined ? `{${varName}}` : String(v);
    });
  };
}

const issueOf = (overrides: Partial<BackendValidationIssue>): BackendValidationIssue => ({
  code: 'invalid_type',
  path: ['name'],
  ...overrides,
});

describe('zod-issue → ko/en errors.json 통합 (Round 2)', () => {
  const koMessages = loadMessages('ko');
  const enMessages = loadMessages('en');
  const koT = makeT(koMessages);
  const enT = makeT(enMessages);

  it.each(ZOD_ISSUE_CODE_VALUES)('ko: code "%s" → 한국어 메시지 반환 (key 미반환)', (code) => {
    const issue = issueOf({ code, path: ['name'] });
    const toast = mapZodIssuesToToast({ issues: [issue] }, koT);
    expect(toast).not.toBeNull();
    expect(toast?.description).not.toBe(`errors.validation.${code}`);
    expect(toast?.description.length).toBeGreaterThan(0);
  });

  it.each(ZOD_ISSUE_CODE_VALUES)('en: code "%s" → 영어 메시지 반환 (key 미반환)', (code) => {
    const issue = issueOf({ code, path: ['name'] });
    const toast = mapZodIssuesToToast({ issues: [issue] }, enT);
    expect(toast).not.toBeNull();
    expect(toast?.description).not.toBe(`errors.validation.${code}`);
    expect(toast?.description.length).toBeGreaterThan(0);
  });

  it('too_small + minimum + 한국어: "{field}이(가) 너무 작습니다 (최소 5)"', () => {
    const issue = issueOf({
      code: 'too_small',
      path: ['destination'],
      params: { origin: 'string', minimum: 5, inclusive: true },
    });
    const toast = mapZodIssuesToToast({ issues: [issue] }, koT);
    expect(toast?.description).toContain('반출 장소');
    expect(toast?.description).toContain('5');
    expect(toast?.description).toContain('너무 작습니다');
  });

  it('too_small + minimum + 영어: "Destination is too small (minimum 5)"', () => {
    const issue = issueOf({
      code: 'too_small',
      path: ['destination'],
      params: { origin: 'string', minimum: 5, inclusive: true },
    });
    const toast = mapZodIssuesToToast({ issues: [issue] }, enT);
    expect(toast?.description).toContain('Destination');
    expect(toast?.description).toContain('5');
    expect(toast?.description).toContain('too small');
  });

  it('missing field path → errors.fields.unknown ko fallback', () => {
    const issue = issueOf({ code: 'invalid_type', path: [], params: { expected: 'string' } });
    const toast = mapZodIssuesToToast({ issues: [issue] }, koT);
    expect(toast?.description).toContain('입력값');
  });

  it('missing field path → errors.fields.unknown en fallback', () => {
    const issue = issueOf({ code: 'invalid_type', path: [], params: { expected: 'string' } });
    const toast = mapZodIssuesToToast({ issues: [issue] }, enT);
    expect(toast?.description).toContain('Input');
  });

  it('한·영 mix 검증 — 한국어 toast 에 영어 plaintext 0', () => {
    const issue = issueOf({
      code: 'too_small',
      path: ['name'],
      params: { origin: 'string', minimum: 3 },
    });
    const toast = mapZodIssuesToToast({ issues: [issue] }, koT);
    expect(toast?.description).toMatch(/[가-힣]/);
    // 'minimum'/'maximum'/'too small'/'too big' 영어 키워드 직접 노출 없음
    expect(toast?.description).not.toMatch(/too small/i);
    expect(toast?.description).not.toMatch(/minimum/i);
  });

  it('영어 toast 에 한국어 plaintext 0', () => {
    const issue = issueOf({
      code: 'too_small',
      path: ['name'],
      params: { origin: 'string', minimum: 3 },
    });
    const toast = mapZodIssuesToToast({ issues: [issue] }, enT);
    expect(toast?.description).not.toMatch(/[가-힣]/);
  });
});
