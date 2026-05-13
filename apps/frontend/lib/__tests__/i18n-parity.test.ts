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

/**
 * 객체에서 모든 leaf key path 를 dot-notation 으로 추출.
 *
 * R-3 정책: 배열은 leaf 로 처리 (키 자체만 포함, 내부 재귀 없음).
 * 배열 키 스냅샷은 별도 `KNOWN_ARRAY_KEYS` 테스트로 관리.
 * 새 배열 키 추가 시 해당 테스트가 실패하여 명시적 갱신 강제.
 */
function extractKeyPaths(input: unknown, prefix = ''): string[] {
  if (Array.isArray(input)) {
    // 배열은 leaf 로 취급 — 내부 인덱스 키는 검증 대상 아님.
    // 배열 키 집합 변경 탐지는 아래 KNOWN_ARRAY_KEYS 스냅샷 테스트가 담당.
    return prefix ? [prefix] : [];
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

/** 객체에서 배열 값을 가진 key path 를 dot-notation 으로 수집. */
function extractArrayPaths(input: unknown, prefix = ''): string[] {
  if (Array.isArray(input)) {
    return prefix ? [prefix] : [];
  }
  if (input === null || typeof input !== 'object') {
    return [];
  }
  const out: string[] = [];
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    out.push(...extractArrayPaths(value, nextPrefix));
  }
  return out;
}

/**
 * R-3: 배열 값을 가진 i18n 키 스냅샷.
 * 새 배열 키 추가 시 이 목록을 반드시 갱신하세요.
 * 삭제 시에도 동기화 필요.
 */
const KNOWN_ARRAY_KEYS: ReadonlyArray<string> = [
  'common.json:reports.contents.equipment_inventory',
  'common.json:reports.contents.calibration_status',
  'common.json:reports.contents.utilization_report',
  'common.json:reports.contents.team_equipment',
  'common.json:reports.contents.maintenance_report',
  'dashboard.json:calendar.dayLabels',
  'errors.json:CALIBRATION_SAVE_FAILED.solutions',
  'errors.json:DOCUMENT_NOT_FOUND.solutions',
  'errors.json:DUPLICATE_ERROR.solutions',
  'errors.json:DUPLICATE_MANAGEMENT_NUMBER.solutions',
  'errors.json:DUPLICATE_SERIAL_NUMBER.solutions',
  'errors.json:EQUIPMENT_ATTACHMENT_TYPE_REQUIRED.solutions',
  'errors.json:EQUIPMENT_FILE_REQUIRED.solutions',
  'errors.json:EQUIPMENT_MANAGEMENT_NUMBER_REQUIRED.solutions',
  'errors.json:EQUIPMENT_NOT_FOUND.solutions',
  'errors.json:EQUIPMENT_SHARED_CANNOT_DELETE.solutions',
  'errors.json:EQUIPMENT_SHARED_CANNOT_UPDATE.solutions',
  'errors.json:EQUIPMENT_SITE_SCOPE_ONLY.solutions',
  'errors.json:EQUIPMENT_TEAM_SCOPE_ONLY.solutions',
  'errors.json:FILE_CONTENT_MISMATCH.solutions',
  'errors.json:FILE_EMPTY.solutions',
  'errors.json:FILE_NOT_FOUND.solutions',
  'errors.json:FILE_TOO_LARGE.solutions',
  'errors.json:FILE_UPLOAD_FAILED.solutions',
  'errors.json:FORM_DATA_PARSE_FAILED.solutions',
  'errors.json:FORM_TEMPLATE_NOT_FOUND.solutions',
  'errors.json:HISTORY_SAVE_FAILED.solutions',
  'errors.json:INCIDENT_HISTORY_SAVE_FAILED.solutions',
  'errors.json:INVALID_DATE.solutions',
  'errors.json:INVALID_FILE_TYPE.solutions',
  'errors.json:INVALID_FORMAT.solutions',
  'errors.json:INVALID_MANAGEMENT_NUMBER.solutions',
  'errors.json:LOCATION_HISTORY_SAVE_FAILED.solutions',
  'errors.json:MAINTENANCE_HISTORY_SAVE_FAILED.solutions',
  'errors.json:NC_RECALIBRATION_REQUIRED.solutions',
  'errors.json:NC_REPAIR_RECORD_REQUIRED.solutions',
  'errors.json:NETWORK_ERROR.solutions',
  'errors.json:NOT_FOUND.solutions',
  'errors.json:PERMISSION_DENIED.solutions',
  'errors.json:REQUIRED_FIELD_MISSING.solutions',
  'errors.json:SCOPE_ACCESS_DENIED.solutions',
  'errors.json:SERVER_ERROR.solutions',
  'errors.json:SESSION_EXPIRED.solutions',
  'errors.json:TIMEOUT_ERROR.solutions',
  'errors.json:UNAUTHORIZED.solutions',
  'errors.json:UNKNOWN_ERROR.solutions',
  'errors.json:VALIDATION_ERROR.solutions',
  'errors.json:VERSION_CONFLICT.solutions',
  'help.json:sections.calibration.faqs',
  'help.json:sections.checkout.faqs',
  'help.json:sections.nonConformance.faqs',
  'help.json:sections.permissions.faqs',
] as const;

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

  it('R-3: 배열 키 스냅샷 — 변경 시 KNOWN_ARRAY_KEYS 동기화 필요', () => {
    const actual: string[] = [];
    for (const file of referenceFiles) {
      const messages = loadMessages(referenceLocale, file);
      for (const path of extractArrayPaths(messages)) {
        actual.push(`${file}:${path}`);
      }
    }
    expect(actual.sort()).toEqual([...KNOWN_ARRAY_KEYS].sort());
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
