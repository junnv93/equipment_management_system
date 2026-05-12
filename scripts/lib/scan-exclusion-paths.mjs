/**
 * scripts/lib/scan-exclusion-paths.mjs
 *
 * SSOT — secret scan / 디렉토리 traversal 시 제외할 빌드 산출물 + 의존성 디렉토리 목록.
 *
 * 추가 규칙:
 *   - regenerate-able artifacts only (사용자 코드 절대 추가 금지)
 *   - 빈도 정합: dependencies (node_modules / .pnpm-store) + build outputs (dist / build / .next / .turbo /
 *     coverage / .nyc_output / playwright-report / test-results) + VCS metadata (.git)
 *
 * Consumer (단방향 import / sync invariant):
 *   1. scripts/ultrareview-preflight.mjs — findGlobFiles 디렉토리 traversal skip (성능 + glob false-match 회피)
 *   2. .gitleaks.toml [allowlist].paths — gitleaks --no-git 의 path-regex 제외
 *      → 자동 import 불가 (toml static config) → manual mirror + 회귀 차단 spec
 *      ↳ scripts/__tests__/scan-exclusion-paths-sync.spec.mjs 가 동기 invariant 강제
 *
 * 신규 디렉토리 추가 절차:
 *   1. 본 파일 SCAN_EXCLUDED_DIRS 배열에 추가
 *   2. .gitleaks.toml [allowlist].paths 에 `'''(^|/)<dir>/'''` 미러 (.git 제외 — gitleaks 가 자체 skip)
 *   3. pre-push 시 sync spec 이 자동 검증 (둘 중 한 곳만 추가하면 FAIL)
 *
 * 시맨틱 차이:
 *   - SCAN_EXCLUDED_DIRS: basename match (preflight findGlobFiles 의 `entry === '<name>'`)
 *   - .gitleaks.toml regex: path-anywhere match (`(^|/)<dir>/`)
 *   둘은 의미가 다르지만 같은 "regenerate-able artifacts" 의도를 공유 — SSOT 통합 정당.
 */

/**
 * 디렉토리 basename 목록 (preflight findGlobFiles 의 skip set).
 * `.git` 포함 — preflight 가 `.git/` 내부 enumerate 하면 안 됨.
 */
export const SCAN_EXCLUDED_DIRS = Object.freeze([
  'node_modules',
  '.pnpm-store',
  '.git',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage',
  '.nyc_output',
  'playwright-report',
  'test-results',
]);

/**
 * gitleaks `--no-git` allowlist 용 subset.
 * `.git/` 은 gitleaks `--no-git` 모드가 자체 처리 → 명시 제외 불필요 (mirror minimal).
 */
export const GITLEAKS_EXCLUDED_DIRS = Object.freeze(
  SCAN_EXCLUDED_DIRS.filter((d) => d !== '.git')
);
