---
slug: report-export-fixes
date: 2026-04-18
mode: 1
---

# Contract: report-export-fixes

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | tsc --noEmit PASS (backend) | `pnpm --filter backend run tsc --noEmit` 오류 0건 |
| M2 | backend build PASS | `pnpm --filter backend run build` 성공 |
| M3 | backend test PASS | `pnpm --filter backend run test` 오류 0건 |
| M4 | safeIlike 적용 | `grep -n "likeContains\|safeIlike" form-template-export.service.ts` — 검색 필터에 적용됨 |
| M5 | qualityApproverId userIdSet 추가 | grep으로 userIdSet에 `record.qualityApproverId` 포함 확인 |
| M6 | T8 quality approver 서명 렌더링 | `doc.setCellValue(8, 2, 0` 또는 `insertDocxSignature(doc, 8, 2, 0` 존재 |
| M7 | Promise.all 적용 (exportRentalImportAsCheckoutForm) | 순차 쿼리 → Promise.all 패턴 |
| M8 | Promise.all 적용 (exportEquipmentImport) | 순차 쿼리 → Promise.all 패턴 |
| M9 | CableStatusValues.ACTIVE 사용 | `grep "cables.status, 'active'"` 0건 |
| M10 | EquipmentStatusValues.DISPOSED 사용 | `grep "equipment.status, 'disposed'"` 0건 |
| M11 | QUERY_CONFIG.EQUIPMENT_LIST spread | `...QUERY_CONFIG.EQUIPMENT_LIST` 사용 + `staleTime: CACHE_TIMES.SHORT` 직접 재정의 제거 |
| M12 | tsc --noEmit PASS (frontend) | `pnpm --filter frontend run tsc --noEmit` 오류 0건 |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | `safeIlike` OR 조합이 `or()` + 개별 컬럼으로 분리 (인라인 sql OR 대신) |
