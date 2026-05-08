# Phase C Followup Closure 구현 계획

## 메타
- 생성: 2026-05-08T00:00:00+09:00
- 모드: Mode 2 (Full harness — Generator/Evaluator loop)
- 슬러그: `phase-c-followup-closure`
- 브랜치: `main` (직접 작업 — solo trunk-based, 메모리 `feedback_main_only_no_branches.md` 준수, pre-push hook이 게이트)
- 예상 변경: 18~22개 파일 (신규 5~6 + 수정 12~16 + tracker 2)
- 종속성 사전 계산: Item A (route SSOT) → Item D (e2e) / Item C (filter URL) → Item D (e2e) / Item B 는 직교(parallel) — Phase 순서가 종속을 자연스럽게 해소

## 설계 철학

`calibration-cert-phase-a-architecture-closure` 자기검토 #3 라운드에서 식별된 5개 후속 항목 중 **4건을 통합 closure**하고 1건은 STALE 정리. 핵심: (a) Option C Full footer 링크 패턴을 잔여 3 도메인에 surgical 확장, (b) Sub-route 필터 URL 동기화 + Tab/Sub 데이터 fetching SSOT 추출, (c) 신설 sub-route 의 deep-link e2e 보호선, (d) tracker hygiene. 패턴은 reinvent 금지 — 이미 존재하는 `CalibrationHistoryTab` footer / `useCalibrationFilters` / `wf-history-card-export.spec.ts` fixture 패턴을 그대로 미러.

## 배경 (사용자 컨텍스트)

`/harness` 호출로 5건 후속 종결 요청. 사전 검증 결과:
- **4 valid**: tab-footer-link-other-domains (🟡 MEDIUM), equipment-calibration-fetch-hook (🟢 LOW), calibration-history-filter-url-sync (🟢 LOW), sub-route-navigation-e2e-coverage (🟢 LOW).
- **1 STALE**: `ul-qp-18-02-export-renderer` — backend `equipment-history.controller.ts @Get(':uuid/history-card')` + `HistoryCardService.generateHistoryCard()` + `history-card-renderer.service.ts` + `EquipmentStickyHeader.tsx` `historyCardExportAriaLabel` 버튼 + `wf-history-card-export.spec.ts` (4 e2e tests, DOCX 파싱 + 섹션 순서 검증) **모두 구현 완료**. tracker 정합화만 필요.

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| Item A footer link i18n key 명명 | 도메인별 `viewAllLink` (각 tab 객체 하위) | `calibrationHistoryTab.viewAllLink` 기존 패턴 1:1 미러. 평면 `viewAll` (shared) 후보보다 namespacing이 a11y 텍스트 도메인-specific화에 유리 |
| Item A 신규 route SSOT 위치 | `FRONTEND_ROUTES.EQUIPMENT.{REPAIR_HISTORY,CALIBRATION_FACTORS}` (NON_CONFORMANCES 는 기존 재사용) | 기존 `CALIBRATION_HISTORY` JSDoc 패턴 미러. plural `NON_CONFORMANCES` 이미 존재 (`/equipment/[id]/non-conformance` resolve) — 신규 키 `NON_CONFORMANCE` 추가 금지 |
| Item B Tab/Sub shape 통합 | **둘 다 유지 + 단일 hook 추출** (Calibration[] tab + CalibrationHistory[] sub) | 두 endpoint 응답이 **superset 관계 아님**: `Calibration` 은 `version/certificatePath/calibrationManagerId` 보유, `CalibrationHistory` 는 `equipmentName/managementNumber` join 컬럼 보유. 강제 통합은 backend endpoint 변경 필요 → out-of-scope. hook 추출은 `useEquipmentCalibrations(equipmentId, options?: { variant: 'tab' \| 'history' })` overload 또는 별도 두 hook으로 — Generator 결정 위임. 핵심 SSOT 가치는 queryKey + queryFn pairing 회귀 차단 + cache config 일관 |
| Item C 필터 URL 파서 위치 | `CalibrationHistoryClient.tsx` 인라인 `useSearchParams` + `router.replace` | 4 필터(approvalFilter/resultFilter/dateFrom/dateTo)는 **단일 caller** — 별도 util 추출은 premature abstraction. 메인 `/calibration` 도 별도 util(`calibration-filter-utils.ts`)로 추출돼있지만 그것은 11+ 필드 + 다중 caller(server page + client + hook). sub-route 4 필드는 인라인이 minimal code 원칙에 맞음 |
| Item C `_all` sentinel 패턴 | 적용 (메인 `/calibration` 일관) | "선택 안함"과 "전체"를 구별 — Radix Select 의 `value=""` 회귀 차단(메인 `/calibration` 사례). 4 필드 모두 적용해야 일관 |
| Item D e2e fixture role | `techManagerPage` (`technical_manager`) | `wf-history-card-export.spec.ts` 와 동일 — equipment 상세 + calibration history는 기술책임자 직무 (UL-QP-18). 메모리 `feedback_e2e_role_isolation`: scope 검증 spec 아님(워크플로 spec)이므로 systemAdmin 회피, 도메인 역할 사용 |
| Item D 검증 대상 | (1) deep-link entry, (2) 필터 URL sync, (3) footer 링크 navigation | 자기검토 #3 트리거 명문: "URL deep-link 진입 → server prefetch → Client component → Tab 통합". footer 링크 (Item A 산출물)도 e2e 보호선 — Item A 회귀 차단 |
| Phase 순서 | Phase 1 (SSOT + footer) → 2 (fetch hook) → 3 (filter URL) → 4 (e2e) → 5 (tracker) | Item A SSOT가 Item D footer link 검증 의존 → A 먼저. Item C URL 동기화 또한 D 의 필터 URL 검증 의존 → C 먼저. Item B 는 직교지만 D 의 hook usage 검증을 추가 케이스로 포함 가능 |
| 작업 브랜치 | `main` 직접 | 메모리 `feedback_main_only_no_branches.md` (35차 결정). DB 마이그레이션 없음, 단일 도메인 frontend-only |

## 구현 Phase

### Phase 1: SSOT + 3 도메인 Tab footer link 추가 (Item A)

**목표:** `MaintenanceHistoryTab` / `CalibrationFactorsTab` / `IncidentHistoryTab` 에 footer "전체 보기" 링크를 `CalibrationHistoryTab` 와 동일 a11y/Link 패턴으로 추가하고 신규 route helper 2건을 SSOT에 등록.

**변경 파일:**
1. `packages/shared-constants/src/frontend-routes.ts` — 수정. `FRONTEND_ROUTES.EQUIPMENT` 객체에 `REPAIR_HISTORY: (id: string) => '/equipment/${id}/repair-history'` 와 `CALIBRATION_FACTORS: (id: string) => '/equipment/${id}/calibration-factors'` 두 빌더 추가. 기존 `CALIBRATION_HISTORY` 와 동일 JSDoc 스타일(역할 분리 + sub-route 의도 1줄). `NON_CONFORMANCES` 는 이미 존재하므로 추가 금지.
2. `apps/frontend/messages/ko/equipment.json` — 수정. 다음 3개 키 추가 — `maintenanceHistoryTab.viewAllLink` ("이 장비의 전체 유지보수 이력 보기"), `calibrationFactorsTab.viewAllLink` ("이 장비의 전체 보정인자 보기"), `incidentHistoryTab.viewAllLink` ("이 장비의 전체 부적합 보기"). `calibrationHistoryTab.viewAllLink` 톤매너 미러.
3. `apps/frontend/messages/en/equipment.json` — 수정. 위 3개 키 영문판 (`View full maintenance history for this equipment` 등).
4. `apps/frontend/components/equipment/MaintenanceHistoryTab.tsx` — 수정. `CalibrationHistoryTab` L235~244 footer 패턴 그대로 복사 — `<div className="flex justify-end pt-3 border-t mt-3">` + `<Link href={FRONTEND_ROUTES.EQUIPMENT.REPAIR_HISTORY(equipmentId)} ...focus-visible classes...>` + `t('maintenanceHistoryTab.viewAllLink')` + `<ArrowRight aria-hidden />`. import: `Link` (next/link), `ArrowRight` (lucide-react), `FRONTEND_ROUTES` (shared-constants). 기존 빈상태/에러/로딩 분기에서는 footer 노출 안 함 (CalibrationHistoryTab 동일 정책 — Card 본문이 정상 렌더되는 경로만).
5. `apps/frontend/components/equipment/CalibrationFactorsTab.tsx` — 수정. 현재 빈 placeholder Card이지만 footer 링크는 항상 노출(목록 sub-route 진입점 역할). `<CardContent>` 빈상태 div 다음에 동일 footer div 추가. `FRONTEND_ROUTES.EQUIPMENT.CALIBRATION_FACTORS(equipmentId)` 사용. equipmentId prop 은 이미 수신 중(`_equipment` rename 해제 필요).
6. `apps/frontend/components/equipment/IncidentHistoryTab.tsx` — 수정. 빈상태/에러/로딩 외 본문 렌더 경로(L824~919)에 동일 footer div 추가. `FRONTEND_ROUTES.EQUIPMENT.NON_CONFORMANCES(equipmentId)` (plural — 기존 SSOT 재사용).
7. `apps/frontend/components/equipment/__tests__/MaintenanceHistoryTab.test.tsx` (신규 또는 기존 확장) — 신규/수정. footer 링크 렌더 + `href` 가 `FRONTEND_ROUTES.EQUIPMENT.REPAIR_HISTORY(...)` 와 일치하는지 검증. 기존 spec 파일 존재 시 case 추가, 없으면 신규.
8. `apps/frontend/components/equipment/__tests__/IncidentHistoryTab.test.tsx` — 위와 동일 (footer link case 추가/신규).
9. `apps/frontend/components/equipment/__tests__/CalibrationFactorsTab.test.tsx` — 위와 동일.

**검증:**
```
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run test -- MaintenanceHistoryTab CalibrationFactorsTab IncidentHistoryTab
```
- grep `FRONTEND_ROUTES.EQUIPMENT.REPAIR_HISTORY` in `MaintenanceHistoryTab.tsx` ≥ 1
- grep `FRONTEND_ROUTES.EQUIPMENT.CALIBRATION_FACTORS` in `CalibrationFactorsTab.tsx` ≥ 1
- grep `FRONTEND_ROUTES.EQUIPMENT.NON_CONFORMANCES` in `IncidentHistoryTab.tsx` ≥ 1
- 3 tab 파일에 raw path `'/equipment/.*/repair-history'` / `'/equipment/.*/calibration-factors'` / `'/equipment/.*/non-conformance'` 인라인 0건 (NON_CONFORMANCES 빌더 결과만 허용)

**Out of scope:**
- `BasicInfoTab` / `CheckoutHistoryTab` / `LocationHistoryTab` / `AttachmentsTab` / `SoftwareTab` / `InspectionTab` / `SelfInspectionTab` 는 footer 링크 추가 대상 아님 (각 도메인 sub-route 부재 또는 별도 sprint trigger 미해당)
- `IncidentHistoryTab` 내부 인라인 `<Link href={`/equipment/${equipmentId}/repair-history`}>` (L666) 마이그레이션 — 본 sprint 의도(footer link 추가)와 별개 surgical 항목, 후속 sprint trigger
- footer 링크 design token 적용 — 기존 `CalibrationHistoryTab` 도 인라인 className 사용 중 (token 추출은 별도 design system sprint)

---

### Phase 2: useEquipmentCalibrations hook 추출 (Item B)

**목표:** `CalibrationHistoryTab` (`getEquipmentCalibrations`) 와 `CalibrationHistoryClient` (`getCalibrationHistory({ equipmentId })`) 의 fetching pairing(queryKey + queryFn + QUERY_CONFIG) 을 단일 hook 으로 결빙 — 두 endpoint 응답 shape 차이(superset 관계 아님)는 보존, hook 내부에서 variant 분기. 회귀 차단 + 신규 caller 추가 시 SSOT 강제.

**변경 파일:**
1. `apps/frontend/hooks/use-equipment-calibrations.ts` — 신규. `useEquipmentCalibrations(equipmentId: string)` 기본형 (Calibration[] 반환, Tab variant), `useEquipmentCalibrationHistory(equipmentId, options?: { pageSize?: number })` 별도 export (CalibrationHistory[] 반환, Sub variant). 또는 단일 hook + `variant: 'tab' | 'history'` discriminated overload — Generator 가 선택. 핵심: queryKey 는 `queryKeys.calibrations.byEquipment(...)` (Tab) / `queryKeys.calibrations.historyList({...})` (Sub) — 기존 SSOT 그대로. `enabled: !!equipmentId` 가드 + `QUERY_CONFIG.HISTORY` (Tab) / `QUERY_CONFIG.CALIBRATION_LIST` (Sub) 적용. JSDoc 에 두 endpoint 차이(`Calibration` vs `CalibrationHistory`) 와 통합 불가 사유(superset 아님 + backend endpoint 변경 out-of-scope) 명시.
2. `apps/frontend/components/equipment/CalibrationHistoryTab.tsx` — 수정. L66~75 `useQuery({...})` 호출을 `const { data: calibrations = [], isLoading, isError } = useEquipmentCalibrations(equipmentId)` 로 교체. import 정리.
3. `apps/frontend/components/equipment/CalibrationHistoryClient.tsx` — 수정. L96~100 `useQuery({...})` 호출을 `useEquipmentCalibrationHistory(equipmentId, { pageSize: SELECTOR_PAGE_SIZE })` 로 교체. import 정리.
4. `apps/frontend/hooks/__tests__/use-equipment-calibrations.test.ts` — 신규 (또는 RTL spec 통합). queryKey 정합 + enabled false 가드 + 두 variant queryFn 분기 검증.
5. `apps/frontend/components/equipment/BasicInfoTab.tsx` — 수정 (선택적). `calibrationApi.getEquipmentCalibrations` 직접 호출(L55) — Tab variant hook 으로 교체 가능. 단, BasicInfoTab 의 사용 패턴이 호환되는 경우만 — 호환 안 되면 그대로 유지 + tech-debt 등록.
6. `apps/frontend/components/equipment/EquipmentForm.tsx` — 수정하지 않음. L303 의 `await calibrationApi.getEquipmentCalibrations(...)` 는 form submit 콜백 내부 imperative 호출 — useQuery 패턴과 무관. hook 으로 변환은 부적절.

**검증:**
```
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run test -- use-equipment-calibrations CalibrationHistoryTab CalibrationHistoryClient
```
- grep `useEquipmentCalibrations` in `CalibrationHistoryTab.tsx` ≥ 1
- grep `useEquipmentCalibrationHistory` (또는 통합 hook 명) in `CalibrationHistoryClient.tsx` ≥ 1
- 두 컴포넌트에서 `calibrationApi.getEquipmentCalibrations` / `calibrationApi.getCalibrationHistory` 직접 호출 0건
- 두 컴포넌트에서 `useQuery({` 직접 호출 횟수가 sprint 시작 대비 감소

**Out of scope:**
- backend endpoint 통합(getEquipmentCalibrations 를 getCalibrationHistory 로 대체) — backend 변경 + 응답 shape consumer 변경 → 별도 sprint trigger
- `EquipmentForm.tsx` imperative 호출 변환
- BasicInfoTab 변환이 호환 안 될 경우 강제 — tech-debt 후속 등록만

---

### Phase 3: CalibrationHistoryClient 4 필터 URL 동기화 (Item C)

**목표:** `CalibrationHistoryClient` 의 4 필터(`approvalFilter` / `resultFilter` / `dateFrom` / `dateTo`)를 `useSearchParams + router.replace` 로 URL SSOT 화. 메인 `/calibration` 의 `_all` sentinel 패턴 적용.

**변경 파일:**
1. `apps/frontend/components/equipment/CalibrationHistoryClient.tsx` — 수정. L103~106 `useState` 4 필드 제거 → `useSearchParams()` 로 read, 변경 시 `router.replace(\`/equipment/${equipmentId}/calibration-history?${params.toString()}\`, { scroll: false })`. 빈 값(`''`)은 URL 제외 (clean URLs). approvalFilter/resultFilter Select 변경 시 `_all` sentinel(메인 `/calibration` 일관). dateFrom/dateTo 는 sentinel 불필요(빈 문자열로 자연 처리). `useFilterSelect<...>` 호출은 그대로 유지(spurious onValueChange guard SSOT).

   인라인 헬퍼: `updateFilter(key: 'approvalFilter' | 'resultFilter' | 'dateFrom' | 'dateTo', value: string)` — `URLSearchParams(searchParams)` 복사 → set/delete → `router.replace`. **별도 util 파일 추출 금지** (단일 caller, 4 필드 — premature abstraction).
2. `apps/frontend/components/equipment/__tests__/CalibrationHistoryClient.test.tsx` — 수정/신규. URL 변경 → 필터 state 반영 + 필터 변경 → URL replace 호출 검증 (`router.replace` mock + `useSearchParams` mock). 빈 값 → URL 미포함 (clean URL) 검증.

**검증:**
```
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run test -- CalibrationHistoryClient
```
- grep `useSearchParams` in `CalibrationHistoryClient.tsx` ≥ 1
- grep `router.replace` in `CalibrationHistoryClient.tsx` ≥ 1
- grep `useState<.*Filter\|useState<string>` 호출에서 4 필터 필드명(`approvalFilter|resultFilter|dateFrom|dateTo`) 인라인 매치 0건

**Out of scope:**
- `RepairHistoryClient` / `CalibrationFactorsClient` / `NonConformanceManagementClient` 필터 URL 동기화 (다른 도메인 — 별도 trigger)
- 필터 SSOT util 파일 신규 생성 (premature)
- backend query DTO 가 본 4 필터를 이미 검증 중이므로 backend 변경 불필요 (out-of-scope, 회귀 시에만 trigger)

---

### Phase 4: Sub-route Playwright e2e (Item D)

**목표:** `/equipment/[id]/calibration-history` sub-route 의 (1) deep-link entry, (2) 필터 URL sync, (3) footer 링크 navigation 3 케이스를 e2e 로 보호. 기존 `wf-history-card-export.spec.ts` fixture 패턴 미러.

**변경 파일:**
1. `apps/frontend/tests/e2e/workflows/wf-equipment-calibration-history-sub-route.spec.ts` — 신규. `import { test, expect } from '../shared/fixtures/auth.fixture'` + `import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data'` (또는 동일 디렉토리 inspection). `test.describe.configure({ mode: 'serial' })` (history-card 일관). `techManagerPage` fixture 사용 (`technical_manager` storageState — UL-QP-18 도메인 역할).

   테스트 케이스:
   - **Case 1: Deep-link entry** — `await page.goto(\`/equipment/${equipmentId}/calibration-history\`)` 직접 진입. `expect(page.locator('h1')).toContainText(...)` (PageHeader title) + `await expect(page.getByRole('table'))` (또는 list rendering proof). Tab 클릭 경유 X.
   - **Case 2: 필터 URL sync** — 진입 후 approval filter `'approved'` 선택 → URL 에 `?approvalStatus=approved` 또는 `_all` sentinel 일관 패턴 확인. 새 페이지 reload (`await page.reload()`) → 필터 state 복원 검증.
   - **Case 3: Footer 링크 navigation** — `/equipment/[id]` Tab 진입 → calibration tab 클릭 → footer "전체 보기" 링크 클릭 → URL 이 `/equipment/[id]/calibration-history` 로 변경 + Sub-route 페이지 렌더 검증 (Item A footer 링크 + Item C URL 모두 보호).

   `TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E` (history-card spec 일관) 또는 다른 seed 장비 사용. `wait_for` 패턴: `await page.waitForURL(/calibration-history/)` + `expect(...).toBeVisible()`.

2. `apps/frontend/tests/e2e/shared/constants/shared-test-data.ts` — 변경 없음 (기존 SSOT 재사용). 새 상수 추가 금지.

**검증:**
```
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend exec playwright test wf-equipment-calibration-history-sub-route --project=chromium
```
- 신규 spec 파일 존재 (`ls -la`)
- 3 `test('...', ...)` 케이스 ≥ 3
- spec 내부 `loginAs.*systemAdmin` 호출 0건 (도메인 역할 격리 — verify-e2e Step 25)
- spec 런타임 < 30s (SHOULD)

**Out of scope:**
- `RepairHistoryClient` / `CalibrationFactorsClient` / `NonConformanceManagementClient` sub-route e2e — 다른 sprint trigger
- Tab vs Sub-route 아키텍처 결정 e2e 검증(자기검토 #3 잔여 항목 — architectural decision 후 별도 sprint)
- a11y axe-core 통합 (별도 a11y sprint)
- 모바일 viewport 검증

---

### Phase 5: tech-debt-tracker 정합화 (5건 archive batch)

**목표:** 본 sprint 4건 closure + 1건 STALE 을 archive 로 이관, tracker 와 archive 양방향 정합 유지.

**변경 파일:**
1. `.claude/exec-plans/tech-debt-tracker.md` — 수정. 2026-05-08 phase-c-followup 섹션의 5개 [ ] 라인 모두를 [x] 로 변경 후 섹션 헤더 코멘트에 sprint slug + commit hash 기재. 또는 5개 라인 자체 제거 + 섹션 종결 코멘트로 closure 안내. archive 와의 SSOT 무결성 유지가 핵심 (verify-frontend-state Step 41 / 메모리 `feedback_evaluator_or_fallback_pattern` — tracker [x] 는 OR-fallback 일부).
2. `.claude/exec-plans/tech-debt-tracker-archive.md` — 수정. 새 batch row 추가:
   ```
   ### 2026-05-08 phase-c-followup-closure (Mode 2 Full)
   > sprint slug: phase-c-followup-closure
   > commits: <to be filled by Generator after commit>
   > closure notes: 4 items closed (tab-footer + fetch-hook + filter-url + e2e) + 1 STALE (ul-qp-18-02-export-renderer — already implemented in equipment-history.controller.ts/HistoryCardService/wf-history-card-export.spec.ts).
   - [x] tab-footer-link-other-domains — Maintenance/CalibrationFactors/Incident 3 도메인 footer link + FRONTEND_ROUTES.EQUIPMENT.{REPAIR_HISTORY,CALIBRATION_FACTORS} SSOT
   - [x] equipment-calibration-fetch-hook — useEquipmentCalibrations + useEquipmentCalibrationHistory hook 추출, Tab/Sub variant 분기
   - [x] calibration-history-filter-url-sync — CalibrationHistoryClient 4 필터 useSearchParams + router.replace
   - [x] sub-route-navigation-e2e-coverage — wf-equipment-calibration-history-sub-route.spec.ts (3 cases: deep-link/filter URL/footer link)
   - [x] ul-qp-18-02-export-renderer — STALE: 사전 구현 완료(equipment-history.controller.ts L57-73 + HistoryCardService.generateHistoryCard + history-card-renderer.service.ts + EquipmentStickyHeader historyCardExportAriaLabel + wf-history-card-export.spec.ts 4 e2e), tracker hygiene 만 처리
   ```

**검증:**
- `grep -c "tab-footer-link-other-domains" tech-debt-tracker.md` 결과 0 (또는 [x] 만)
- `grep -c "ul-qp-18-02-export-renderer" tech-debt-tracker.md` 결과 0 (또는 [x] 만)
- `grep -c "phase-c-followup-closure" tech-debt-tracker-archive.md` ≥ 1
- archive batch row 5개 [x] 모두 포함 (`grep -c "^- \[x\]" tech-debt-tracker-archive.md` 가 sprint 시작 대비 +5)

**Out of scope:**
- 다른 sprint 의 미완 항목 정리
- archive 형식 리팩토링

---

## 전체 변경 파일 요약

### 신규 생성
| 파일 | 목적 |
|------|------|
| `apps/frontend/hooks/use-equipment-calibrations.ts` | Item B fetch hook SSOT |
| `apps/frontend/hooks/__tests__/use-equipment-calibrations.test.ts` | Item B hook spec |
| `apps/frontend/components/equipment/__tests__/MaintenanceHistoryTab.test.tsx` | Item A footer link spec (없을 시) |
| `apps/frontend/components/equipment/__tests__/CalibrationFactorsTab.test.tsx` | Item A footer link spec (없을 시) |
| `apps/frontend/components/equipment/__tests__/IncidentHistoryTab.test.tsx` | Item A footer link spec (없을 시) |
| `apps/frontend/tests/e2e/workflows/wf-equipment-calibration-history-sub-route.spec.ts` | Item D e2e spec |

### 수정
| 파일 | 변경 의도 |
|------|----------|
| `packages/shared-constants/src/frontend-routes.ts` | EQUIPMENT.REPAIR_HISTORY + CALIBRATION_FACTORS 빌더 추가 |
| `apps/frontend/messages/ko/equipment.json` | 3 도메인 viewAllLink 한글 키 |
| `apps/frontend/messages/en/equipment.json` | 3 도메인 viewAllLink 영문 키 |
| `apps/frontend/components/equipment/MaintenanceHistoryTab.tsx` | footer link 추가 |
| `apps/frontend/components/equipment/CalibrationFactorsTab.tsx` | footer link 추가 + equipmentId prop 사용 |
| `apps/frontend/components/equipment/IncidentHistoryTab.tsx` | footer link 추가 |
| `apps/frontend/components/equipment/CalibrationHistoryTab.tsx` | useEquipmentCalibrations 적용 |
| `apps/frontend/components/equipment/CalibrationHistoryClient.tsx` | useEquipmentCalibrationHistory + 4 필터 URL sync |
| `apps/frontend/components/equipment/__tests__/CalibrationHistoryClient.test.tsx` | URL sync RTL spec 확장 |
| `apps/frontend/components/equipment/BasicInfoTab.tsx` (선택) | hook 호환 시 적용 |
| `.claude/exec-plans/tech-debt-tracker.md` | 5건 closure 표시 |
| `.claude/exec-plans/tech-debt-tracker-archive.md` | sprint batch row 추가 |

## 의사결정 로그

- **2026-05-08 T0**: Planner — 5건 사전 검증 완료. `ul-qp-18-02-export-renderer` STALE 확정 (backend renderer + frontend button + e2e 모두 존재). 4건 valid. Phase 순서 결정: A → B/C 병렬 가능하나 D 의존성 때문에 A → B → C → D → 5 순차.
- **2026-05-08 T0**: Item B 통합 결정 — 두 endpoint 응답 shape 검토 결과 superset 관계 아님(Calibration: version/certificatePath/manager 보유 / CalibrationHistory: equipmentName/managementNumber join). backend 변경 없이 강제 통합은 데이터 손실. → **단일 hook 모듈 + variant 분기** 로 SSOT 가치 확보 (queryKey/queryFn/QUERY_CONFIG pairing 결빙).
- **2026-05-08 T0**: Item C util 추출 보류 — 4 필드 + 단일 caller. 메인 `/calibration` 의 `calibration-filter-utils.ts` 는 11+ 필드 + 다중 caller(server page + client + hook) 라 별도 추출 정당. sub-route 4 필드 인라인이 minimal code 원칙 부합. 추후 caller 추가 시 추출 trigger.
- **2026-05-08 T0**: e2e 역할 — `techManagerPage` 선택. `wf-history-card-export.spec.ts` 일관 + 메모리 `feedback_e2e_role_isolation` 준수 (도메인 역할 우선).
