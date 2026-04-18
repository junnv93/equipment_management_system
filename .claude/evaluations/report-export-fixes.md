---
slug: report-export-fixes
iteration: 1
verdict: PASS
date: 2026-04-19
---

## Must Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| M1 | tsc --noEmit PASS (backend) | PASS | 오류 0건 |
| M2 | backend build PASS | PASS | nest build 성공 (data-migration.service.ts 오류는 scope 외 pre-existing) |
| M3 | backend test PASS | PASS | 807/807, 61 suites |
| M4 | safeIlike 적용 | PASS | line 493-498 — or(safeIlike×3) 패턴 |
| M5 | qualityApproverId userIdSet 추가 | PASS | line 652 — userIdSet 배열에 포함 |
| M6 | T8 quality approver 서명 렌더링 | PASS | line 757-765 — insertDocxSignature(doc,8,2,0,...) |
| M7 | Promise.all (exportRentalImportAsCheckoutForm) | PASS | line ~1098 — [[requester],[approver]] = await Promise.all([...]) |
| M8 | Promise.all (exportEquipmentImport) | PASS | line ~1303 — 동일 패턴 |
| M9 | CableStatusValues.ACTIVE | PASS | grep 0건, line ~813 확인 |
| M10 | EquipmentStatusValues.DISPOSED | PASS | grep 0건, equipment-registry-data.service.ts:96 확인 |
| M11 | QUERY_CONFIG.EQUIPMENT_LIST spread | PASS | EquipmentListContent.tsx:230 — ...QUERY_CONFIG.EQUIPMENT_LIST, CACHE_TIMES.SHORT 직접 재정의 제거 |
| M12 | tsc --noEmit PASS (frontend) | PASS | 오류 0건 |

## Should Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | safeIlike OR 조합 or() 분리 | PASS | or(safeIlike(col1), safeIlike(col2), safeIlike(col3)) 패턴 |
