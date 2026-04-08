# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-04-08 (30차 — critical-workflows.md UI 검증 보강 + WF-22~37 등재 후속, 신규 4건)**
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

### 🟡 MEDIUM — WF-25 alerts → 장비 상세 → 반출 신청 cross-flow E2E (Playwright)

```
critical-workflows.md WF-25 신규 등재. features/dashboard/comprehensive/alert-kpi.spec.ts 가
KPI 카드 표시는 cover하지만, 사용자가 alert 행을 클릭 → 장비 상세 → "반출 신청" 버튼 → 폼 prefill
까지 이어지는 cross-flow 는 미커버.

작업:
1. apps/frontend/tests/e2e/workflows/wf-25-alert-to-checkout.spec.ts
2. 시나리오:
   a. 시드: 다음 교정일이 임박한 장비 1건 보장 (calibrations.seed 확장 또는 spec 내 API 직접 갱신)
   b. TE 로그인 → /alerts (또는 / 대시보드 KPI)
   c. "교정 임박" 탭/카드 → 장비 행 클릭
   d. /equipment/[id] 진입 검증 (URL + 다음 교정일 강조 표시)
   e. "반출 신청" 버튼 클릭 → /checkouts/create?equipmentId=... 로 이동
   f. 폼이 해당 장비로 prefill 되었는지 검증 (장비 선택 필드의 값)
   g. 목적: "교정" 선택 → 제출 → pending 토스트
3. /alerts 페이지 컴포넌트 확인 후 셀렉터 확정 (apps/frontend/app/(dashboard)/alerts/AlertsContent.tsx)

검증:
- pnpm --filter frontend exec playwright test wf-25-alert-to-checkout exit 0
- prefill 검증은 input value assertion (browser_verify_value 또는 expect(input).toHaveValue)
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

## 현재 미해결 프롬프트: 4건 (29차 이월)

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
