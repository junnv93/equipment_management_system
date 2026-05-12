/**
 * @jest-environment node
 *
 * i18n key parity automation — G-17 closure
 *
 * 모든 도메인 messages/ko/*.json 파일과 messages/en/*.json 파일의 키 sorted deep-equal.
 * sprint 단위로 한쪽만 키 추가/오타가 발생하지 않도록 회귀 차단.
 *
 * 정책:
 * - locale 디렉토리 enumeration 자동 (하드코딩 도메인 리스트 없음)
 * - nested key 까지 recursive 검증 (e.g. errors.validation.required)
 * - 키 sorted equality 만 검증, 값(번역 텍스트) 동일성은 검증 안 함 (값은 다른 게 정상)
 * - locale 양쪽에 모두 존재해야 하는 도메인 파일 자동 검증
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const MESSAGES_ROOT = join(__dirname, '..', '..', 'messages');

type Locale = 'ko' | 'en';

/** 객체에서 모든 leaf key path 를 dot-notation 으로 추출. */
function extractKeyPaths(input: unknown, prefix = ''): string[] {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    // leaf — prefix 자체가 key path
    return prefix ? [prefix] : [];
  }
  const out: string[] = [];
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    out.push(...extractKeyPaths(value, nextPrefix));
  }
  return out;
}

function loadMessages(locale: Locale, file: string): unknown {
  const filePath = join(MESSAGES_ROOT, locale, file);
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

function listMessageFiles(locale: Locale): string[] {
  return readdirSync(join(MESSAGES_ROOT, locale))
    .filter((f) => f.endsWith('.json'))
    .sort();
}

describe('i18n parity — ko ↔ en (G-17)', () => {
  const koFiles = listMessageFiles('ko');
  const enFiles = listMessageFiles('en');

  it('locale 디렉토리에 동일한 파일 집합', () => {
    expect(koFiles).toEqual(enFiles);
  });

  // 도메인별 individual case — 어떤 도메인이 깨졌는지 명확
  // ko/en 둘 중 하나라도 존재하면 case 등록
  const allFiles = Array.from(new Set([...koFiles, ...enFiles])).sort();

  describe.each(allFiles)('domain: %s', (file) => {
    it('파일이 양쪽 locale 에 존재', () => {
      expect(koFiles).toContain(file);
      expect(enFiles).toContain(file);
    });

    it('키 집합이 sorted deep-equal', () => {
      if (!koFiles.includes(file) || !enFiles.includes(file)) {
        // 위 case 에서 이미 FAIL — skip
        return;
      }
      const koKeys = extractKeyPaths(loadMessages('ko', file)).sort();
      const enKeys = extractKeyPaths(loadMessages('en', file)).sort();

      // jest 의 toEqual 은 diff 출력 — 어느 키가 누락됐는지 즉시 보임
      expect(koKeys).toEqual(enKeys);
    });
  });
});
