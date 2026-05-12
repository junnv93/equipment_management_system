/**
 * scan-exclusion-paths-sync spec — SSOT ↔ .gitleaks.toml 동기 invariant.
 *
 * 본 spec 은 `scripts/lib/scan-exclusion-paths.mjs` 의 `GITLEAKS_EXCLUDED_DIRS` 가
 * `.gitleaks.toml` `[allowlist].paths` 에 모두 미러됐는지 검증한다.
 *
 * 회귀 시나리오 (둘 중 한 곳만 추가/제거하면 FAIL):
 *   - SSOT 에 `playwright-report` 추가 → .gitleaks.toml 미러 누락 → spec FAIL
 *   - .gitleaks.toml 에서 `coverage` 라인 제거 → SSOT 와 drift → spec FAIL
 *
 * 실행: `node --test scripts/__tests__/scan-exclusion-paths-sync.spec.mjs`
 * pre-push gate: `.husky/pre-push` root-spec batch 에 포함.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GITLEAKS_EXCLUDED_DIRS } from '../lib/scan-exclusion-paths.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const GITLEAKS_TOML = resolve(REPO_ROOT, '.gitleaks.toml');

describe('scan-exclusion-paths — SSOT ↔ .gitleaks.toml 동기 invariant', () => {
  test('GITLEAKS_EXCLUDED_DIRS 모든 항목이 .gitleaks.toml [allowlist].paths 에 미러됨', () => {
    const tomlContent = readFileSync(GITLEAKS_TOML, 'utf8');

    // gitleaks toml regex 형식 — (^|/)<dir>/  (dot 은 \\. 로 escape)
    for (const dir of GITLEAKS_EXCLUDED_DIRS) {
      const escapedDir = dir.replace(/\./g, '\\.');
      // path 안의 escape 가 추가 backslash 필요 — `'''(^|/)\.next/'''`
      const literalPattern = `(^|/)${escapedDir}/`;
      assert.ok(
        tomlContent.includes(literalPattern),
        `SSOT 우회 — .gitleaks.toml [allowlist].paths 에 누락된 SCAN_EXCLUDED_DIRS 항목: '${dir}'.\n` +
        `추가 필요: '''${literalPattern}'''\n` +
        `위치: scripts/lib/scan-exclusion-paths.mjs (단방향 SSOT)`
      );
    }
  });

  test('SCAN_EXCLUDED_DIRS 최소 정합 — 핵심 빌드 산출물 누락 회귀 차단', () => {
    // 신규 항목 추가는 자유롭지만, 아래 핵심 셋은 절대 제거 금지 (회귀 차단 baseline)
    const baseline = ['node_modules', '.git', 'dist', '.next'];
    for (const dir of baseline) {
      assert.ok(
        GITLEAKS_EXCLUDED_DIRS.includes(dir) || dir === '.git', // .git 은 GITLEAKS_EXCLUDED_DIRS 에서 의도적 제외
        `SCAN_EXCLUDED_DIRS baseline 누락 회귀: '${dir}'`
      );
    }
  });
});
