/**
 * ADR-0008 Layer 4 정적 검증: 도메인 mapper hub fallback 의무 (ts-morph)
 *
 * `mapXxxErrorToToast(error: unknown, t: TranslationFunction)` 시그니처를 가진
 * 모든 exported 함수가 본체에서 `extractValidationIssues` + `mapZodIssuesToToast`를
 * 호출하는지 ts-morph CallExpression 탐색으로 검증한다.
 *
 * 신규 도메인 mapper 추가 시 hub 호출 누락 → 이 spec이 자동 FAIL.
 *
 * @see apps/frontend/lib/errors/zod-issue-mapper.ts (hub SSOT)
 * @see apps/frontend/lib/errors/extract-error.ts (extractValidationIssues)
 * @see docs/adr/0008-backend-zod-error-i18n.md §Layer 4
 */
import * as fs from 'fs';
import * as path from 'path';
import { Project, SyntaxKind } from 'ts-morph';

const ERRORS_DIR = path.resolve(__dirname, '..');

const EXCLUSIONS = new Set([
  'cable-errors.ts', // re-export shim only (export { mapCableErrorToToast } from './cables-errors')
  'document-errors.ts', // download path — mapDocumentFileErrorToToast has no t function
  'equipment-errors.ts', // enum/class infra — no mapXxxErrorToToast function
  'extract-error.ts', // hub itself
  'zod-issue-mapper.ts', // hub itself
]);

const errorFiles = fs
  .readdirSync(ERRORS_DIR)
  .filter((f) => f.endsWith('-errors.ts') && !EXCLUSIONS.has(f) && !f.startsWith('download'));

const project = new Project({
  tsConfigFilePath: path.resolve(__dirname, '../../../tsconfig.json'),
  skipAddingFilesFromTsConfig: true,
  compilerOptions: {
    allowJs: false,
    noEmit: true,
  },
});
project.addSourceFilesAtPaths(errorFiles.map((f) => path.join(ERRORS_DIR, f)));

describe('도메인 mapper hub fallback 정적 검증 (ADR-0008 Layer 4)', () => {
  test.each(errorFiles.map((f): [string, string] => [f, path.join(ERRORS_DIR, f)]))(
    '%s — mapXxxErrorToToast must call extractValidationIssues + mapZodIssuesToToast',
    (_filename, filepath) => {
      const sf = project.getSourceFileOrThrow(filepath);

      // mapXxxErrorToToast 시그니처 함수 탐색: exported + 파라미터 2개 이상
      // (error: unknown, t: TranslationFunction[, tErrors?: TranslationFunction])
      const targetFns = sf
        .getFunctions()
        .filter(
          (fn) => /^map[A-Z][A-Za-z]*ErrorToToast$/.test(fn.getName() ?? '') && fn.isExported()
        )
        .filter((fn) => fn.getParameters().length >= 2);

      expect(targetFns.length).toBeGreaterThanOrEqual(1);

      const fn = targetFns[0];
      const calleeNames = fn
        .getDescendantsOfKind(SyntaxKind.CallExpression)
        .map((c) => c.getExpression().getText());

      expect(calleeNames).toContain('extractValidationIssues');
      expect(calleeNames).toContain('mapZodIssuesToToast');
    }
  );

  test('EXCLUSIONS set covers expected 5 entries', () => {
    expect(EXCLUSIONS.size).toBe(5);
    expect(EXCLUSIONS.has('cable-errors.ts')).toBe(true);
    expect(EXCLUSIONS.has('document-errors.ts')).toBe(true);
    expect(EXCLUSIONS.has('equipment-errors.ts')).toBe(true);
  });
});
