---
slug: time-complexity-review
iteration: 1
verdict: FAIL
created: 2026-04-13
---

# Evaluation Report: Time Complexity Review (Iteration 1)

## Contract Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| M1 | 주요 백엔드 서비스 파일 분석됨 (최소 10개 모듈) | FAIL | 백엔드 8개 파일(6개 고유 모듈) — 10개 미충족. checkouts, calibration, approvals 등 미분석 |
| M2 | 발견된 각 이슈에 파일경로:라인번호 포함 | PASS | 모든 이슈에 파일명:라인 명시. 전체 경로 미기재는 SHOULD 수준 |
| M3 | N+1 쿼리 이슈에 구체적인 루프 패턴 설명 | PASS | C1~C3, H3 모두 for...await 루프 패턴 + 코드 스니펫 포함 |
| M4 | 각 이슈에 현재/개선 후 Big-O 명시 | PASS | 전 이슈 Big-O 명시됨 |
| M5 | Critical/High 이슈에 수정 방향 포함 | PASS | C1~C3, H1~H3 수정 방향 포함 |
| M6 | 프론트엔드 분석 포함됨 | PASS | EquipmentFilters.tsx, TeamListContent.tsx 분석됨 |

## Issue Accuracy

| Issue | Status | Notes |
|-------|--------|-------|
| C1 | CONFIRMED | 183-214 라인 루프 내 개별 INSERT 확인 |
| C2 | CONFIRMED | 431-466 라인 이중 루프 내 개별 INSERT 확인 |
| C3 | CONFIRMED | 511-648 라인 교정/수리/사고 이력 chunk 루프 내 개별 INSERT 확인 |
| H1 | CONFIRMED | audit.service.ts 361-365 limit 없음 확인 |
| H2 | CONFIRMED | equipment-attachment.service.ts 120-133 limit 없음 확인 |
| H3 | CONFIRMED | equipment.service.ts 1183-1186 invalidateCache 직렬 루프 확인 |
| M1 | CONFIRMED | calibration-plans.service.ts 166-177 JS 인메모리 필터 확인 |
| M2 | PARTIALLY_CORRECT | 라인 869 근방 확인. 실제 쿼리 시작은 850 |
| M3 | PARTIALLY_CORRECT | .find() 함수 7개 (보고서는 5개로 기재) |
| L1 | CONFIRMED | TeamListContent.tsx 108-112 이중 순회 확인 |
| L2 | CONFIRMED | TeamListContent.tsx 307-311 SitePanel 동일 패턴 확인 |

## Overall Verdict: FAIL

### MUST failures:
- **M1**: 백엔드 서비스 8개(6 모듈) 분석 — "최소 10개 모듈" 미충족
  - 미분석 고부하 모듈: checkouts, calibration, calibration-factors, approvals

### SHOULD findings:
- 파일경로를 전체 상대경로로 기재 필요 (apps/backend/src/modules/...)
- M3 이슈의 .find() 함수 개수 수정 필요 (5개 → 7개)

### Repair instructions:
1. checkouts.service.ts, calibration.service.ts, calibration-factors.service.ts, approvals.service.ts 추가 분석
2. 총 10개 이상 백엔드 서비스 파일 커버리지 확보
3. 이슈 M3 find() 개수 7개로 수정

---

# Evaluation Report: Iteration 2

## Contract Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| M1 | 주요 백엔드 서비스 파일 분석됨 (최소 10개 모듈) | PASS | 14개 파일, 11개 고유 모듈 (checkouts, calibration, calibration-factors, approvals 추가) |
| M2 | 발견된 각 이슈에 파일경로:라인번호 포함 | PASS | apps/backend/src/modules/... 전체 경로로 통일됨 |
| M3 | N+1 쿼리 이슈에 구체적인 루프 패턴 설명 포함 | PASS | C1~C3, H3 for...await 루프 + 코드 스니펫 포함 |
| M4 | 각 이슈에 현재/개선 후 Big-O 명시 | PASS | 신규 H4, M4 포함 전 이슈 Big-O 명시 |
| M5 | Critical/High 이슈에 수정 방향 포함 | PASS | H4 포함 C1~C3, H1~H4 모두 수정 방향 포함 |
| M6 | 프론트엔드 분석 포함됨 | PASS | EquipmentFilters.tsx, TeamListContent.tsx 분석됨 |

## New Issue Accuracy (Iteration 2 추가분)

| Issue | Status | Notes |
|-------|--------|-------|
| H4 (calibration-factors.service.ts:352) | CONFIRMED | limit 없는 전체 보정계수 조회 확인 |
| M4 (calibration.service.ts:1603-1622) | CONFIRMED | 3중 .filter() 라인 1607/1612/1617 확인 |

## Change from Iteration 1
- **M1: FAIL → PASS** — 11개 고유 모듈(14개 파일)로 기준 충족

## Overall Verdict: PASS

모든 MUST 기준 충족. MUST failure 없음.
