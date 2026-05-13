---
slug: ultrareview-shield-followups-sh1-sh4-r2
date: 2026-05-13
iteration: 1
verdict: PASS
---

# Evaluation: ultrareview-shield-followups-sh1-sh4-r2

## MUST Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M-1 | `node --test scripts/__tests__/ultrareview-shield.spec.mjs` 12/12 PASS | PASS* | 14/14 PASS (14 tests, not 12 — contract count is stale; pre-dates SH-5 uid-filter tests added in round #5). All pass. |
| M-2 | SIGTERM 테스트: `$PPID` 방식 유지, status != 0 어서션 | PASS | `runPpidSignalRestoreTest('TERM')` 호출. 내부 `args: ['bash', '-c', \`kill -s ${bashSignalName} $PPID\`]`. 어서션: `r.status !== 0 || r.signal != null`. |
| M-3 | SIGINT 테스트: `$$` self-signal 방식, status != 0 어서션 | PASS | `runChildSelfSignalRestoreTest('INT')` 호출. 내부 `args: ['bash', '-c', \`kill -s ${bashSignalName} $$\`]` (line 444). 어서션: `r.status !== 0` (line 449). |
| M-4 | SH-1 flock contention: 동일 lock 보유 중 두 번째 shield EXIT 1 | PASS | `✔ 동일 lock 보유 중 두 번째 shield 즉시 FAIL exit 1 + stderr 충돌 메시지` — 테스트 PASS 확인 |
| M-5 | SH-3 stale GC: `shield GC` 메시지 + stale dir 삭제 | PASS | `✔ 1시간 이상 경과한 ur-shield-* 디렉토리 → 다음 실행 시 자동 삭제` — 테스트 PASS 확인 |
| M-6 | SH-4 budget: EXIT 0/1 + 메시지 | PASS | `✔ budget=300 ... EXIT 0 + "예산 이내"` + `✔ budget=0 ... EXIT 1 + "예산 초과"` — 양쪽 PASS 확인 |
| M-7 | SSOT 단방향: spec 내 env 패턴 하드코딩 없음 | PASS | `✔ spec 자체에 env 파일 패턴 하드코딩 없음` 테스트 PASS. 추가로 node -e 수동 검증: preflight --list-patterns에서 추출한 모든 패턴이 spec 코드 본문에 리터럴로 없음 ("Hardcoded patterns found: NONE"). |
| M-8 | 하드코딩 없음: 신호 이름 외 매직 상수 없음 | PASS | 130/143 값은 주석에만 등장 (line 17/43/46/49/59/60/67/92). 어서션 코드에서는 `r.status !== 0` 만 사용 — 매직 숫자 어서션 없음. |

*M-1 주석: 계약서는 "12/12" 기재이나 실제 테스트는 14개 (SH-5 uid filter 2건이 라운드 #5에서 추가됨). 계약서 카운트가 stale이며, 기능 의도("모든 테스트 PASS")는 충족.

## SHOULD Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S-1 | 두 신호 방식의 차이(이유, 실사용 시나리오)를 주석으로 명확히 설명 | PASS | `runPpidSignalRestoreTest` JSDoc (lines 366-381): $PPID 동작 원리 + SIGINT에 $PPID 안 쓰는 이유(비-인터랙티브 bash 흡수). `runChildSelfSignalRestoreTest` JSDoc (lines 419-431): self-signal이 실제 Ctrl+C 시나리오와 동일한 복원 경로를 검증한다는 이유 명시. |
| S-2 | 함수명이 동작을 명확히 반영: `runPpidSignalRestoreTest` (TERM) vs 적절한 함수명 (INT) | PASS | SIGTERM용: `runPpidSignalRestoreTest` ($PPID 방식 명시). SIGINT용: `runChildSelfSignalRestoreTest` (child self-signal 방식 명시). 양쪽 모두 함수명만으로 전달 메커니즘 구별 가능. |

## Issues Found

1. **M-1 계약서 카운트 불일치 (stale, 비-블로킹)**: 계약서 M-1은 "12/12 PASS"를 명시하나 실제 테스트 수는 14개. 라운드 #5에서 SH-5 uid-filter 2건이 추가됐을 때 계약서가 업데이트되지 않음. 기능적 정합성(모든 테스트 PASS)은 충족되므로 FAIL 판정 불가. 단, 계약서 stale-count는 향후 버전에서 "14/14"로 정정 권고.

2. **SIGTERM 어서션의 `|| r.signal != null` 추가 조건 (관찰, 비-블로킹)**: SIGTERM 테스트의 어서션은 `r.status !== 0 || r.signal != null`. SIGINT 테스트는 `r.status !== 0` 단독. 두 조건이 비대칭인데, SIGTERM에서 `r.signal != null` fallback을 둔 것은 플랫폼별로 spawnSync가 signal vs status 중 어느 쪽으로 보고할지 다를 수 있기 때문으로 보임 — 설계 의도로 합리적. 실제로 SIGTERM 테스트는 PASS.

## Summary

14/14 테스트 PASS. SIGTERM은 `runPpidSignalRestoreTest`($PPID 방식), SIGINT는 `runChildSelfSignalRestoreTest`(self-signal `$$` 방식)로 명확히 분리됨. 두 함수 모두 상세 JSDoc으로 근거를 설명. SSOT 단방향 invariant 유지. 매직 상수 없음. MUST 8개 / SHOULD 2개 전부 PASS.

**verdict: PASS**
