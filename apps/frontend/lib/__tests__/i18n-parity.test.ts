/**
 * @jest-environment node
 *
 * i18n key parity automation — G-17 closure (라운드 #4: locale SSOT 경유)
 *
 * 모든 도메인 `messages/<locale>/*.json` 파일의 키 sorted deep-equal.
 * sprint 단위로 한쪽만 키 추가/오타가 발생하지 않도록 회귀 차단.
 *
 * 정책:
 * - locale 목록은 `@equipment-management/schemas` SSOT (`SUPPORTED_LOCALES`) 경유
 *   — 인라인 'ko'/'en' 금지. 향후 locale 추가 시 spec 자동 확장.
 * - reference locale = `SUPPORTED_LOCALES[0]` (현재 'ko'). 모든 locale 이 reference 와 동일한
 *   파일/키 집합을 가져야 함.
 * - 도메인 enumeration 자동 (하드코딩 도메인 리스트 없음).
 * - nested key 까지 recursive 검증 (e.g. errors.validation.required).
 * - 키 sorted equality 만 검증, 값(번역 텍스트) 동일성은 검증 안 함 (값은 다른 게 정상).
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SUPPORTED_LOCALES } from '@equipment-management/schemas';
import type { SupportedLocale } from '@equipment-management/schemas';

const MESSAGES_ROOT = join(__dirname, '..', '..', 'messages');

/** 객체에서 모든 leaf key path 를 dot-notation 으로 추출. */
function extractKeyPaths(input: unknown, prefix = ''): string[] {
  if (Array.isArray(input)) {
    // i18n 구조에 배열 도입 시 이 spec이 명시적으로 실패해야 함 (R-3 정책).
    // 배열 값은 locale 간 키 parity 검증 대상이 아니므로 silent-pass 금지.
    throw new Error(
      `i18n 구조에 배열 값이 감지됨 (key: "${prefix}"). ` +
        '배열을 i18n 메시지로 사용하려면 이 spec 을 명시적으로 갱신하세요.'
    );
  }
  if (input === null || typeof input !== 'object') {
    return prefix ? [prefix] : [];
  }
  const out: string[] = [];
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    out.push(...extractKeyPaths(value, nextPrefix));
  }
  return out;
}

function loadMessages(locale: SupportedLocale, file: string): unknown {
  const filePath = join(MESSAGES_ROOT, locale, file);
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

function listMessageFiles(locale: SupportedLocale): string[] {
  return readdirSync(join(MESSAGES_ROOT, locale))
    .filter((f) => f.endsWith('.json'))
    .sort();
}

const referenceLocale: SupportedLocale = SUPPORTED_LOCALES[0];
const otherLocales: ReadonlyArray<SupportedLocale> = SUPPORTED_LOCALES.filter(
  (l) => l !== referenceLocale
);

describe(`i18n parity — SUPPORTED_LOCALES SSOT (G-17, reference: ${referenceLocale})`, () => {
  const referenceFiles = listMessageFiles(referenceLocale);

  it('SUPPORTED_LOCALES SSOT 가 최소 2개 locale 정의', () => {
    expect(SUPPORTED_LOCALES.length).toBeGreaterThanOrEqual(2);
  });

  describe.each(otherLocales)('locale: %s vs reference', (locale) => {
    const localeFiles = listMessageFiles(locale);

    it('도메인 파일 집합이 reference 와 동일', () => {
      expect(localeFiles).toEqual(referenceFiles);
    });

    // 도메인별 individual case — 어떤 도메인이 깨졌는지 명확
    const allFiles = Array.from(new Set([...referenceFiles, ...localeFiles])).sort();

    describe.each(allFiles)('domain: %s', (file) => {
      it(`파일이 ${locale} locale 에 존재`, () => {
        expect(localeFiles).toContain(file);
      });

      it(`키 집합이 ${referenceLocale} 와 sorted deep-equal`, () => {
        if (!referenceFiles.includes(file) || !localeFiles.includes(file)) {
          // 위 case 에서 이미 FAIL — skip
          return;
        }
        const refKeys = extractKeyPaths(loadMessages(referenceLocale, file)).sort();
        const localeKeys = extractKeyPaths(loadMessages(locale, file)).sort();

        // jest 의 toEqual 은 diff 출력 — 어느 키가 누락됐는지 즉시 보임
        expect(localeKeys).toEqual(refKeys);
      });
    });
  });
});
