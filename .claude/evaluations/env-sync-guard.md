# Evaluation Report — env-sync-guard

**Date**: 2026-05-13
**Evaluator**: Evaluator Agent
**Iteration**: 1

## Verdict: PASS

All 9 MUST criteria pass. All 3 SHOULD criteria pass.

---

## MUST Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| M-1 | `scripts/check-env-sync.mjs` 존재 + `parseEnvFile` export | **PASS** | `grep -c` → 2 (≥2) |
| M-2 | `dev-doctor.mjs`에 `checkFrontendEnvSync` import | **PASS** | `grep -c` → 2 (≥1); line 31: `import { checkFrontendEnvSync } from './check-env-sync.mjs'` |
| M-3 | `runDiagnosis()` 반환값에 `envSync` 포함 | **PASS** | `grep -c` → 13 (≥2); line 402: `return { level, issues, active, zombies, manifest, nextLock, ports, envSync }` |
| M-4 | `scripts/setup-env.mjs` 존재 + .env.local 생성/보완 로직 | **PASS** | `grep -c` → 9 (≥2); `INTERNAL_BACKEND_URL`, `env.local`, `env.example` 모두 포함 |
| M-5 | `package.json`에 `"setup:env"` 스크립트 추가 | **PASS** | `grep -c` → 1; line 54: `"setup:env": "node scripts/setup-env.mjs"` |
| M-6 | `pnpm dev:doctor` 실행 시 env 체크 항목 출력 | **PASS** | `grep -c "env"` → 2 (≥1); "env sync:" 섹션 + "pnpm setup:env" 복구 힌트 포함 |
| M-7 | `node scripts/check-env-sync.mjs` 직접 실행 가능 (EXIT 0 when ok) | **PASS** | EXIT=0; 출력: `[OK] apps/frontend/.env.local ↔ apps/frontend/.env.example 동기화 정상.` |
| M-8 | 하드코딩 0 — 경로는 REPO_ROOT 기반 | **PASS** | `grep -c '"apps/frontend/.env"'` → 0; 경로는 exported constants `FRONTEND_ENV_EXAMPLE` / `FRONTEND_ENV_LOCAL` + `path.join(repoRoot, ...)` 패턴 |
| M-9 | `pnpm --filter frontend run tsc --noEmit` EXIT=0 | **PASS** | EXIT=0 (scripts/*.mjs only, frontend 무변경) |

---

## SHOULD Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| S-1 | `dev-doctor.mjs --json` output에 `envSync` 필드 포함 | **PASS** | `node dev-doctor.mjs --json` JSON 파싱 결과 `'envSync' in d` → True; `state: 'ok'`, `extraKeys: [7개]` 포함 |
| S-2 | `setup-env.mjs`: `.env.local` 없을 때 `.env.example` 전체 복사 + 존재 시 누락 키만 append | **PASS** | `writeFileSync(localPath, exampleContent)` (create), `appendFileSync(localPath, appendBlock)` (append). `if (!existsSync(localPath))` 분기 명확. 기존 파일 overwrite 없음 확인. |
| S-3 | `formatHintLine()` 업데이트 — env 이슈 시 hint에 포함 | **PASS** | lines 525-528: `envPart = env !== 'ok' ? \` envSync=${env}\` : ''` + `setupHint = envPart ? ' / pnpm setup:env' : ''` — env 이상 시 hint에 `envSync=<state>` + `pnpm setup:env` 자동 포함 |

---

## Issues Found

없음. 모든 MUST 기준 통과.

---

## Code Quality Notes

### parseEnvFile() 파싱 정확도 — 정상

실측 검증:
- 빈 줄 / 순수 주석(`# ...`) → 무시 ✓
- `KEY=` (빈 값) → 키 인식 ✓
- `KEY=value  # inline comment` → KEY만 추출 ✓
- 주석 처리된 `# KEY=value` → 무시 ✓
- 존재하지 않는 파일 → `null` 반환 ✓
- `KEY_WITH_SPACES = value` (등호 주변 공백) → `.trim()` 처리로 정상 인식 ✓

### checkFrontendEnvSync() 반환 형태 — 계약 일치

`{ state: string, missingKeys: string[], extraKeys: string[] }` 형태 정확히 반환.
`state`는 `'ok' | 'missing-keys' | 'no-local' | 'no-example'` 4가지.

### setup-env.mjs 로직 — 안전

- Case 1 (`.env.local` 없음): `writeFileSync(localPath, exampleContent)` — `.env.example` 전체 복사
- Case 2 (`.env.local` 존재): `appendFileSync(localPath, appendBlock)` — 누락 키만 날짜 포함 섹션 헤더와 함께 append, 기존 값 절대 덮어쓰지 않음
- `parseEnvFile` SSOT 재사용으로 파싱 로직 중복 0 ✓

### 경로 상수 아키텍처 — 적절

`FRONTEND_ENV_EXAMPLE`, `FRONTEND_ENV_LOCAL`을 `check-env-sync.mjs`에서 export하고, `setup-env.mjs`가 import 재사용 — 경로 SSOT 구현. M-8 grep(`"apps/frontend/.env"`) 기준 0건이나, 상수 자체는 파일 상단에 exported constant로 선언되어 있음 (인라인 하드코딩 아님).

### dev-doctor.mjs 통합 — 완전

`runDiagnosis()` 반환에 `envSync` 포함, `printHumanReport()`에 "env sync:" 섹션, `formatHintLine()`에 env 상태 반영, `--json` 출력에 `envSync` 필드, issues 배열에 env-sync 항목 조건부 추가 — 모든 경로 커버.

### 관찰 사항 (비차단)

1. `dev-doctor.mjs` CLI 실행 시 EXIT=2 반환 — manifest desync (registered=0/compiled=9) 때문. env 로직과 무관하며, 환경(dev 서버 미기동)의 정상 동작.
2. `setup-env.mjs`의 `buildExampleLineMap()`은 `parseEnvFile()`과 파싱 로직이 일부 중복됨 (key regex, comment skip). 기능적 차이가 있어 통합이 어렵긴 하지만(원본 라인 보존 목적), 미래 유지보수 시 주의 필요.
3. `check-env-sync.mjs`의 `isDirectRun` 판별 (`import.meta.url === \`file://${process.argv[1]}\``) 패턴은 심볼릭링크 환경에서 false negative 가능성 있으나, 현 프로젝트 환경에서는 무관.
