---
contract: ultrareview-shield-followups-sh1-sh4
evaluated: 2026-05-13
iteration: 1
---

# Evaluation Report: ultrareview-shield-followups SH-1~SH-4

## MUST Criteria

| ID | 기준 요약 | 결과 | 근거 |
|----|----------|------|------|
| M-1 | `node --test scripts/__tests__/ultrareview-shield.spec.mjs` EXIT 0 — 기존 5개 + 신규 전부 PASS | PASS | 12 tests, 0 fail, EXIT 0. 기존 5개 + SH-1(1) + SH-2(2) + SH-3(1) + SH-4(2) = 12 전부 PASS |
| M-2 | SH-1 lock-contention test 존재 — "다른 ultrareview-shield 인스턴스" stderr + exit 1 검증 | PASS | grep 결과: 1 (line 349 `assert.match(r.stderr, /다른 ultrareview-shield 인스턴스/)`) |
| M-3 | SH-2 SIGTERM trap test 존재 — hash invariant + /tmp 잔존 0 검증 | PASS | grep 결과: 5 (test 함수 정의 + SIGTERM 명시 test case + SIGINT test 포함). SIGTERM test가 hash invariant + /tmp 잔존 0 동시 검증 확인 |
| M-4 | SH-3 stale_gc() 함수 ultrareview-shield.sh에 존재 — find -mmin +60 포함 | PASS | grep 결과: 3 (`stale_gc` 함수 정의 + `mmin +60` 포함 + `stale_gc` 호출) |
| M-5 | SH-3 stale GC spec 존재 — 1시간 이상 경과 dir 자동 삭제 검증 | PASS | grep 결과: 3 (`ur-shield-staletest-` 변수명 + `stale dir GC 삭제 확인` 메시지 + `existsSync(staleDir)` 부정 assert) |
| M-6 | SH-4 scripts/check-preflight-perf-budget.mjs 존재 + PREFLIGHT_BUDGET_SECONDS + exit 1 예산 초과 로직 | PASS | grep 결과: 5 (`PREFLIGHT_BUDGET_SECONDS` 3회 + `예산 초과` 2회). `process.exit(1)` 분기 확인 |
| M-7 | package.json `ur:preflight:perf-check` 스크립트 존재 | PASS | grep 결과: 1 (`"ur:preflight:perf-check": "node scripts/check-preflight-perf-budget.mjs"`) |
| M-8 | SSOT 단방향 유지 — 기존 SSOT spec PASS (env 패턴 하드코딩 0) | PASS | M-1 실행 결과에서 "SSOT 단방향 단언" describe 블록 PASS 확인 |

## SHOULD Criteria

| ID | 기준 요약 | 결과 | 근거 |
|----|----------|------|------|
| S-1 | SH-2 SIGINT trap test 추가 (flaky 가능 시 skip 허용) | PASS | grep 결과: 4 (`SIGINT` 4회). `test('SIGINT: self-signal kill -s INT $$...')` 테스트가 존재하고 M-1에서 PASS |
| S-2 | SH-4 budget=0 always-fail spec 존재 (PREFLIGHT_CMD_OVERRIDE mock 사용) | PASS | grep 결과: 4 (`budget=0` 2회 + `PREFLIGHT_BUDGET_SECONDS: '0'` 포함). `/bin/true` mock + `PREFLIGHT_BUDGET_SECONDS=0` 조합으로 항상 실패 유도 확인. M-1에서 PASS |
| S-3 | stale_gc가 GC 실행 시 "[shield GC]" stderr 로그 출력 | PASS | grep 결과: 1 (`printf '⚠  [shield GC] SIGKILL 잔존물 (1h+ 경과) → 삭제: %s\n' "$d" >&2`). SH-3 spec에서 `assert.match(r.stderr, /shield GC/)` 로 검증 |

## Out-of-Scope 침범 검사

| 검사 항목 | 결과 | 근거 |
|----------|------|------|
| SH-1~SH-4 구현 커밋(cb426431)의 apps/packages 변경 | 없음 | `git show cb426431 --name-only` 결과: `.claude/contracts/`, `scripts/` 디렉토리만 변경. apps/packages 0건 |

**주의**: `git diff HEAD~5..HEAD -- apps/ packages/` 는 SH-1~4 이전 다른 스프린트(checkouts SH-6, cache-wholesale-migration 등)의 변경을 포함하므로 48줄 출력. 이는 해당 스프린트별 정당한 변경이며 SH-1~4 scope와 무관함.

## 최종 판정

**PASS**

### 발견된 이슈

없음

### 수정 지시

해당 없음 (PASS)
