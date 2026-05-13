---
id: ultrareview-shield-followups-sh1-sh4
created: 2026-05-13
slug: ultrareview-shield-followups-sh1-sh4
mode: Mode 1
---

# Contract: ultrareview-shield-followups SH-1~SH-4

## Scope

| 파일 | 변경 유형 |
|------|----------|
| `scripts/__tests__/ultrareview-shield.spec.mjs` | 신규 describe 블록 4개 추가 (SH-1/SH-2/SH-3 spec/SH-4 spec) |
| `scripts/ultrareview-shield.sh` | stale_gc() 함수 추가 (SH-3 구현) |
| `scripts/check-preflight-perf-budget.mjs` | 신규 파일 — ur:preflight p95 budget 검증 (SH-4 구현) |
| `package.json` | `ur:preflight:perf-check` 스크립트 추가 (SH-4) |

## MUST Criteria

| ID | 기준 | 검증 명령 |
|----|------|----------|
| M-1 | `node --test scripts/__tests__/ultrareview-shield.spec.mjs` EXIT 0 — 기존 5개 + 신규 전부 PASS | `node --test scripts/__tests__/ultrareview-shield.spec.mjs` |
| M-2 | SH-1 lock-contention test 존재 — "다른 ultrareview-shield 인스턴스" stderr + exit 1 검증 | `grep -c '다른 ultrareview-shield 인스턴스' scripts/__tests__/ultrareview-shield.spec.mjs` |
| M-3 | SH-2 SIGTERM trap test 존재 — hash invariant + /tmp 잔존 0 검증 | `grep -c 'SIGTERM' scripts/__tests__/ultrareview-shield.spec.mjs` |
| M-4 | SH-3 stale_gc() 함수 ultrareview-shield.sh에 존재 — find -mmin +60 포함 | `grep -c 'stale_gc\|mmin +60' scripts/ultrareview-shield.sh` |
| M-5 | SH-3 stale GC spec 존재 — 1시간 이상 경과 dir 자동 삭제 검증 | `grep -c 'staletest\|stale_gc\|stale dir GC' scripts/__tests__/ultrareview-shield.spec.mjs` |
| M-6 | SH-4 scripts/check-preflight-perf-budget.mjs 존재 + PREFLIGHT_BUDGET_SECONDS + exit 1 예산 초과 로직 | `grep -c 'PREFLIGHT_BUDGET_SECONDS\|예산 초과' scripts/check-preflight-perf-budget.mjs` |
| M-7 | package.json `ur:preflight:perf-check` 스크립트 존재 | `grep -c 'ur:preflight:perf-check' package.json` |
| M-8 | SSOT 단방향 유지 — 기존 SSOT spec PASS (env 패턴 하드코딩 0) | M-1에 포함 |

## SHOULD Criteria

| ID | 기준 |
|----|------|
| S-1 | SH-2 SIGINT trap test 추가 (bash 비대화 환경 행동에 따라 flaky 가능 시 skip 허용) |
| S-2 | SH-4 budget=0 always-fail spec 존재 (PREFLIGHT_CMD_OVERRIDE mock 사용) |
| S-3 | stale_gc가 GC 실행 시 "[shield GC]" stderr 로그 출력 |

## Out of Scope

- 다른 도메인 파일 변경 금지 (checkouts, saved-views, frontend 등)
- hook-timing.spec.mjs / commitlint-config.spec.mjs 등 무관 spec 파일 수정 금지
