---
slug: qr-appurl-ssot-debt
date: 2026-04-19
iteration: 1
verdict: PASS
---

# Evaluation: qr-appurl-ssot-debt

## MUST Criteria

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M1 | `getAppUrl()` export | PASS | `apps/frontend/lib/qr/app-url.ts` L7 |
| M2 | 3개 컴포넌트 `getAppUrl` import | PASS | EquipmentQRCode L12, HandoverQRDisplay L17, BulkLabelPrintButton L21 |
| M3 | `issueAndRender`에 `!appUrl` guard | PASS | HandoverQRDisplay — `if (!appUrl) { setPhase('error'); return; }` |
| M4 | EquipmentQRCode·HandoverQRDisplay에 `NEXT_PUBLIC_APP_URL` 실행코드 미존재 | PASS | 실행 코드 0건 (EquipmentQRCode 히트는 JSDoc 주석 텍스트) |
| M5 | BulkLabelPrintButton에 `NEXT_PUBLIC_APP_URL` 미존재 | PASS | 0건 |
| M6 | `sql\`` 템플릿 미존재 | PASS | 0건, `sql` import 자체 제거 |
| M7 | `eq(equipment.status` 사용 | PASS | L71 확인 |
| M8 | `QUERY_CONFIG.EQUIPMENT_LIST_FRESH` 존재 | PASS | query-config.ts L142-153 |
| M9 | spread override 없이 단일 참조 | PASS | `...QUERY_CONFIG.EQUIPMENT_LIST_FRESH`, 인라인 `refetchOnMount: 'always'` 0건 |
| M10 | Frontend tsc PASS | PASS | `useMemo(getAppUrl, [])` 타입 호환 |
| M11 | Backend tsc PASS | PASS | `EquipmentStatus` cast, 미사용 import 0건 |

## SHOULD Criteria

| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| S1 | SSOT 우회 없음 | PASS | 3곳 모두 `@/lib/qr/app-url` 경유 |
| S2 | 하드코딩 0건 | PASS | 컴포넌트 실행 코드 내 직접 참조 0건 |
| S3 | JSDoc 주석 존재 | PASS | query-config.ts EQUIPMENT_LIST_FRESH에 용도·기반·사용처 기재 |

## Regressions

없음. `EquipmentQRCode` `enabled` guard, `HandoverQRDisplay` `useCallback` deps, worker 미수정 모두 확인.

## Summary

11/11 MUST + 3/3 SHOULD 통과. 회귀 없음. 구현이 계약서 명세를 정확히 충족한다.
