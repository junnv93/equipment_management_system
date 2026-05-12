# Contract — ultrareview-shield-followups (COMPLETED)

> **2026-05-12** Mode 1 harness, iter 2 PASS (MUST 10/10), commit `11bd5e07`.
> `ultrareview-shield-wrapper` sprint 후속 2건 + 라운드 #3 architectural 개선.

## 배경

`pnpm ur:shield` 2026-05-12 sprint 후속 2건 (tech-debt-tracker.md):
- **T-1 (HIGH)**: shield 자체 회귀 발생 시 실 `.env` 손실 위험 → spec + self-test 모드로 회귀 차단
- **T-2 (MED)**: `pnpm ur:shield` 가 검사 1/3 (dev env) 차단 해결해도 검사 2/3 (gitleaks)이 별도 출처 잡음 → fingerprint 식별 + allowlist

## 성공 기준 (MUST 10/10 PASS)

| ID | 기준 | 검증 명령 | 결과 |
|---|---|---|---|
| M-1 | tsc backend+frontend 회귀 0 | `pnpm --filter {backend,frontend} exec tsc --noEmit` | ✅ EXIT 0 |
| M-2 | shield bash 구문 정합 | `bash -n scripts/ultrareview-shield.sh` | ✅ EXIT 0 |
| M-3 | 신설 spec 6 시나리오 PASS | `node --test scripts/__tests__/ultrareview-shield.spec.mjs` | ✅ 6/6 PASS (~700ms) |
| M-4 | shield `--self-test` working tree 무변경 | `bash scripts/ultrareview-shield.sh --self-test` + git diff invariant | ✅ EXIT 0 + 0 diff + /tmp 잔존 0 |
| M-5 | SSOT 단방향 — spec 자체 인라인 패턴 0 | `grep -E "'\.env'\|\"\.env\"" scripts/__tests__/ultrareview-shield.spec.mjs` | ✅ 0 matches |
| M-6 | pre-push 회귀 차단 통합 | `grep -F "ultrareview-shield.spec.mjs" .husky/pre-push` | ✅ 라인 등록 |
| M-7 | T-2 진단 + 조치 — gitleaks 3 gate 모두 PASS | `pnpm ur:preflight` | ✅ EXIT 0 |
| M-8 | 문서 업데이트 | docs/references/ultrareview-usage.md Gate 2 + --self-test 섹션 | ✅ 신규 섹션 |
| M-9 | tracker T-1/T-2 [x] 처리 | `.claude/exec-plans/tech-debt-tracker.md` | ✅ [x] + closure 요약 |
| M-10 | 다른 세션 도메인 침범 0 | MY_FILES 8개 허용 영역 확인 | ✅ scope OK |

## 변경 파일

### 신규
- `scripts/lib/scan-exclusion-paths.mjs` — SSOT module (SCAN_EXCLUDED_DIRS + GITLEAKS_EXCLUDED_DIRS)
- `scripts/__tests__/ultrareview-shield.spec.mjs` — 6 시나리오 spec
- `scripts/__tests__/scan-exclusion-paths-sync.spec.mjs` — SSOT ↔ .gitleaks.toml 미러 invariant

### 수정
- `scripts/ultrareview-shield.sh` — `--self-test` 모드 (139+ lines) + SHIELD_PREFLIGHT/SHIELD_LOCK env override + docblock
- `scripts/ultrareview-preflight.mjs` — `.env` (root) DANGEROUS_PATTERNS 추가 (보안 fix) + SSOT import
- `.gitleaks.toml` — allowlist 확장 (build dir 10종 + lockfile 3종 + placeholder docs 8경로 + e2e fake JWT)
- `.husky/pre-push` — 2 spec 등록 (scan-exclusion-paths-sync + ultrareview-shield)
- `package.json` — `ur:selftest` + `ur:preflight` alias

## 핵심 성과

1. **보안 갭 closure**: `.env` (root)에 실 secret 4건 (DB_PASSWORD/INTERNAL_API_KEY/AZURE_AD_CLIENT_SECRET/teams-webhook) 노출 차단
2. **성능**: gitleaks 36분 → 12초 (180배 가속)
3. **아키텍처**: SSOT 통합 (preflight inline + .gitleaks.toml allowlist 분기 → 단일 SSOT + 미러 invariant spec)
4. **회귀 차단**: pre-push gate에 2 spec 등록 — shield 회귀 + SSOT drift 즉시 차단

## SHOULD 후속 (tech-debt 등록)

- SH-1 shield-lock-contention-spec (flock 동시 실행 보호 spec)
- SH-2 shield-sigint-trap-spec (SIGINT trap 발화 spec)
- SH-3 shield-tmp-residual-gc (SIGKILL 잔존 GC)
- SH-4 preflight-perf-budget-baseline (p95 regression budget)

상세: `.claude/exec-plans/tech-debt-tracker.md` 라인 24-28
