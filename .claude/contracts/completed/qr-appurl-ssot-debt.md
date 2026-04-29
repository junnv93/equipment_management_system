---
slug: qr-appurl-ssot-debt
date: 2026-04-19
mode: Mode 1 (Lightweight)
description: QR appUrl SSOT 추출, HandoverQRDisplay guard, Drizzle eq() 교체, QUERY_CONFIG 프리셋 추가
---

# Contract: qr-appurl-ssot-debt

## Scope

| # | Issue | Priority |
|---|-------|----------|
| 1 | `HandoverQRDisplay.tsx` appUrl falsy guard 추가 | MEDIUM |
| 2 | `getAppUrl()` 유틸 추출 — EquipmentQRCode/HandoverQRDisplay/BulkLabelPrintButton 3중 중복 제거 | MEDIUM |
| 3 | `equipment-registry-data.service.ts` `sql` 템플릿 → `eq()` 교체 | LOW |
| 4 | `QUERY_CONFIG.EQUIPMENT_LIST_FRESH` 프리셋 추가, EquipmentListContent 적용 | LOW |

## Changed Files

| File | Change |
|------|--------|
| `apps/frontend/lib/qr/app-url.ts` | 신규 — `getAppUrl()` SSOT 유틸 |
| `apps/frontend/components/equipment/EquipmentQRCode.tsx` | useMemo → `getAppUrl()` 호출로 교체 |
| `apps/frontend/components/checkouts/HandoverQRDisplay.tsx` | useMemo 교체 + `issueAndRender` appUrl guard 추가 |
| `apps/frontend/components/equipment/BulkLabelPrintButton.tsx` | 인라인 appUrl 계산 → `getAppUrl()` 호출로 교체 |
| `apps/backend/src/modules/reports/services/equipment-registry-data.service.ts` | `sql` 템플릿 → `eq()`, 미사용 `sql` 임포트 제거 |
| `apps/frontend/lib/api/query-config.ts` | `QUERY_CONFIG.EQUIPMENT_LIST_FRESH` 추가 |
| `apps/frontend/components/equipment/EquipmentListContent.tsx` | spread override → `QUERY_CONFIG.EQUIPMENT_LIST_FRESH` 단일 참조 |

## MUST Criteria

| ID | Criterion | Verification |
|----|-----------|-------------|
| M1 | `getAppUrl()` 함수가 `apps/frontend/lib/qr/app-url.ts`에 export됨 | `grep -r "export function getAppUrl" apps/frontend/lib/qr/app-url.ts` |
| M2 | `EquipmentQRCode.tsx`, `HandoverQRDisplay.tsx`, `BulkLabelPrintButton.tsx` 3곳 모두 `getAppUrl` 임포트 사용 | `grep -r "getAppUrl" apps/frontend/components/` |
| M3 | `HandoverQRDisplay.tsx`의 `issueAndRender`에 `!appUrl` guard가 존재 | `grep -A3 "appUrl" apps/frontend/components/checkouts/HandoverQRDisplay.tsx` |
| M4 | `EquipmentQRCode.tsx`, `HandoverQRDisplay.tsx`에 appUrl useMemo 인라인 로직(`NEXT_PUBLIC_APP_URL`) 미존재 | `grep "NEXT_PUBLIC_APP_URL" apps/frontend/components/equipment/EquipmentQRCode.tsx apps/frontend/components/checkouts/HandoverQRDisplay.tsx` (결과 없어야 함) |
| M5 | `BulkLabelPrintButton.tsx`에 `NEXT_PUBLIC_APP_URL` 인라인 로직 미존재 | `grep "NEXT_PUBLIC_APP_URL" apps/frontend/components/equipment/BulkLabelPrintButton.tsx` (결과 없어야 함) |
| M6 | `equipment-registry-data.service.ts` status 조건에 `sql` 템플릿 미존재 | `grep "sql\`" apps/backend/src/modules/reports/services/equipment-registry-data.service.ts` (결과 없어야 함) |
| M7 | `equipment-registry-data.service.ts` status 조건에 `eq(equipment.status` 사용 | `grep "eq(equipment.status" apps/backend/src/modules/reports/services/equipment-registry-data.service.ts` |
| M8 | `QUERY_CONFIG.EQUIPMENT_LIST_FRESH` 가 `query-config.ts`에 존재 | `grep "EQUIPMENT_LIST_FRESH" apps/frontend/lib/api/query-config.ts` |
| M9 | `EquipmentListContent.tsx`가 spread override 없이 `QUERY_CONFIG.EQUIPMENT_LIST_FRESH` 단일 참조 | 파일 내 `refetchOnMount: 'always'` 인라인 미존재 확인 |
| M10 | `pnpm --filter frontend run tsc --noEmit` PASS | tsc 종료 코드 0 |
| M11 | `pnpm --filter backend run tsc --noEmit` PASS | tsc 종료 코드 0 |

## SHOULD Criteria

| ID | Criterion |
|----|-----------|
| S1 | `verify-ssot` PASS — 로컬 재정의 없음 |
| S2 | `verify-hardcoding` PASS — NEXT_PUBLIC_APP_URL 인라인 0건 |
| S3 | `QUERY_CONFIG.EQUIPMENT_LIST_FRESH`에 JSDoc 주석으로 용도 설명 존재 |

## Out of Scope

- Worker(`generate-label-pdf.worker.ts`) 내 변경 없음 — worker는 메시지로 appUrl 수신하는 올바른 설계
- `generate-label-pdf.ts` (래퍼) 내 변경 없음 — 인터페이스 명세는 `appUrl: string` 유지
- i18n 키 추가 없음 — appUrl guard 에러는 기존 `issueFailed` 텍스트 재사용
