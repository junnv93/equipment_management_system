# Contract: dashboard-tm-row3

**날짜**: 2026-04-21
**슬러그**: dashboard-tm-row3
**모드**: Mode 1

---

## 변경 대상 파일

| 파일 | 변경 유형 |
|------|---------|
| `apps/frontend/lib/config/dashboard-config.ts` | 타입·상수·config 추가 |
| `apps/frontend/lib/design-tokens/components/dashboard.ts` | 토큰 추가 (SSOT) |
| `apps/frontend/components/dashboard/DashboardClient.tsx` | Row 3 JSX 분기 |
| `apps/frontend/components/dashboard/PendingApprovalCard.tsx` | elevate prop + compact grid |

---

## MUST 기준 (16개)

### Config SSOT
- [ ] M-01: `Row3Layout = 'two-col-left-dominant' | 'three-col-action-first'` 타입이 `dashboard-config.ts`에서 export됨
- [ ] M-02: `ControlCenterConfig`에 `row3Layout?: Row3Layout` 필드 존재 (optional — 미지정 시 기존 동작 유지)
- [ ] M-03: `ControlCenterConfig`에 `pendingApprovalElevated?: boolean` 필드 존재
- [ ] M-04: `DASHBOARD_GRID.row3ThreeCol` 상수 추가됨 (`'grid grid-cols-1 lg:grid-cols-[1.5fr_1.5fr_1fr] gap-4 items-start'`)
- [ ] M-05: `DASHBOARD_GRID.row3`(string)는 변경 없음 — `loading.tsx` 호환 유지
- [ ] M-06: TECHNICAL_MANAGER config에 `row3Layout: 'three-col-action-first'`
- [ ] M-07: TECHNICAL_MANAGER config에 `pendingApprovalElevated: true`
- [ ] M-08: 다른 4개 역할(test_engineer, quality_manager, lab_manager, system_admin) config 변경 없음

### Design Token SSOT
- [ ] M-09: `DASHBOARD_PENDING_APPROVAL_TOKENS.elevation` 객체 존재 — key: `'default'`(빈 문자열), `'raised'`(`'ring-1 ring-primary/15 shadow-sm'`)
- [ ] M-10: `DASHBOARD_PENDING_APPROVAL_TOKENS.gridLayouts['prioritized-grid-compact']` 존재 (`'grid grid-cols-2 sm:grid-cols-3'` — xl:grid-cols-4 없음)
- [ ] M-11: 기존 `DASHBOARD_PENDING_APPROVAL_TOKENS` 필드 변경·삭제 없음

### PendingApprovalCard
- [ ] M-12: `elevate?: boolean` prop 추가 (기본값 false)
- [ ] M-13: `elevate=true` 시 `DASHBOARD_PENDING_APPROVAL_TOKENS.elevation.raised` 클래스가 최외각 div에 적용됨
- [ ] M-14: `compact=true` + `layoutHint='prioritized-grid'` 조합 시 `gridLayouts['prioritized-grid-compact']` 사용

### DashboardClient
- [ ] M-15: `row3Layout === 'three-col-action-first'` 분기에서 PendingApprovalCard가 DOM 첫 번째 (CalibrationDday보다 앞)
- [ ] M-16: `pnpm --filter frontend run tsc --noEmit` 에러 0건

---

## SHOULD 기준 (4개)

- [ ] S-01: `three-col-action-first` 분기에서 `DASHBOARD_GRID.row3ThreeCol` 상수 참조 (인라인 하드코딩 금지)
- [ ] S-02: compact 모드에서 prioritized-grid hero 아이콘 h-6 w-6 사용 (`priorityDefaultIcon` 재사용 or 신규 토큰)
- [ ] S-03: compact 모드에서 prioritized-grid hero 카운트 `text-2xl` (기존 `text-3xl`에서 축소)
- [ ] S-04: `PendingApprovalCard` 역할 리터럴 참조 0건 (`grep -E "quality_manager|technical_manager|test_engineer" PendingApprovalCard.tsx`)
