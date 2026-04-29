# Contract: click-feedback-nav-loading

작성일: 2026-04-29  
Mode: 1 (Lightweight)

## 목표

1. **P4-new** — 목록 → 상세 네비게이션 로딩 표시 (NC, Checkout, Equipment)
2. **P3** — `FEEDBACK_KEYS.created` → `reportGenerated` 의미 교정
3. **P2** — `ListPageSkeleton` `title?/description?` → `showTitle?/showDescription?` API 단일 책임

---

## MUST 기준

| # | 기준 | 검증 방법 |
|---|------|---------|
| M1 | NC 목록 행 클릭 시 GlobalProgressBar 활성 + 행 opacity 페이드 | `NavLink pendingIndicator="opacity"` 적용 확인 |
| M2 | Checkout 목록 항목 클릭 시 GlobalProgressBar 활성 | `useNavigateWithPending` 사용 확인 |
| M3 | Equipment 카드 "상세 보기" 클릭 시 GlobalProgressBar 활성 | `NavLink variant="card"` 적용 확인 |
| M4 | `FEEDBACK_KEYS.reportGenerated` SSOT 추가 | `feedback-keys.ts` 키 존재 확인 |
| M5 | ko/en feedback.json `reportGenerated` 키 parity | 양쪽 파일 동시 존재 |
| M6 | `use-reports.ts` `FEEDBACK_KEYS.created` → `reportGenerated` | grep 0 결과 |
| M7 | `ListPageSkeleton` `showTitle?/showDescription?` boolean 변환 | 컴포넌트 prop 변경 + 모든 호출처 업데이트 |
| M8 | `tsc --noEmit` 오류 0 | `pnpm --filter frontend run tsc --noEmit` |
| M9 | `/verify-click-feedback` PASS 유지 | 스킬 실행 결과 |

---

## SHOULD 기준

| # | 기준 |
|---|------|
| S1 | VirtualizedEquipmentList.tsx `<Link>` → `<NavLink variant="card">` |
| S2 | InboundCheckoutsTab.tsx equipment import 상세 이동 3곳도 `useNavigateWithPending` |
| S3 | P1 Button loading codemod 착수 (별도 세션 Mode 2 권고) |

---

## 변경 파일 목록

### P4-new (Navigation loading)
- `apps/frontend/app/(dashboard)/non-conformances/NonConformancesContent.tsx` — `<Link>` → `<NavLink pendingIndicator="opacity">`
- `apps/frontend/components/equipment/EquipmentCardGrid.tsx` — CardFooter Link → `<NavLink variant="card">`
- `apps/frontend/components/equipment/VirtualizedEquipmentList.tsx` — Link → `<NavLink variant="card">`
- `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx` — `useNavigateWithPending` 추가
- `apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx` — `useNavigateWithPending` 추가

### P3 (reportGenerated)
- `apps/frontend/lib/i18n/feedback-keys.ts` — `reportGenerated` 키 추가
- `apps/frontend/messages/ko/feedback.json` — `reportGenerated` 추가
- `apps/frontend/messages/en/feedback.json` — `reportGenerated` 추가
- `apps/frontend/hooks/use-reports.ts` — `FEEDBACK_KEYS.created` → `FEEDBACK_KEYS.reportGenerated`

### P2 (ListPageSkeleton)
- `apps/frontend/components/ui/list-page-skeleton.tsx` — `title?/description?` → `showTitle?/showDescription?`
- 8 호출처: calibration-plans/loading.tsx, calibration/loading.tsx, teams/loading.tsx, equipment/loading.tsx, non-conformances/loading.tsx, admin/audit-logs/loading.tsx, calibration-plans/page.tsx, non-conformances/page.tsx, calibration/page.tsx, admin/audit-logs/page.tsx

---

## 제약

- 변경 파일 외 adjacent code 손대지 않음
- `router.replace()` (URL 동기화)는 `useNavigateWithPending` 적용 금지 (사용자 화면 전환 아님)
- `useRouter` 제거 금지 (replace 사용 파일들)
