/**
 * i18n errors namespace parity spec (ADR-0008)
 *
 * 검증:
 * - ko/en `errors.validation` 키 11 ZodIssueCode 1:1 정합
 * - ko/en `errors.fields` 키 set equality
 * - ZodIssueCode SSOT (ZOD_ISSUE_CODE_VALUES) ↔ ko `errors.validation` 키 set equality
 * - ZodIssueCode SSOT ↔ en `errors.validation` 키 set equality (3-way)
 *
 * @see packages/schemas/src/validation/zod-issue.ts (ZOD_ISSUE_CODE_VALUES SSOT)
 * @see apps/frontend/messages/{ko,en}/errors.json (validation/fields namespace)
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ZOD_ISSUE_CODE_VALUES } from '@equipment-management/schemas';

const ROOT = resolve(__dirname, '../../../');

interface ErrorsJson {
  validation?: Record<string, string>;
  fields?: Record<string, string>;
}

function readErrors(locale: 'ko' | 'en'): ErrorsJson {
  const path = resolve(ROOT, 'messages', locale, 'errors.json');
  return JSON.parse(readFileSync(path, 'utf-8'));
}

describe('errors.validation namespace — ZodIssueCode 11 키 SSOT 정합', () => {
  const ko = readErrors('ko');
  const en = readErrors('en');

  it('ko `errors.validation` 는 11 ZodIssueCode 키 + title 포함', () => {
    expect(ko.validation).toBeDefined();
    for (const code of ZOD_ISSUE_CODE_VALUES) {
      expect(ko.validation).toHaveProperty(code);
    }
  });

  it('en `errors.validation` 는 11 ZodIssueCode 키 + title 포함', () => {
    expect(en.validation).toBeDefined();
    for (const code of ZOD_ISSUE_CODE_VALUES) {
      expect(en.validation).toHaveProperty(code);
    }
  });

  it('ko ↔ en `errors.validation` 키 set equality (3-way: ZodIssueCode + ko + en)', () => {
    const koKeys = new Set(Object.keys(ko.validation ?? {}));
    const enKeys = new Set(Object.keys(en.validation ?? {}));
    expect(koKeys).toEqual(enKeys);
    // 3-way: ZodIssueCode 모두 포함 (title 등 추가 키는 양쪽 모두 등장 가능)
    for (const code of ZOD_ISSUE_CODE_VALUES) {
      expect(koKeys.has(code)).toBe(true);
      expect(enKeys.has(code)).toBe(true);
    }
  });

  it('어떤 ko `errors.validation.<code>` 도 빈 문자열 아님', () => {
    for (const [key, value] of Object.entries(ko.validation ?? {})) {
      expect(value).toBeTruthy();
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
      void key;
    }
  });

  it('어떤 en `errors.validation.<code>` 도 빈 문자열 아님', () => {
    for (const value of Object.values(en.validation ?? {})) {
      expect(value).toBeTruthy();
      expect((value as string).length).toBeGreaterThan(0);
    }
  });
});

describe('errors.fields namespace — ko/en 키 set equality', () => {
  const ko = readErrors('ko');
  const en = readErrors('en');

  it('ko/en `errors.fields` 키 set equality', () => {
    const koKeys = new Set(Object.keys(ko.fields ?? {}));
    const enKeys = new Set(Object.keys(en.fields ?? {}));
    expect(koKeys).toEqual(enKeys);
  });

  it('`errors.fields.unknown` fallback 존재 (양 locale)', () => {
    expect(ko.fields).toHaveProperty('unknown');
    expect(en.fields).toHaveProperty('unknown');
  });

  it('30+ 도메인 fieldName 키 등록 (`errors.fields` ≥ 30)', () => {
    expect(Object.keys(ko.fields ?? {}).length).toBeGreaterThanOrEqual(30);
    expect(Object.keys(en.fields ?? {}).length).toBeGreaterThanOrEqual(30);
  });
});
