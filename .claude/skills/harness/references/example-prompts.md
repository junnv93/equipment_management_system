# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-04-08 (31차 — WF-21 API spec 완료 + Export UI 갭 발견, 신규 4건)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용. `/playwright-e2e` 로 E2E 프롬프트 실행.

---

## 현재 미해결 프롬프트: 8건 (+ 사용자 결정 대기 1건)

### 🟠 HIGH — WF-21 케이블 Path Loss 관리 E2E 워크플로우 spec 부재 (Playwright)

```
docs/workflows/critical-workflows.md WF-21 (UL-QP-18-08 케이블 Path Loss 관리) 가
정식 등재되어 있고 코드(`CablesService`, `CablesController`, `CableListContent`,
`CableDetailContent`, `MeasurementFormDialog`, `FormTemplateExportService`)는 모두 존재하지만,
apps/frontend/tests/e2e/workflows/ 트리에 wf-21-* spec 이 없다.
features/ 트리에서도 cable 관련 spec 0건 (find -iname '*cable*' 결과 없음).

WF-19/WF-20 export spec(`wf-19b-intermediate-inspection-export.spec.ts`,
`wf-20b-self-inspection-export.spec.ts`) 패턴을 그대로 답습해 케이블 등록 → 측정 추가 →
QP-18-08 export 까지 cover.

작업:
1. apps/frontend/tests/e2e/workflows/wf-21-cable-path-loss.spec.ts 신규 작성
2. 시나리오: TE 로그인 → /cables → "케이블 등록" → ELLLX-NNN 형식 관리번호 → 상세 진입 → 측정 추가
   (Freq/Data 포인트 N개) → latestDataPoints 표시 확인 → 목록 "내보내기" → xlsx 다운로드 → 시트1(목록) +
   개별 케이블 시트 검증
3. CAS 충돌은 케이블 수정 단계에서 1건만 (선택)
4. 도메인 데이터 fabricate 금지 — 관리번호 형식 ELLLX-NNN 만 준수, 실측 dB 값은 더미 0/1/2 허용

검증:
- pnpm --filter frontend exec playwright test wf-21-cable-path-loss exit 0
- 시드 의존성: cables 시드 (없으면 spec 내부 API 직접 생성)
- find apps/frontend/tests/e2e -iname '*cable*' → 1+ hit
```

### 🟠 HIGH — WF-35 CAS 충돌 프론트엔드 UI 복구 E2E (다탭 시뮬레이션) (Playwright)

```
critical-workflows.md WF-35 (CAS 충돌 UI 복구) 신규 등재됨. 백엔드 관점 spec 은
features/non-conformances/comprehensive/s35-cas-cache.spec.ts 와
features/approvals/comprehensive/10-cas-version-conflict.spec.ts 가 이미 있지만,
**프론트엔드 사용자 동선** (다탭 동시 편집 → 한국어 토스트 → 자동 refetch → 재시도 성공) 은
verify된 spec 으로 cover되지 않는다.

확인된 코드 경로:
- use-optimistic-mutation.ts:249 — getLocalizedErrorInfo(EquipmentErrorCode.VERSION_CONFLICT, t)
- InspectionFormDialog.tsx:121, SelfInspectionFormDialog.tsx:89, ReceiveEquipmentImportForm.tsx:151
- CalibrationPlanDetailClient.tsx:149 공통 핸들러

작업:
1. apps/frontend/tests/e2e/workflows/wf-35-cas-ui-recovery.spec.ts 신규
2. 시나리오:
   a. 같은 storageState 로 두 BrowserContext 열기 (또는 한 컨텍스트 내 두 페이지)
   b. 양쪽 페이지 모두 /equipment/[id] 또는 /equipment/[id]/edit 진입
   c. 페이지A: 필드 수정 → "저장" → 토스트 확인, version +1
   d. 페이지B: 다른 필드 수정 → "저장" → 409 응답
   e. 페이지B 에서 한국어 토스트 텍스트 검증 (`getByRole('status', { name: /다른 사용자/ })` 등)
   f. 페이지B 폼이 최신 version 으로 reload 되었는지 확인
   g. 페이지B 에서 다시 "저장" → 성공 토스트
3. WF-19 의 `wf-19-intermediate-inspection-3step-approval.spec.ts` 다탭 패턴 참고

검증:
- pnpm --filter frontend exec playwright test wf-35-cas-ui-recovery exit 0
- 토스트 셀렉터는 getByRole/getByText (CSS 셀렉터 금지 — 사용자 메모리 규칙)
- 회귀: features/non-conformances/comprehensive/s35-cas-cache.spec.ts 통과 유지
```

### ~~🟡 MEDIUM — WF-25 alerts → 장비 상세 → 반출 신청 cross-flow E2E~~ ✅ 완료 (32차, 2026-04-08)

- spec: `apps/frontend/tests/e2e/workflows/wf-25-alert-to-checkout.spec.ts`
- 시드 보강: `apps/backend/src/database/seed-data/admin/notifications.seed.ts` — TE 대상 calibration_due 알림 1건 deterministic
- 부수 architecture fix (cross-cutting):
  - `notifications` Phase 0 truncate 추가 (idempotency 회복, 누적 280건 → 1건)
  - `verification.ts` SSOT 리팩토링 — 16개 magic number → `SEED_DATA.length/.filter().length` 도출
  - `global-setup.ts` fail-fast (warn → throw, false negative 차단)
  - `notifications.{recipient,team,equipment,actor}_id` hard FK + ON DELETE 정책 (migration `0004_opposite_selene.sql`)
- 검증: WF-25 + alert-kpi 13/13, backend 473/473, 시드 30/30

### 🟡 MEDIUM — global-setup 교정 overdue 트리거 실패 (lab_manager 토큰 발급) (Mode 1)

```
apps/frontend/tests/e2e/global-setup.ts 의 시드 후 "교정 기한 초과 장비 자동 부적합 전환"
단계에서 fetchBackendToken('lab_manager') 가 실패하여 POST /notifications/trigger-overdue-check
호출이 catch 로 떨어지고 "⚠️ 교정 기한 초과 점검 트리거 실패 — 일부 장비 상태가 부정확할 수 있습니다"
경고만 남긴다. 이로 인해 시드 상대날짜(daysAgo) 기반 교정일이 overdue 상태로 전환되지 않아
calibration_overdue 상태의 장비 집계가 부정확해질 수 있다.

증상 로그 (2026-04-08 세션):
  🌱 테스트 시드 데이터 로딩...
  ✅ 시드 데이터 로딩 완료
  🔄 교정 기한 초과 장비 점검 트리거...
  ⚠️  교정 기한 초과 점검 트리거 실패 — 일부 장비 상태가 부정확할 수 있습니다.

확인 필요:
1. fetchBackendToken() 구현 위치와 credentials 소스 (env? hardcoded?)
2. lab_manager 계정이 실제로 존재하고 credentials 가 valid 한지
3. AbortSignal.timeout(10000) 이 실제로 발동하는지 vs 인증 단계에서 실패하는지
4. 실패를 silent warn 으로 처리하는 현재 방식이 적절한가 — global-setup 이 fail-fast 로 전환된
   이상 이 트리거 실패도 throw 할지, 아니면 warn 유지할지 정책 결정 필요

작업:
1. global-setup.ts 의 fetchBackendToken 및 trigger 호출 블록 로그 보강 (err.message 출력)
2. 원인 파악 후: credentials 수정 or 스케줄러 로직을 시드 단계에서 직접 호출하도록 리팩토링
   (API 호출 우회 — seed-test-new.ts 안에서 SQL 로 overdue 상태 계산)
3. calibration_overdue 집계가 포함된 spec(alert-kpi 등)이 영향받는지 확인

검증:
- pnpm --filter frontend exec playwright test alert-kpi --project=chromium 통과 유지
- global-setup 로그에 "⚠️ 교정 기한 초과 점검 트리거 실패" 메시지 없음
- 시드 검증에 Equipment status: calibration_overdue ≥ 1 체크 통과
```

### 🟢 LOW — verification.ts SSOT 리팩토링 후속 커버리지 갭 (Mode 0 or Mode 1)

```
32차 세션에서 verification.ts 의 모든 count 체크를 SEED_DATA 기반 SSOT 로 전환했으나,
아래 테이블/항목은 여전히 검증 누락 상태이다.

누락 항목:
1. `repair_history` — REPAIR_HISTORY_SEED_DATA.length 로 검증 추가 가능
2. `calibration_factors` — CALIBRATION_FACTORS_SEED_DATA.length
3. `software_validations` — SOFTWARE_VALIDATIONS_SEED_DATA.length
4. `equipment_test_software` — EQUIPMENT_TEST_SOFTWARE_SEED_DATA.length
5. `disposal_requests` — DISPOSAL_REQUESTS_SEED_DATA.length
6. `checkout_items` — CHECKOUT_ITEMS_SEED_DATA.length (FK 파생이지만 명시적 체크 권장)
7. `calibration_plan_items` 상태별 분포 (기존 plans 만 상태 체크, items 는 count 만)

작업:
1. apps/backend/src/database/utils/verification.ts 에 누락된 6~7 개 checkCount 호출 추가
2. 각 seed 파일 import 추가
3. 재시드 → 전체 PASS 확인

검증:
- pnpm --filter backend exec npx ts-node src/database/seed-test-new.ts → "Summary: N/N checks passed"
- 수치가 drift 되면 자동 실패 (SSOT 원칙)
```

### 🟢 LOW — WF-25 spec D-day 배지 soft assertion 보강 (Mode 0)

```
apps/frontend/tests/e2e/workflows/wf-25-alert-to-checkout.spec.ts 는 현재
알림 → 장비 상세 → checkouts/create prefill 까지는 검증하지만, 장비 상세 페이지의
EquipmentStickyHeader calibrationStatus 배지 (D-7/D-30/기한 초과) 는 검증하지 않는다
(주석 8)번에 의도적 생략 명시).

본 cross-flow 가 "alerts 의 교정 임박 신호 → 장비 상세의 교정 강조 시각 신호" 일관성을
cover하려면 soft assertion 추가가 필요하다.

작업:
1. 장비 상세 페이지 진입 후, calibrationStatus 배지 locator 확인 (D-\d+ 또는 기한 초과)
2. `if (await badge.count() > 0) await expect(badge).toBeVisible()` 형태의 soft 검증 추가
3. 배지가 없는 경우(일반 상태)는 skip 하지 않고 통과 (soft 성격 유지)

검증:
- pnpm --filter frontend exec playwright test wf-25-alert-to-checkout --project=chromium 통과 유지
- tech-debt-tracker.md 해당 항목 해결 처리
```

### 🟡 MEDIUM — WF-33 SSE 다탭 승인 카운트 동기화 E2E (Playwright)

```
critical-workflows.md WF-33 신규 등재. features/notifications/notification-realtime.spec.ts 가
**알림 배지** 의 cross-tab 갱신은 cover하지만, **승인 대시보드 카운트** 의 cross-tab 갱신
(REFETCH_STRATEGIES CRITICAL/IMPORTANT 전략) 은 cover되지 않는다.

작업:
1. apps/frontend/tests/e2e/workflows/wf-33-approval-count-realtime.spec.ts
2. 시나리오:
   a. TM 로그인, 두 BrowserContext (또는 두 page) 모두 /admin/approvals 진입
   b. 양쪽 모두 초기 대기 카운트 N 캡처
   c. 페이지A 에서 1건 승인 → 토스트, A 카운트 N-1 검증
   d. 페이지B 에서 자동 갱신 대기 (focus 이벤트 트리거 또는 SSE 30s — REFETCH_STRATEGIES.CRITICAL 인 경우 SSE)
   e. 페이지B 카운트가 N-1 로 갱신되는지 검증 (timeout 35s 이내)
3. SSE 미사용 카테고리(IMPORTANT 2m 폴링)는 spec 분리 또는 폴링 강제 트리거

확인 필요:
- apps/frontend/lib/api/query-config.ts 또는 refetch-strategies 파일에서 approvals 카테고리가
  어느 전략(CRITICAL/IMPORTANT)인지 먼저 grep — 그에 따라 대기 전략 변경

검증:
- pnpm --filter frontend exec playwright test wf-33-approval-count-realtime exit 0
- 회귀: features/notifications/notification-realtime.spec.ts 통과 유지
```

---

## 31차 신규 — Export spec API-only 갭 + WF-21 후속 + 보안 (5건)

### 🔴 CRITICAL — Form Template Export site scope bypass (다중 exporter 공통 보안 갭)

```
배경: 31차 review-architecture에서 발견 (WF-21 spec이 ?site=suwon 을 명시 호출한 첫 케이스라
가시화됨). form-template-export.service.ts의 다수 exporter 가 `params.site || scope?.site`
패턴을 사용 — JS 단락 평가상 **쿼리 파라미터가 서버 scope를 덮어쓴다**.

위협 시나리오:
- suwon 사이트로 scope된 사용자가 GET /api/reports/export/form/UL-QP-18-08?site=incheon
  요청 → exporter는 scope 무시하고 incheon 데이터로 XLSX 반환
- 동일 패턴이 다른 양식(QP-18-01/05 등) exporter에도 5+ 곳 존재 가능 — grep 필요

⚠️ 부분 완화 현황 (Defense-in-depth 갭):
- CableListContent.tsx:110 — 프론트엔드는 `if (user?.site) params.site = user.site;`
  로 자기 사이트만 자동 전송 → 일반 클릭 동선으로는 노출 안 됨
- 그러나 사용자가 fetch/curl/Postman 으로 직접 호출하면 우회 가능 → 백엔드 단의 정정이
  여전히 필수 (CLAUDE.md Rule 2 정신: 클라이언트 신뢰 금지)
- 다른 양식 export 페이지의 프론트엔드도 동일하게 user.site 강제하는지 grep 필요
- CLAUDE.md Rule 2 (Server-Side User Extraction) 와 동일한 정신 위반:
  클라이언트가 보낸 값으로 권한을 확장할 수 있어서는 안 됨

확인 필요:
- form-template-export.service.ts grep `params.site || scope` / `params.site ?? scope`
  → 모든 exporter 헤드 위치 식별
- _resolveReportScope (reports.controller.ts) 가 admin / 비scoped 사용자에게
  어떻게 동작하는지 (admin 은 scope?.site === undefined 이어야 params.site 가 의미 있음)
- params.teamId 도 동일 패턴인지 검토

작업:
1. form-template-export.service.ts 내 모든 exporter에서 site 우선순위 역전:
   `const siteFilter = scope?.site ?? params.site;` (서버 scope 우선)
2. teamId 도 동일하게 `scope?.teamId ?? params.teamId` 로 변경
3. 음성 테스트 추가:
   - apps/backend/test 또는 e2e — suwon-scoped 사용자 + ?site=incheon → 결과가 suwon 데이터
4. WF-21 spec 에 회귀 케이스 1건 추가: scoped 사용자가 다른 site 요청 시 cross-site 누출 0
5. 정책 결정 필요: silent override (scope 강제) vs 403 reject — 다른 controller/guard 와 일관성
   우선 (현재 monitoring/audit 등이 어떻게 처리하는지 확인 후 결정)

검증:
- pnpm --filter backend exec tsc --noEmit exit 0
- pnpm --filter backend run test exit 0
- grep "params.site || scope\\|params.site ?? scope" apps/backend/src/modules/reports
  → 0 hit (또는 모두 역전된 형태)
- 회귀: 기존 export spec (wf-19b/20b/21) 통과 유지

⚠️ 보안 패치이므로 별도 PR + 위험 작업 표 (CLAUDE.md) 에 준해 브랜치 사용 권장.
정책 영향이 크므로 silent override vs reject 결정을 사용자에게 먼저 확인할 것.
```

---

## 31차 신규 — Export spec API-only 갭 + WF-21 후속 (4건)

> **갭 발견 배경 (2026-04-08, 31차)**: WF-21 cable path loss spec을 wf-19b/wf-20b 패턴 답습해 작성한 결과 API-only로 정착. 사용자 피드백: "테스트 후 어떤 UI가 검증되었는지 항상 설명해라"
> → 스캔 결과 wf-19b/wf-20b/wf-21 3개 export spec 모두 사용자가 누르는 "내보내기" 버튼 동선이 0건 검증된 상태. 패턴화된 회귀 위험.
> 또한 WF-21 자체의 케이블 등록 다이얼로그/측정 폼 다이얼로그도 미검증 (기존 spec은 백엔드 API만 호출).

### 🟠 HIGH — WF-21 UI 동선 검증 spec (등록 페이지 + 측정 다이얼로그 + 상세 렌더링)

```
방금 추가된 wf-21-cable-path-loss.spec.ts (31차)는 백엔드 API만 검증한다.
사용자가 화면에서 보고/누르는 다음 UI 동선은 하나도 cover되지 않는다.

⚠️ 작업 시작 전 필수 사전 확인 (잘못된 가정 방지):
- 등록 UI: **별도 페이지** /cables/create 로 이동 (다이얼로그 아님)
  - 라우트: FRONTEND_ROUTES.CABLES.CREATE = '/cables/create'
  - 컴포넌트: apps/frontend/app/(dashboard)/cables/create/CreateCableContent.tsx
- 측정 추가 UI: **다이얼로그** apps/frontend/components/cables/MeasurementFormDialog.tsx
- 모든 라벨이 i18n: useTranslations('cables') — getByText 시 라벨 하드코딩 금지,
  apps/frontend/messages/ko.json 의 cables 네임스페이스를 먼저 grep해서 실제 한국어 라벨 확정 후 사용
- 목록 컴포넌트: apps/frontend/app/(dashboard)/cables/CableListContent.tsx
- 상세 컴포넌트: apps/frontend/app/(dashboard)/cables/[id]/CableDetailContent.tsx

미검증 동선 (이 spec이 cover해야 함):
- /cables 목록 페이지 렌더링 (페이지 타이틀, 표 헤더, 행, 빈 상태)
- 검색 input + connectorType/status Select 필터 → URL params 반영
- "케이블 등록" 버튼(getByRole link/button) 클릭 → /cables/create 페이지 이동
- /cables/create 폼 필드 입력 (관리번호 / 길이 / connectorType / 주파수 min/max / 시리얼 / 위치 / site)
- 빈 관리번호 등 잘못된 입력 → 한국어 유효성 메시지 (VM.required / VM.string.max)
- "저장" 클릭 → 성공 토스트 → /cables 또는 /cables/[id] 리다이렉트
- 목록 검색에 관리번호 입력 → 행 보임 → 행 내 관리번호 링크 클릭 → /cables/[id] 진입
- 상세 페이지 헤더에 관리번호 / 커넥터 / 주파수범위 표시
- "측정 추가" 버튼 클릭 → MeasurementFormDialog (getByRole('dialog')) 열림
- 측정일 입력, Freq/Loss 데이터 포인트 행 추가, 저장 → 토스트 + 측정 이력 카드 즉시 반영
- 목록 "내보내기" 버튼 → page.waitForEvent('download') 트리거 (XLSX 파일명 검증)

작업:
1. apps/frontend/tests/e2e/workflows/wf-21-cable-ui.spec.ts 신규
2. fixture: testOperatorPage (../shared/fixtures/auth.fixture)
3. 시나리오 (mode: 'serial', step별 분리 — wf-19/wf-20 패턴):
   Step 1: 목록 페이지 진입 + 헤더/표/필터 가시성
   Step 2: "케이블 등록" 클릭 → /cables/create 이동 검증
   Step 3: 폼 빈 제출 → 한국어 에러 메시지
   Step 4: 정상 입력 → 저장 → 토스트 → 리다이렉트
   Step 5: 목록 검색 → 새 케이블 행 → 클릭 → 상세
   Step 6: 상세 헤더 검증
   Step 7: "측정 추가" → 다이얼로그 → 입력 → 저장 → 측정 카드 반영
   Step 8: 목록 복귀 → "내보내기" 버튼 → download 이벤트
   afterAll: API로 생성된 케이블 hard delete (또는 status retired) + cleanupSharedPool

규칙:
- CSS 셀렉터 금지 (메모리 규칙). getByRole / getByText / getByLabel 만 사용
- 라벨 텍스트는 messages/ko.json 에서 그대로 가져와야 함 — 추측 금지
- 도메인 데이터 fabricate 금지: 관리번호 ELLLX-NNN, dB는 더미 0.5/1.0 등
- WF-21 API spec과 격리: 다른 관리번호 슬롯 사용 (충돌 방지)
- frontend dev server 상태: playwright config 에 webServer 설정 있는지 먼저 확인.
  없으면 사용자에게 개발 서버 기동 요청

검증:
- pnpm --filter frontend exec playwright test wf-21-cable-ui --project=chromium exit 0
- pnpm --filter frontend exec tsc --noEmit exit 0
- 회귀: wf-21-cable-path-loss.spec.ts (API spec) 통과 유지
- find apps/frontend/tests/e2e -iname '*cable*' → 2 hits (API + UI)
- 라벨 확정 출처: messages/ko.json 의 "cables.list.title", "cables.list.createButton",
  "cables.list.exportButton" 등 — 실제 키는 코드 grep으로 확정
```

### 🟠 HIGH — WF-21 권한 가시성 spec (TE/TM/QM/LM 역할별 버튼 노출)

```
WF-21 cable path loss UI에서 역할별로 어떤 액션이 노출/숨김/disabled 되는지 검증되지 않음.
permissions/comprehensive/ 트리에 cable 권한 spec 0건 (find -iname '*cable*' 결과 없음).

확인 필요한 권한 매트릭스:
- VIEW_CALIBRATIONS (목록/상세 진입 가능 역할)
- UPDATE_CALIBRATION (등록/수정/측정 추가 가능 역할)
- 폐기/retire 액션은 누가? (CablesService 코드 grep 필요)

작업:
1. apps/frontend/tests/e2e/permissions/cable-permissions.spec.ts 신규
2. 각 역할로 storageState 로드 후 /cables 진입:
   - test_engineer: 등록 버튼 visible, 행 측정 추가 visible
   - quality_manager: 등록 visible? (UPDATE_CALIBRATION 보유 여부 grep 후 확정)
   - technical_manager: 등록 visible
   - lab_manager: 동상
   - (만약 read-only 역할이 있다면) 등록 버튼 not visible
3. 권한 없는 역할이 직접 URL로 /api/cables POST 호출 → 403 검증 (페이지 접근과 별개)

확인 코드:
- packages/shared-constants/src/role-permissions.ts — 각 역할의 UPDATE_CALIBRATION 보유 여부
- apps/backend/src/modules/cables/cables.controller.ts — @RequirePermissions 데코레이터

검증:
- pnpm --filter frontend exec playwright test cable-permissions --project=chromium exit 0
- 회귀: 다른 permissions/* spec 통과 유지
```

### 🟡 MEDIUM — Export 다운로드 UX 검증 spec (wf-19b/20b/21 공통 갭)

```
3개 export spec (wf-19b-intermediate-inspection-export, wf-20b-self-inspection-export,
wf-21-cable-path-loss) 모두 page.request.get 으로 API 응답만 검증한다.
**사용자가 화면에서 클릭하는 "내보내기" 버튼 → 브라우저 다운로드 트리거** 동선은
0건 검증.

미검증 항목:
- 목록/상세 페이지의 "내보내기" 버튼/드롭다운 가시성
- 클릭 시 download 이벤트 발생 (page.waitForEvent('download'))
- Content-Disposition filename* UTF-8 인코딩이 OS에 도달했을 때 한국어 깨짐 없음
- 다운로드 진행 토스트/스피너
- 에러 시 (404/500) 사용자 피드백 토스트

작업:
1. apps/frontend/tests/e2e/workflows/wf-export-ui.spec.ts 신규 (3개 양식 통합 또는 spec 분리)
2. 시나리오 per 양식 (UL-QP-18-03 / UL-QP-18-05 / UL-QP-18-08):
   a. 데이터 prerequisite 확보 (API로 1건 생성 — 기존 helper 재사용)
   b. 해당 목록 페이지 (/equipment/[id] 또는 /cables) 진입
   c. "내보내기" 버튼 클릭 (getByRole('button', { name: /내보내기/ }))
   d. const downloadPromise = page.waitForEvent('download'); await button.click();
   e. const download = await downloadPromise;
   f. expect(download.suggestedFilename()).toMatch(/UL-QP-18-(03|05|08)/)
   g. 한국어 파일명 깨짐 검증 (filename에 한글 포함 시 정상 디코딩)
   h. 다운로드 path 저장 후 파일 크기 > 1KB
3. 회귀 보호: 기존 wf-19b/20b/21 export API spec은 그대로 유지

확인 필요:
- 각 페이지 컴포넌트의 export 트리거 위치
  (CableListContent.tsx, IntermediateInspectionTab.tsx, SelfInspectionTab.tsx)
- 버튼이 양식별 select dropdown인지 단일 버튼인지

검증:
- pnpm --filter frontend exec playwright test wf-export-ui --project=chromium exit 0
- 회귀: wf-19b/20b/21 통과 유지
- 다운로드 임시 디렉토리 정리 (test.afterAll)
```

### 🟡 MEDIUM — Export spec UI 갭 패턴 가드 (verify-* 스킬 보강)

```
배경: 31차에서 wf-19b/20b/21 3개 export spec이 모두 API-only로 정착한 패턴이 발견됨.
앞으로 추가될 export spec (UL-QP-18-04/06/07/09/11 등 미작성 양식)도 동일 함정에 빠질
위험. verify-e2e 또는 verify-workflows 스킬에 가드 추가 필요.

작업:
1. .claude/skills/verify-e2e/SKILL.md (또는 verify-workflows) 에 새 체크 추가:
   - "export 키워드 + page.request.get 만 사용하는 spec은 동일 양식의 UI 다운로드 spec
     동행 여부 확인" 룰
   - grep 패턴: spec 파일 내 'export/form/UL-QP-18' 등장 + 'waitForEvent("download")' 부재
     → WARN
2. 또는 manage-skills 워크플로로 신규 verify-export-ui-coverage 스킬 생성
3. tech-debt-tracker.md에 "Export UI 다운로드 동선 미검증 양식" 누적 트래킹 항목 추가

검증:
- /verify-e2e (또는 신규 스킬) 실행 시 wf-19b/20b/21 3건이 WARN으로 보고됨
- 위 'WF-21 UI 동선 검증 spec'과 'Export 다운로드 UX 검증 spec' 추가 후 WARN 0건
- 메타 변경이므로 tsc/test 영향 없음

선택: 단순 docs/development/E2E_PATTERNS.md 에 "export spec은 API + UI 다운로드 한 쌍으로
작성" 가이드라인 명시만 해도 가능 (스킬 보강 vs 문서화 — 사용자 결정 필요)
```

---

## 현재 미해결 프롬프트: 3건 (29차 이월 1건 + 30차 후속 2건)

> **30차 처리 (2026-04-08)**: #6 self-inspections CAS 통일 ✅ PASS, #7 Docker Node 20 LTS ✅ 완료, #8 setQueryData → false positive
> **30차 후속 등재**: review-architecture/verify-security에서 발견한 dormant code path + hardening gap 2건

### ~~🟠 HIGH — self-inspections.service.ts CAS 중복 구현~~ ✅ 완료 (30차)

> 30차 (2026-04-08). VersionedBaseService 상속으로 전환, update()/confirm() updateWithVersion 사용,
> confirm() transaction wrap, 테스트 mock 갱신 (CAS 경로 변경 반영). 473/473 PASS.

### ~~🟠 HIGH — Docker Node 18 → 20 LTS~~ ✅ 완료 (30차)

> 30차 (2026-04-08). backend.Dockerfile/frontend.Dockerfile FROM 라인 변경.
> engines 필드는 이미 >=20.18.0 였음 (drift 상태였던 것).

### ~~🟡 MEDIUM — use-management-number-check setQueryData~~ ❌ False Positive (30차)

> 30차 (2026-04-08). 검증 결과: useOptimisticMutation 안이 아닌 일반 prefetch 패턴.
> 캐시 키 타입(useQuery line 79, ManagementNumberCheckResult|null) = setQueryData 값 타입 동일.
> CLAUDE.md 규칙은 useOptimisticMutation onSuccess 한정. 코드 변경 없음.

### 🟠 HIGH — 자체점검 update/confirm UI 미구현 (백엔드 CAS dormant) (Mode 1)

```
30차 (2026-04-08) review-architecture에서 발견. 백엔드 self-inspections CAS는 완벽히
구현/검증되었으나 (commit a7c276bd), 프론트엔드 사용자 동선에서 update/confirm을 호출하는
컴포넌트가 존재하지 않는다.

확인된 현황:
- apps/frontend/lib/api/self-inspection-api.ts:104,112 — updateSelfInspection/confirmSelfInspection 정의됨
- apps/frontend/components/equipment/SelfInspectionFormDialog.tsx — create 전용
- apps/frontend/components/equipment/SelfInspectionTab.tsx — read-only
- apps/frontend/tests/e2e/.../workflow-helpers.ts:1081,1101 — E2E helper만 호출
- 사용자가 UI에서 자체점검 수정/확인 시 → 동작 불가 (호출 진입점 없음)

작업:
1. SelfInspectionFormDialog를 create/edit 겸용으로 확장 (mode prop 추가) 또는
   별도 SelfInspectionEditDialog 신규
2. SelfInspectionTab에 행별 "수정"/"확인" 버튼 + 권한 체크 (UPDATE_CALIBRATION,
   confirmedBy 권한)
3. useOptimisticMutation 사용 — confirm은 status 'completed' → 'confirmed' 단방향
4. VERSION_CONFLICT 처리: getLocalizedErrorInfo(EquipmentErrorCode.VERSION_CONFLICT)
   + 상세 캐시 삭제 후 refetch (CLAUDE.md CAS 규칙)
5. 캐시 무효화: queryKeys.equipment.selfInspections(equipmentId) +
   EquipmentCacheInvalidation 교차 무효화
6. confirmed 상태에서는 수정/삭제 버튼 비활성 (백엔드 ALREADY_CONFIRMED 가드 미러링)

검증:
- pnpm --filter frontend exec tsc --noEmit exit 0
- pnpm --filter frontend run test exit 0
- E2E: workflow-helpers.ts의 자체점검 update/confirm flow가 새 UI를 통해 동작
  (helper에서 API 직접 호출 → page object 경유로 마이그레이션 검토)
- /verify-frontend-state, /verify-cas 통과
```

### 🟡 MEDIUM — Dockerfile USER 미선언 (root 실행 hardening) (Mode 0)

```
30차 (2026-04-08) verify-security에서 발견 (pre-existing). 두 Dockerfile 모두 USER
디렉티브가 없어 모든 stage가 root로 실행된다. CIS Docker Benchmark 4.1 위반.

확인된 파일:
- docker/backend.Dockerfile (alpine, 5 stages: base/deps/development/builder/production)
- docker/frontend.Dockerfile (slim, 5 stages: base/deps/development/builder/production)

node:20-alpine은 기본 'node' user를 제공 (uid 1000). slim도 동일.

작업:
1. backend.Dockerfile production stage 끝부분에 USER node 추가
   - WORKDIR /app 소유권을 node:node로 chown (COPY --chown=node:node)
2. frontend.Dockerfile production stage 동일
3. development stage는 volume mount 권한 충돌 가능 — production만 적용 권장
4. CMD/ENTRYPOINT가 :80/:443 등 privileged port 사용 안 하는지 확인 (현재 3000/3001 → OK)

검증:
- docker compose -f docker-compose.prod.yml build (가능 시)
- docker run --rm -it <image> id → uid=1000(node) gid=1000(node)
- 컨테이너 내부에서 /app 쓰기 가능 (logs/uploads 디렉토리 권한)
- pnpm tsc --noEmit / test 무관 (Dockerfile만 변경)

선택: development stage도 USER node 시 docker-compose volume mount 시 host UID 매핑
필요 → 별도 작업으로 분리 가능
```

### 🟠 HIGH — UL-QP-19-01 exporters map 누락 (런타임 NotImplementedException) (Mode 0)

```
packages/shared-constants/src/form-catalog.ts:121-129 에서 'UL-QP-19-01'이
implemented: true 로 마킹되어 있지만, apps/backend/src/modules/reports/form-template-export.service.ts:110-122
의 exporters Record에는 해당 키가 등록되어 있지 않다 (UL-QP-18-10이 마지막).

이 상태로는 사용자가 UL-QP-19-01 export 요청 시 controller가 isImplemented(formNumber) → true 로 통과한 뒤
exporters[formNumber]가 undefined → 런타임 NotImplementedException 또는 빈 응답으로 폴백된다.

옵션 A: UL-QP-19-01 exporter 구현 (procedure 원문 확인 후 — fabricate 금지)
옵션 B: form-catalog.ts에서 implemented: false 로 임시 강등 + tech-debt 트래커 등록

작업 전 사용자에게 어느 옵션인지 확인할 것. 도메인 데이터를 임의로 만들면 안 됨.

검증:
- pnpm --filter backend exec tsc --noEmit exit 0
- pnpm --filter backend run test exit 0
- 옵션 A: form-template-export.service.ts에 exportXxx 메서드 + exporters[formNumber] 등록
- 옵션 B: form-catalog.ts UL-QP-19-01 implemented: false, isImplemented() 테스트 추가
```

### 🟠 HIGH — self-inspections.service.ts CAS 중복 구현 (VersionedBaseService 미상속) (Mode 1)

```
apps/backend/src/modules/self-inspections/self-inspections.service.ts:25 가 VersionedBaseService를
상속하지 않고 수동으로 CAS를 구현하고 있다 (lines 185-192, 235, 295-302, 304-319).
다른 12개 서비스(checkouts, calibration, equipment, disposal 등)는 모두 base class의
updateWithVersion<T>() 헬퍼를 사용해 atomic check+update 한다.

현재 패턴의 문제:
1. 라인 185 pre-check + 라인 235 WHERE eq(version) 분리 → 두 단계 사이에 race window 존재
2. createVersionConflictException() 수동 throw — 다른 서비스와 에러 메시지/코드 divergence 위험
3. confirm() (라인 304-319)는 transaction으로 감싸지지 않음. checkout.approve(line 1821), calibration.approve(line 1188)는 transaction 사용

작업:
1. SelfInspectionsService extends VersionedBaseService 로 변경
2. update()/confirm()의 manual CAS를 this.updateWithVersion<EquipmentSelfInspection>(...) 호출로 교체
3. confirm()의 status update + items reload 를 this.db.transaction()으로 감싸기

CAS 의미는 변경 금지 — 동일한 동시성 보장이어야 함.

검증:
- pnpm --filter backend exec tsc --noEmit exit 0
- pnpm --filter backend run test -- --grep "self-inspection" exit 0
- grep "extends VersionedBaseService" self-inspections.service.ts → 1 hit
- grep "updateWithVersion" self-inspections.service.ts → 2+ hits
- 회귀 0 (전체 backend test)
```

### 🟠 HIGH — Docker base image Node 18 → Node 20 LTS 업그레이드 (Mode 0)

```
docker/backend.Dockerfile:1 (FROM node:18-alpine)
docker/frontend.Dockerfile:1 (FROM node:18-slim)

Node 18은 2025-04-30 EOL 도달함 (현재 2026-04-08 기준 1년 지남).
보안 패치 미수신 + 일부 의존성(예: 최신 NestJS/Next.js)이 Node 20+ engines 요구.

작업:
1. 두 Dockerfile FROM line만 node:20-alpine / node:20-slim 으로 변경
2. multi-stage 내 모든 stage 동일 변경 (base 외 builder/runner 등 grep 후 일괄)
3. package.json engines 필드에 "node": ">=20.0.0" 명시 (없는 경우 추가)

검증:
- grep "node:18" docker/ → 0 hit
- grep "node:20" docker/ → 2+ hit
- pnpm --filter backend run build exit 0 (로컬 호환성 확인)
- pnpm --filter frontend run build exit 0
- (선택) docker compose build 통과
```

### 🟡 MEDIUM — use-management-number-check.ts setQueryData 안티패턴 (Mode 0)

```
apps/frontend/hooks/use-management-number-check.ts:135 에서 queryClient.setQueryData(...)를
직접 호출한다. CLAUDE.md Rule "useOptimisticMutation의 onSuccess에서 setQueryData 호출 금지
(TData ≠ TCachedData 75%)" 위반 가능 지점이다.

use-optimistic-mutation.ts:38, 280 본인 파일이 이 안티패턴을 명시적으로 금지하고 있는데
별도 hook이 같은 패턴을 우회한다.

작업:
1. line 135 setQueryData가 TData/TCachedData 일치하는지 검사 (Read 후 타입 확인)
2. 일치하면: 인라인 주석으로 의도 명시 + 타입 가드 추가
3. 불일치하면: invalidateQueries(queryKeys.management.check(value))로 교체

검증:
- pnpm --filter frontend exec tsc --noEmit exit 0
- 변경 후 관리번호 중복 체크 동작 직접 테스트(또는 기존 unit test 회귀)
- grep "setQueryData" use-management-number-check.ts → 0 hit (교체한 경우) or 주석 포함 1 hit
```

---

## 사용자 결정 대기 (1건)

### ❓ UL-QP-18-02 이력카드 form-catalog 플래그 vs endpoint 불일치

**상황:**
- `packages/shared-constants/src/form-catalog.ts:44-49` → UL-QP-18-02 `implemented: false`
- `packages/shared-constants/src/api-endpoints.ts:34` → `EQUIPMENT.HISTORY_CARD` endpoint 정의됨
- `form-template-export.service.ts` exporters map에는 UL-QP-18-02 키 없음

**질문:** UL-QP-18-02 (이력카드)는 별도 history-card endpoint로 출력하는 게 정책인가, 아니면 통합 form-template-export 경로로 합쳐야 하는가?
- A안: history-card 전용 경로 유지 → form-catalog 주석에 "별도 endpoint" 명시 (현 상태 유지, 문서화만)
- B안: form-template-export로 통합 → exporter 추가 + implemented: true 변경
- C안: 둘 다 유지 (중복 OK, 사용자가 양쪽 모두 호출 가능)

도메인 절차서(UL-QP-18) 기준 의도 확인 필요.

---

## False Positives (30차, 2026-04-08 — WF 후보 검증)

WF-22~37 등재 시 후보로 올랐으나 이미 features/ 트리에 spec 존재가 확인되어 신규 프롬프트 채택 제외:

| WF 후보 | 검증 결과 | 기존 spec |
|---|---|---|
| WF-22 인증 + 사이드바 가시성 | **이미 cover** | features/auth/auth.spec.ts, f2-role-permissions.spec.ts, permissions/comprehensive/sidebar-visibility.spec.ts |
| WF-23 권한 거부 (admin 라우트 + 액션 버튼) | **이미 cover** | permissions/comprehensive/page-access-control.spec.ts, equipment-crud-permissions.spec.ts, module-crud-permissions.spec.ts |
| WF-24 알림 드롭다운 + 페이지 + 읽음 | **이미 cover** | features/notifications/notification-dropdown.spec.ts, notification-list.spec.ts |
| WF-26 목록 필터/검색/페이지네이션 SSOT | **이미 cover** | equipment/list/group-c-search.spec.ts, group-c-pagination.spec.ts, group-e-url-state.spec.ts, group-g-ssot-verification.spec.ts |
| WF-27 사이트/팀 격리 | **이미 cover** | features/auth/site-data-isolation.spec.ts, f1-team-constraints.spec.ts |
| WF-32 감사 로그 조회 | **이미 cover** | features/admin/audit-logs/audit-logs.spec.ts |
| WF-28~31, 34, 36, 37 (양식/리포트/설정/팀/레이아웃/마이그/모니터링) | **부분 cover** | features/form-templates, reports, settings, teams, data-migration, admin/monitoring 트리에 spec 존재 — 신규 갭 식별 시 별도 프롬프트화 |

---

## False Positives (29차, 2026-04-08 스캔)

| 항목 | Agent | 검증 결과 |
|---|---|---|
| calibrations/non_conformances/equipment_imports/software_validations에 version 컬럼 없음 | C | **FALSE** — 4개 모두 `version: integer('version').notNull().default(1)` 존재 |
| disposal.controller.ts review/approve에 @AuditLog 없음 | A | **FALSE** — review:108, approve:147에 존재 |
| use-optimistic-mutation.ts:227 setQueryData 위반 | B | **FALSE** — onMutate 내부 optimistic update 컨텍스트(허용 패턴), 금지된 건 onSuccess만 |
| useState로 searchInput 관리(SSOT 위반) | B | **FALSE** (의심) — debounce input local state는 URL push와 별개의 일반 패턴, 필터 자체는 URL이 여전히 SSOT |

---

<details>
<summary>✅ 아카이브 — 완료된 프롬프트 (28차 세션, 2026-04-05)</summary>

### ~~🟠 HIGH — WF-17/18 E2E: 팀 스코프 테스트 데이터 조정~~ ✅ 완료

> 28차 (2026-04-05). workflow-helpers.ts 버그 4건 수정: startCheckout/returnCheckout PATCH→POST,
> 기본 role TE→TM, correctNonConformance API 경로. 장비 FCC EMC/RF 팀으로 변경.
> WF-17 5/5 PASS, WF-18 4/4 PASS.

### ~~🟠 HIGH — WF-19 E2E: 중간점검표 3단계 승인 + 반려~~ ✅ 완료

> 26차 (2026-04-05). wf-19-intermediate-inspection-3step-approval.spec.ts 생성.
> 9/9 PASS: draft→submitted→reviewed→approved + 반려 흐름.
> TE 권한 추가 (UPDATE_CALIBRATION), 교정 시드 고정 UUID (CALIB_001~003).

### ~~🟡 MEDIUM — WF-20 E2E: 자체점검표 확인 + 잠금~~ ✅ 완료

> 26차 (2026-04-05). wf-20-self-inspection-confirmation.spec.ts 생성.
> 7/7 PASS: 생성→수정→확인→잠금(수정/삭제 400)→권한(TE confirm 403).
> API 직접 생성 방식 — 시드 무의존.

### ~~🟡 MEDIUM — TE 교정 권한 검토: 중간점검 작성 권한 갭~~ ✅ 완료

> 26차 (2026-04-05). TE에게 UPDATE_CALIBRATION 추가 (role-permissions.ts).
> 절차서 기준 TE가 중간점검 점검자.

### ~~🟠 HIGH — E2E 시드 데이터: 교정 UUID 시딩~~ ✅ 부분 완료

> 26차 (2026-04-05). calibrations.seed.ts에 CALIB_001~003 고정 UUID 부여.
> WF-19 교정 시드 의존성 해결. WF-17/18 팀 스코프는 별도 프롬프트.

### ~~🟠 HIGH — API_ENDPOINTS.INTERMEDIATE_INSPECTIONS 미정의~~ ✅ 완료

> 25차 (2026-04-05). api-endpoints.ts에 INTERMEDIATE_INSPECTIONS 섹션 7개 엔드포인트 추가.

### ~~🟢 LOW — auth.controller.ts login/refresh @AuditLog 미적용~~ ✅ 완료

> 25차 (2026-04-05). login에 @AuditLog create, refresh에 @AuditLog update 추가.

### ~~🟠 HIGH — Frontend Dockerfile pnpm 버전 불일치~~ ✅ 완료

> 25차 (2026-04-05). pnpm@10.7.0 → 10.7.1 통일 (3곳).

### ~~🟡 MEDIUM — 새 라우트 error.tsx / loading.tsx 누락~~ ✅ 완료

> 25차 (2026-04-05). software/create/ error.tsx + loading.tsx 추가.

### ~~🟡 MEDIUM — 유효성확인 방법 1 공급자 첨부파일 + 수정 UI~~ ✅ 완료

> 커밋 fa466d99 (2026-04-05). ValidationDetailContent.tsx에 문서 첨부파일 Card 추가.

### ~~🟠 HIGH — UL-QP-18 절차서 준수 갭 해소~~ ✅ 완료

> PR #109 (2026-04-05). Harness Mode 2, MUST 15/15 PASS.

### SHOULD
- E2E CSS 셀렉터 → getByRole/getByText 전환 — pending-checks + create-equipment (2026-04-03, 10차)
- ReportsContent date-fns format → useDateFormatter 전환 (2026-04-03, 10차)

### ~~🟡 MEDIUM — 소프트웨어 관리대장 페이지네이션 + manufacturer 필터~~ ✅ 완료
### ~~🟡 MEDIUM — P0043 중복 관리번호 UNIQUE 제거~~ ✅ 완료
### ~~🟡 MEDIUM — 유효성확인 방법 1 receivedBy/receivedDate~~ ✅ 부분 완료
### ~~🟡 MEDIUM — AlertsContent aria-label~~ ✅ 완료
### ~~🟡 MEDIUM — Notifications @AuditLog + VIEW 퍼미션~~ ✅ 완료
### ~~🟡 MEDIUM — error.tsx / loading.tsx 루트별~~ ✅ 대부분 완료
### ~~🟠 HIGH — CI trivy-action + copilot-setup-steps~~ ✅ 완료
### ~~🟠 HIGH — UL-QP-18-03 중간점검표~~ ✅ 완료
### ~~🟠 HIGH — UL-QP-18-08 Cable/Path Loss~~ ✅ 완료
### ~~🟠 HIGH — 승인 대시보드 QM 누락~~ ✅ 완료 (이전 세션)
### ~~🟠 HIGH — test_software createdBy~~ ✅ 완료 (이전 세션)
### ~~🟠 HIGH — calibration_plans FK~~ ✅ 완료 (이전 세션)
### ~~🟠 HIGH — 유효성 확인 상세 뷰 + 반려~~ ✅ 완료 (이전 세션)
### ~~🟠 HIGH — 유효성확인 DB 컬럼 + 품질승인~~ ✅ 완료 (이전 세션)
### ~~🟠 HIGH — 장비 상세 탭 통합~~ ✅ 완료 (이전 세션)
### ~~🟠 HIGH — 장비↔시험용SW M:N 링크~~ ✅ 완료 (이전 세션)
### ~~🔴 CRITICAL — 소프트웨어 도메인 재설계~~ ✅ 완료 (PR #104)
### ~~🔴 CRITICAL — 담당자(정/부) JOIN + 폼 필드~~ ✅ 완료 (이전 세션)
### ~~🔴 CRITICAL — UL-QP-18-09 방법 2 프론트엔드~~ ✅ 완료 (이전 세션)
### ~~🔴 CRITICAL — 유효성확인 첨부파일 인프라~~ ✅ 완료 (이전 세션)

</details>

<details>
<summary>❌ False Positives — 누적 (22~26차)</summary>

### cables/intermediate-inspections 전용 Permission 분리 필요
> 사용자 판단: TE가 장비/교정/케이블 전부 조회·작성하는 게 기본 권한. 교정 권한 재사용 유지. FALSE POSITIVE (설계 의도).

### docker-compose.prod.yml postgres depends_on condition 누락
> 검증 결과: `condition: service_healthy` 명시 확인. FALSE POSITIVE.

### SELF_INSPECTIONS CREATE endpoint 누락
> BY_EQUIPMENT이 POST/GET 겸용 RESTful 패턴. FALSE POSITIVE.

### Cable enum / SelfInspection enum 미사용
> 프론트엔드 3파일 + 백엔드 DTO 2파일에서 사용 확인. FALSE POSITIVE.

### self-inspections delete() 캐시 무효화 누락
> 서비스에 캐시 인프라 자체가 없음. FALSE POSITIVE.

### SW-validations update/revise userId 미추출
> 이미 @Request() _req 있음. FALSE POSITIVE.

### Dockerfile COPY / history-card XML / console.log / 하드코딩 / FK 인덱스
> 모두 이전 세션에서 이미 수정 완료. FALSE POSITIVE (스캔 시점 차이).

### intermediate-checks API 미구현 (22차)
> calibration.controller.ts에 구현 확인. FALSE POSITIVE.

### software-validations update() 캐시 무효화 (22차)
> service에서 호출 확인. FALSE POSITIVE.

</details>
