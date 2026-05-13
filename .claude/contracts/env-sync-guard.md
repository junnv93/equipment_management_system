# Contract — env-sync-guard

**Date**: 2026-05-13
**Mode**: Mode 1
**Slug**: `env-sync-guard`
**Scope**: `.env.local` ↔ `.env.example` 자동 정합 검증 시스템

---

## Context

- `.env.local`은 gitignore'd — PC 교체/신규 개발자 온보딩 시 재누락 가능
- `pnpm dev:doctor`에 env 동기화 체크 통합 → 평소 진단에서 자동 감지
- `pnpm setup:env` — `.env.example` 기반으로 `.env.local` 자동 생성/보완

---

## MUST Criteria

| # | 기준 | 검증 명령 |
|---|------|-----------|
| M-1 | `scripts/check-env-sync.mjs` 존재 + `parseEnvFile` export | `grep -c "export function parseEnvFile\|export function checkFrontendEnvSync" scripts/check-env-sync.mjs` ≥2 |
| M-2 | `dev-doctor.mjs`에 `checkFrontendEnvSync` import | `grep -c "checkFrontendEnvSync" scripts/dev-doctor.mjs` ≥1 |
| M-3 | `runDiagnosis()` 반환값에 `envSync` 포함 | `grep -c "envSync" scripts/dev-doctor.mjs` ≥2 |
| M-4 | `scripts/setup-env.mjs` 존재 + .env.local 생성/보완 로직 | `grep -c "INTERNAL_BACKEND_URL\|env.local\|env.example" scripts/setup-env.mjs` ≥2 |
| M-5 | `package.json`에 `"setup:env"` 스크립트 추가 | `grep -c '"setup:env"' package.json` ≥1 |
| M-6 | `pnpm dev:doctor` 실행 시 env 체크 항목 출력 | `node scripts/dev-doctor.mjs 2>&1 \| grep -c "env"` ≥1 |
| M-7 | `node scripts/check-env-sync.mjs` 직접 실행 가능 (EXIT 0 when ok) | `node scripts/check-env-sync.mjs` EXIT=0 |
| M-8 | 하드코딩 0 — 경로는 REPO_ROOT 기반 | `grep -c '"apps/frontend/.env"' scripts/check-env-sync.mjs` (경로 상수로만 사용) |
| M-9 | `pnpm --filter frontend run tsc --noEmit` EXIT=0 (no frontend changes) | (tsc unaffected — scripts/*.mjs only) |

## SHOULD Criteria

| # | 기준 |
|---|------|
| S-1 | `dev-doctor.mjs --json` output에 `envSync` 필드 포함 |
| S-2 | `setup-env.mjs`: `.env.local` 없을 때 `.env.example` 전체 복사 + 존재 시 누락 키만 append |
| S-3 | `formatHintLine()` 업데이트 — env 이슈 시 hint에 포함 |

---

## Changed Files

- `scripts/check-env-sync.mjs` (new)
- `scripts/setup-env.mjs` (new)
- `scripts/dev-doctor.mjs` (integration)
- `package.json` (setup:env script)
