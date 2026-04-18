---
slug: report-query-perf
iteration: 1
verdict: PASS
date: 2026-04-18
---

## Must Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| M1 | tsc --noEmit PASS | PASS | 오류 없음 |
| M2 | build PASS | PASS | nest build 성공 |
| M3 | test PASS | PASS | 807/807, 61 suites |
| M4 | resolveUser 제거 → inArray 배치 | PASS | grep 0건, line 638~655 확인 |
| M5 | exportSoftwareRegistry teamId ForbiddenException 가드 | PASS | SCOPE_RESOURCE_MISMATCH 정확히 2건 |
| M6 | SELECT * → 명시적 컬럼 | PASS | .select() 0건, 16컬럼 객체 형태 |
| M7 | EquipmentRegistryRow Pick<> 타입 | PASS | line 14~32 확인 |
| M8 | inArray 기존 import 활용 | PASS | line 26 기존 존재 |

## Should Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | EquipmentRegistryRow 주석 | PASS | 렌더러/COLUMNS 1:1 대응 명시 |
| S2 | inArray Set dedup | PASS | new Set + null 타입 가드 |
