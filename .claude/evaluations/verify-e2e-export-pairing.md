---
slug: verify-e2e-export-pairing
date: 2026-04-09
iteration: 2
verdict: PASS
---

# Evaluation: verify-e2e Step 5b — Form-level Cross-spec Pairing

## MUST Criteria

| ID | Criterion | Result | Evidence |
|----|-----------|--------|----------|
| M1 | 룰 SSOT 단일 위치 | PASS | `cross-spec pairing` grep → `.claude/skills/verify-e2e/SKILL.md` 단일 hit |
| M2 | No hardcoding | PASS (fix-loop after iter1) | Iter1: 양식 번호 for-loop 하드코딩 발견 → 동적 `grep -hoE 'UL-QP-18-[0-9]{2}'` 로 교체. 재실행 결과 동일 WARN 출력 |
| M3 | Cross-spec pairing 구현 | PASS | 판정 테이블(API×UI matrix) + 동적 discovery + SSOT helper(expectFileDownload) 탐지 명시 |
| M4 | No regression (스킬 외 파일 미변경) | PASS | 이 세션 커밋 scope: `.claude/skills/verify-e2e/SKILL.md`, `.claude/exec-plans/tech-debt-tracker.md`, `.claude/contracts/…`, `.claude/evaluations/…`. 기타 dirty files (logging.interceptor.ts 등)는 이 task 시작 이전 상태 |
| M5 | 실측 일치 | PASS | 스크립트 실행 → WARN=UL-QP-18-03/05/06/10, PASS=01/07/08/09 (tracker 잔여 목록과 1:1 일치) |
| M6 | tech-debt-tracker 동기화 | PASS | 엔트리에 "자동 감지: Step 5b (38차 승격)" 문구 + 1:1 동기화 불변식 추가 |

## SHOULD Criteria

| ID | Criterion | Result |
|----|-----------|--------|
| S1 | Multi-line 스크립트 블록 | PASS |
| S2 | False WARN 제거 근거 명시 | PASS — "승격 배경" 섹션에 35차 per-file 한계 설명 |
| S3 | `UL-QP-18-[0-9]{2}` regex 사용 | PASS — iter2 fix-loop 결과로 도입 |

## Iteration History

- **Iter 1** — 스크립트가 `for form in 01 02 ...` 하드코딩 → M2 FAIL
- **Iter 2** — 동적 discovery 로 교체 → M2 PASS, 출력 동일

## Post-merge Actions

- `@api-only` 마커 deprecated 명시 (기존 사용 파일 0건, 정리 불필요)
- 신규 양식 추가 시 Step 5b 가 자동 편입 → tracker 수동 업데이트 불필요
- QP-18-03/05/06/10 은 UI 진입점 설계 결정 필요 (out of scope)

## Verdict

**PASS** — All MUST criteria 통과. Step 5b 룰이 spec 파일 배치와 무관하게 양식별 실제 coverage를 측정하며, false WARN 없이 tracker와 정합.
