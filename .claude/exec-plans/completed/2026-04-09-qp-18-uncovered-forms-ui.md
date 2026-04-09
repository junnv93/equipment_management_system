# UL-QP-18 미커버 양식 UI 진입점 추가 (QP-18-03/05/06/10)

- 날짜: 2026-04-09
- 브랜치: **main 직접 작업** (사용자 명시)
- 연관: `tech-debt-tracker.md` L23 `[~] Export UI 다운로드 동선 미검증 양식`
- Mode: 2 (Full harness)

## 배경

backend exporter (`form-template-export.service.ts`) 는 구현되어 있으나 프론트엔드 UI 버튼이 없어 사용자가 다운로드 불가. `wf-export-ui-download.spec.ts` 가 "미커버 (UI 진입점 부재)" 로 표기.

| Form | Backend exporter | Param |
|---|---|---|
| QP-18-03 중간점검표 | `:316` `exportIntermediateInspection` | `inspectionId` |
| QP-18-05 자체점검표 | `:506` `exportSelfInspection` | `equipmentId` |
| QP-18-06 반·출입 확인서 | `:717` `exportCheckout` | `checkoutId` |
| QP-18-10 공용장비 사용/반납 | `:1458` `exportEquipmentImport` | `importId` |

## 결정 로그

- **Q1 추상화**: `ExportFormButton` 공유 컴포넌트 신설 — 4개 신규 + 기존 4개 call site 모두 동일 4-part boilerplate (useState(false) + try/catch + toast + can). 신규 4곳은 즉시 채택, 기존 4곳 소급 마이그레이션은 out-of-scope.
- **Q2 권한**: `Permission.EXPORT_REPORTS` 단일. 백엔드 `reports.controller.ts:381` 와 정렬.
- **Q3 상태 gating**:
  - QP-18-03: `approvalStatus === 'approved'` 만
  - QP-18-05: 게이트 없음 (장비 스코프 집계)
  - QP-18-06: `pending/rejected/cancelled` 제외
  - QP-18-10: `pending/rejected/cancelled` 제외
- **Q5 cross-site**: 백엔드 `@SiteScoped` + `EnforcedScope` 이 이미 처리. 403/404 는 toast 로 노출.
- **Q9 cache invalidation**: 불필요 (read-only download).

## Phase 1 — 공유 컴포넌트

- 신규 `apps/frontend/components/shared/ExportFormButton.tsx`
  - Props: `formNumber`, `params`, `label`, `errorToastDescription`, `disabled?`, `className?`
  - `can(Permission.EXPORT_REPORTS)` false → `null`
  - loading state + try/catch + destructive toast
  - 검증: `pnpm --filter frontend run tsc --noEmit`

## Phase 2 — 4개 UI 진입점

| 파일 | Form | 위치 |
|---|---|---|
| `components/equipment/IntermediateInspectionList.tsx` | 03 | 행별 action 영역, `approved` 상태만 |
| `components/equipment/SelfInspectionTab.tsx` | 05 | 탭 헤더 action 영역 |
| `app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx` | 06 | `renderActions` 내, 상태 화이트리스트 |
| `components/equipment-imports/EquipmentImportDetail.tsx` | 10 | action 영역, pending/rejected/cancelled 제외 |

## Phase 3 — i18n

- `messages/ko/calibration.json` + `en` — `intermediateInspection.actions.exportForm*`
- `messages/ko/equipment.json` + `en` — `selfInspection.actions.exportForm*`, `equipmentImport.exportForm*`
- `messages/ko/checkouts.json` + `en` — `actions.exportForm`, `toasts.exportFormError`

## Phase 4 — E2E

`tests/e2e/workflows/wf-export-ui-download.spec.ts` — 4개 describe 추가 (QP-18-03/05/06/10), 기존 `expectFileDownload` helper + `UL-QP-18-XX.*\.(docx|xlsx)$` 가드. 헤더 "미커버" 주석에서 03/05/06/10 제거, QP-18-11 만 남김.

## Phase 5 — tracker

`.claude/exec-plans/tech-debt-tracker.md` L23 `[~]` → `[x]`, 해결 노트 append.

## 검증

- `pnpm --filter frontend run tsc --noEmit`
- `pnpm --filter backend run test` (회귀 0)
- `pnpm --filter frontend run test:e2e -- wf-export-ui-download`
