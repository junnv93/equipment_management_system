# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-04-05 (23차 — WF E2E 커버리지 갭 분석 후 프롬프트 추가)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용. `/playwright-e2e` 로 E2E 프롬프트 실행.

---

## 현재 미해결 프롬프트: 14건 (기존 10건 + E2E 4건)

### 🟠 HIGH — software-validations update/revise userId 미추출 (Mode 0)

```
문제:
software-validations 컨트롤러의 update, revise 엔드포인트에서
@Request() 파라미터가 없어 userId를 서버에서 추출하지 않음.
AuditLog 인터셉터가 req.user를 자동으로 사용하지만,
서비스 레이어에서 "누가 수정했는지" 추적 불가.

검증됨:
- software-validations.controller.ts:109-113 — update() @Request() 없음
- software-validations.controller.ts:192-196 — revise() @Request() 없음

액션:
1. update(): @Request() req 추가 + extractUserId(req) 서비스 전달
2. revise(): @Request() req 추가 + extractUserId(req) 서비스 전달

검증:
1. grep "extractUserId" software-validations.controller.ts → 2건 이상
```

### 🟠 HIGH — Dockerfile 프로덕션 빌드 차단 3건 (Mode 0)

```
문제:
백엔드 Dockerfile이 존재하지 않는 패키지를 COPY하고 pnpm 버전 불일치.

검증됨:
- apps/backend/docker/Dockerfile:19,56,85 — packages/api-client, packages/ui COPY → 존재하지 않는 패키지
- apps/backend/docker/Dockerfile — packages/shared-constants COPY 누락
- apps/backend/docker/Dockerfile:9,49,79 — pnpm@9.12.3 → package.json은 pnpm@10.7.1

액션:
1. packages/api-client, packages/ui COPY 제거
2. packages/shared-constants/package.json COPY 추가 (3개 stage)
3. pnpm 버전 10.7.1 통일

검증:
1. docker build -f apps/backend/docker/Dockerfile . → 성공
```

### 🟠 HIGH — history-card.service.ts XML 이스케이프 누락 (Mode 0)

```
문제:
이력카드 docx 생성 시 DB 데이터를 XML에 직접 삽입하여 특수문자(&, <, >) 미이스케이프.
사용자 입력에 XML 특수문자가 포함되면 docx 파일이 깨짐.

검증됨:
- history-card.service.ts:169-174 — `<w:t>${String(item[k] ?? '-')}</w:t>` XML 이스케이프 없음
- history-card.service.ts:180-184 — heading, para 헬퍼도 동일

액션:
1. XML 이스케이프 헬퍼 함수 추가 (& → &amp;, < → &lt;, > → &gt;, " → &quot;)
2. buildTemplateXml 내 모든 사용자 데이터에 적용

검증:
1. 장비명에 "Test & <Equipment>" 입력 후 이력카드 다운로드 → 정상 열림
```

### 🟡 MEDIUM — LocationHistoryTab console.log 3건 제거 (Mode 0)

```
문제:
LocationHistoryTab에 디버깅용 console.log가 프로덕션 코드에 남아있음.

검증됨:
- LocationHistoryTab.tsx:85 — console.log('[LocationHistoryTab] 세션 상태:', ...)
- LocationHistoryTab.tsx:187 — console.log('[LocationHistoryTab] 위치 변동 등록 요청:', ...)
- LocationHistoryTab.tsx:217 — console.log('[LocationHistoryTab] 권한 체크:', ...)

액션:
1. 3개 console.log 제거

검증:
1. grep -r "console.log" apps/frontend/components/equipment/LocationHistoryTab.tsx → 0건
```

### 🟡 MEDIUM — 새 모듈 하드코딩 문자열 3건 + aria-label 1건 (Mode 0)

```
문제:
21차 하네스에서 생성된 새 컴포넌트에 하드코딩된 문자열과 aria-label 누락.

검증됨:
- InspectionFormDialog.tsx:217 — placeholder="e.g. 6 months" (영어 하드코딩)
- InspectionFormDialog.tsx:225 — placeholder="e.g. 2026-12-31" (영어 하드코딩)
- InspectionRecordsDialog.tsx:160 — placeholder="반려 사유" (한국어 하드코딩)
- MeasurementFormDialog.tsx:191 — Trash2 아이콘 버튼 aria-label 누락

액션:
1. InspectionFormDialog: placeholder를 i18n 키로 교체
2. InspectionRecordsDialog: "반려 사유" → t('intermediateInspection.rejectionReasonPlaceholder')
3. MeasurementFormDialog: aria-label 추가
4. i18n 키 en/ko calibration.json, cables.json에 등록

검증:
1. pnpm --filter frontend run tsc --noEmit → 0
2. grep -r "e\.g\." apps/frontend/components/calibration/ → 0건
3. grep -r '"반려' apps/frontend/components/ → 0건
```

### 🟡 MEDIUM — cables/intermediate-inspections 미사용 파라미터 정리 (Mode 0)

```
문제:
새 모듈의 서비스에서 _createdBy, _userId 파라미터가 선언만 되고 미사용.
cables 테이블에 createdBy 컬럼 자체가 없어 추적 불가.

검증됨:
- cables.service.ts:49 — create(dto, _createdBy: string) 미사용
- cables.service.ts:196 — update(id, dto, _userId: string) 미사용
- intermediate-inspections.service.ts:191 — update(id, dto, _userId: string) 미사용

액션:
1. cables 테이블에 createdBy: uuid FK 추가 (또는 파라미터 제거 — 사용자 판단)
2. update 메서드의 _userId 파라미터 활용 또는 제거

검증:
1. grep -r "_createdBy\|_userId" apps/backend/src/modules/cables/ → 0건
```

### 🟡 MEDIUM — 새 라우트 error.tsx / loading.tsx 누락 (Mode 0)

```
문제:
최근 추가된 라우트에 에러 바운더리/로딩 스켈레톤 누락.

검증됨:
- software/[id]/validation/ — error.tsx, loading.tsx 없음
- software/[id]/validation/[validationId]/ — error.tsx, loading.tsx 없음
- cables/create/ — error.tsx, loading.tsx 없음
- checkouts/import/[id]/ — error.tsx 없음

액션:
1. 4개 라우트에 error.tsx (RouteError 패턴) 추가
2. 3개 라우트에 loading.tsx (Skeleton 패턴) 추가

검증:
1. glob apps/frontend/app/(dashboard)/**/error.tsx → 새 라우트 포함 확인
```

### 🟡 MEDIUM — 새 테이블 FK 인덱스 누락 (Mode 0)

```
문제:
새로 생성된 intermediate_inspections, cables 테이블의 FK 컬럼에 인덱스 누락.
JOIN/조회 성능에 영향.

검증됨:
- intermediate-inspections.ts — inspectorId, submittedBy, reviewedBy, approvedBy, rejectedBy, createdBy 인덱스 없음
- cables.ts — measuredBy 인덱스 없음

액션:
1. intermediate_inspections: 필수 FK 인덱스 추가 (inspectorId, createdBy — 나머지는 빈도 낮아 선택적)
2. cables: measuredBy 인덱스 추가

검증:
1. pnpm tsc --noEmit → 0
```

### 🟡 MEDIUM — 유효성확인 방법 1 누락 필드(receivedBy/receivedDate) + 공급자 첨부파일 + 수정 UI (Mode 1)

```
문제:
방법 1(공급자 시연) 양식에서 receivedBy/receivedDate 입력 UI는 추가되었으나,
실제 파일 첨부(공급자 자료 스캔/첨부) 기능은 아직 미구현.
첨부파일 인프라(documents 테이블)와의 연동 필요.

  ※ 선행 조건 상태: "유효성확인 첨부파일 인프라" 완료됨

액션:
1. vendor 폼에 첨부파일 업로드 영역 추가 (ValidationAttachments 컴포넌트 활용)
   documentType: 'validation_vendor_attachment'
2. Edit 시 기존 첨부파일 목록 표시 + 추가/삭제 가능
3. submitted 이후 첨부파일 읽기 전용

검증:
1. 공급자 자료 파일 첨부 → 업로드 성공 → 목록 표시
2. draft 양식 수정 → 저장 동작 (첨부파일 포함)
3. submitted 이후 첨부파일 읽기 전용
```

### 🟢 LOW — auth.controller.ts login/refresh @AuditLog 미적용 (Mode 0)

```
문제:
login, azure-login, refresh 엔드포인트에 @AuditLog 없음.
logout에만 적용됨. 인증 이벤트 감사 추적 갭.

검증됨:
- auth.controller.ts:27 — @Post('login') — @AuditLog 없음
- auth.controller.ts:34 — @Get('azure-login') — @AuditLog 없음
- auth.controller.ts:86 — @Post('refresh') — @AuditLog 없음
- auth.controller.ts:63 — @Post('logout') — @AuditLog 있음 ✓

액션:
1. login: @AuditLog({ action: 'create', entityType: 'auth' }) 추가
2. refresh: @AuditLog({ action: 'update', entityType: 'auth' }) 추가
3. (azure-login은 Guard redirect이므로 별도 판단)

검증:
1. 로그인/로그아웃 시 감사 로그 생성 확인
```

---

## E2E 워크플로우 테스트 프롬프트: 4건

> **근거:** `docs/workflows/critical-workflows.md` WF-17~WF-20 대비 E2E 커버리지 갭.
> 기존 WF-01~WF-16은 `apps/frontend/tests/e2e/workflows/` 에 전용 spec 파일 존재.
> `/playwright-e2e` 로 실행하여 시드 데이터 + 헬퍼 함수 + spec 파일을 생성.

### 🟡 MEDIUM — WF-17 E2E: 반출 기한 초과 overdue 전이 + 반입 처리 (Playwright)

```
문제:
WF-17 워크플로우(반출 기한 초과 → overdue 자동 전이)에 대한 전용 워크플로우 E2E 테스트 없음.
기존 suite-17 feature 테스트는 UI 읽기 전용(시드 데이터 기반)이며,
실제 상태 전이 검증과 overdue 상태에서의 반입 처리 흐름이 누락.

검증됨:
- apps/frontend/tests/e2e/workflows/ — wf-17-*.spec.ts 미존재
- suite-17-overdue/s17-overdue-scenarios.spec.ts — parallel mode, 읽기 전용
- CheckoutOverdueScheduler는 서버 사이드이므로 E2E에서 직접 트리거 불가

구현 전략:
CheckoutOverdueScheduler를 직접 테스트할 수 없으므로,
API로 DB 상태를 직접 설정(expectedReturnDate 과거일 + checked_out)한 뒤
overdue 시나리오 후속 워크플로우(반입 처리)를 검증.

액션:
1. workflow-helpers.ts에 추가:
   - createOverdueCheckout(): 반출 생성 → 승인 → 시작 → API로 expectedReturnDate 과거일 설정
   - markCheckoutOverdue(): API PATCH로 status=overdue 직접 전이 (테스트 전용)
2. shared-test-data.ts에 WF-17 전용 시드 상수 추가 (장비 UUID)
3. wf-17-checkout-overdue-return.spec.ts 생성:
   Step 1: TE가 반출 생성 → 승인 → 시작 (checked_out)
   Step 2: expectedReturnDate를 과거일로 API 설정
   Step 3: 장비 상태 checked_out 유지 확인 (overdue는 반출 상태)
   Step 4: TE가 반입 폼 작성 → 제출 (returned)
   Step 5: TM이 반입 승인 → 장비 available 복원

패턴 준수:
- auth.fixture.ts 기반 testOperatorPage / techManagerPage 사용
- test.describe.configure({ mode: 'serial' })
- CAS version 추출 후 PATCH
- clearBackendCache() 호출 후 상태 검증
- beforeAll/afterAll에서 resetEquipmentForWorkflow()

검증:
1. npx playwright test wf-17 --reporter=list → 5 Step 전체 PASS
```

### 🟠 HIGH — WF-19 E2E: 중간점검표 3단계 승인 + 반려 (Playwright)

```
문제:
WF-19 워크플로우(중간점검표 3단계 승인)에 대한 전용 워크플로우 E2E 테스트 없음.
기존 intermediate-check.spec.ts는 교정 인증서 UI 기능 테스트이며,
draft → submitted → reviewed → approved 전체 승인 흐름과 반려 경로 미검증.

검증됨:
- apps/frontend/tests/e2e/workflows/ — wf-19-*.spec.ts 미존재
- features/calibration/certificate/intermediate-check.spec.ts — UI 완료 다이얼로그만 테스트
- IntermediateInspectionsController에 8개 엔드포인트 구현 확인
- 3단계 승인: TE(작성/제출) → TM(검토) → LM(승인), TM/LM 반려 가능

선행 조건:
- 시드 데이터: 중간점검용 교정 레코드 (calibration UUID) + 장비 UUID 필요
- uuid-constants.ts에 WF-19 전용 상수 추가

액션:
1. uuid-constants.ts / shared-test-data.ts에 추가:
   - TEST_INTERMEDIATE_INSPECTION_IDS (WF-19 전용)
   - 또는 기존 TEST_CALIBRATION_IDS.CALIB_001 활용
2. workflow-helpers.ts에 추가:
   - createIntermediateInspection(page, calibrationId, dto)
   - submitIntermediateInspection(page, inspectionId)
   - reviewIntermediateInspection(page, inspectionId)
   - approveIntermediateInspection(page, inspectionId)
   - rejectIntermediateInspection(page, inspectionId, reason)
   - resetIntermediateInspections(calibrationId)
3. wf-19-intermediate-inspection-3step-approval.spec.ts 생성:
   === 정상 승인 흐름 ===
   Step 1: TE가 중간점검표 작성 (draft) — 점검일, 분류, 주기, 종합결과
   Step 2: TE가 점검 항목 2건 + 측정 장비 1건 포함하여 생성
   Step 3: TE가 제출 → submitted
   Step 4: TM이 검토 → reviewed
   Step 5: LM이 최종 승인 → approved
   Step 6: API 검증 — approvedAt/By 기록, 점검 항목/장비 데이터 유지
   === 반려 흐름 ===
   Step 7: 새 점검표 생성 → 제출
   Step 8: TM이 반려 (사유: "점검 항목 보완 필요") → rejected
   Step 9: API 검증 — rejectedAt/By, rejectionReason 기록

패턴 준수:
- auth.fixture.ts 기반 testOperatorPage / techManagerPage / siteAdminPage 사용
- test.describe.configure({ mode: 'serial' })
- CAS version 필수 (모든 PATCH에 version 포함)
- POST /calibration/:uuid/intermediate-inspections (교정 하위 생성)
- PATCH /intermediate-inspections/:uuid/submit|review|approve|reject

검증:
1. npx playwright test wf-19 --reporter=list → 9 Step 전체 PASS
```

### 🟡 MEDIUM — WF-18 E2E: 부적합 조치 반려 전용 워크플로우 테스트 (Playwright)

```
문제:
WF-18(부적합 조치 반려)은 nc-rejection-flow.spec.ts에서 기능 테스트로 커버되지만,
workflows/ 디렉토리에 전용 WF-18 파일이 없어 워크플로우 테스트 명명 규칙 불일치.
기존 feature 테스트가 이미 corrected → open 복귀 + 장비 상태 복원을 검증하므로
기능적 갭은 아니나, 일관성을 위해 WF 래퍼 생성 권장.

검증됨:
- apps/frontend/tests/e2e/workflows/ — wf-18-*.spec.ts 미존재
- features/non-conformances/nc-rejection-flow.spec.ts — 전체 흐름 + 이중 반려 stress 테스트 존재
- nc-rejection-flow.spec.ts 커버리지: corrected→open 복귀, 장비 non_conforming→available, CAS 버전 체인

액션 (경량):
1. wf-18-nc-correction-rejection.spec.ts 생성:
   기존 nc-rejection-flow.spec.ts의 핵심 시나리오를 WF 형식으로 래핑.
   Step 1: TE가 NC 조치 완료 (corrected)
   Step 2: TM이 조치 반려 → open 복귀
   Step 3: 장비 상태 non_conforming 확인
   Step 4: TE 재조치 + TM 종결 → closed, 장비 available

   ※ nc-rejection-flow.spec.ts의 헬퍼 함수 재사용.
   ※ stress 테스트(이중 반려)는 feature 테스트에 유지.

검증:
1. npx playwright test wf-18 --reporter=list → 4 Step PASS
```

### 🟡 MEDIUM — WF-20 E2E: 자체점검표 확인 + 잠금 (Playwright)

```
문제:
WF-20 워크플로우(자체점검표 확인)에 대한 E2E 테스트가 전혀 없음.
feature 테스트도 미존재. 자체점검 CRUD + 기술책임자 confirm + 잠금이 완전 미검증.

검증됨:
- apps/frontend/tests/e2e/ — self-inspection 관련 spec 파일 0건
- SelfInspectionsController/Service 백엔드 구현 확인
- 권한: CREATE_SELF_INSPECTION (TE, TM, LM), CONFIRM_SELF_INSPECTION (TM, LM만)
- completed → confirmed 선형 흐름, confirmed 후 수정/삭제 불가

선행 조건:
- 시드 데이터: WF-20 전용 장비 UUID (또는 기존 TEST_EQUIPMENT_IDS 활용)
- 자체점검 시드 불필요 (테스트에서 직접 생성)

액션:
1. workflow-helpers.ts에 추가:
   - createSelfInspection(page, equipmentId, dto)
     dto: { inspectionDate, appearance, functionality, safety, calibrationStatus, overallResult, inspectionCycle }
   - confirmSelfInspection(page, inspectionId, version)
   - deleteSelfInspection(page, inspectionId)
   - getSelfInspection(page, inspectionId)
   - resetSelfInspections(equipmentId): 해당 장비의 미확인 점검 기록 삭제
2. wf-20-self-inspection-confirmation.spec.ts 생성:
   Step 1: TE가 자체점검 생성 — 외관(pass), 기능(pass), 안전(pass), 교정상태(pass), 종합(pass), 주기 6개월
   Step 2: API 검증 — status=completed, nextInspectionDate = inspectionDate + 6개월
   Step 3: TE가 점검 내용 수정 (remarks 추가) — 정상 동작
   Step 4: TM이 확인 (confirm) → status=confirmed, confirmedAt/By 기록
   Step 5: 확인 후 수정 시도 → 400 에러 (ALREADY_CONFIRMED 또는 유사)
   Step 6: 확인 후 삭제 시도 → 400 에러
   Step 7: 권한 테스트 — TE가 confirm 시도 → 403 (CONFIRM_SELF_INSPECTION 없음)

패턴 준수:
- auth.fixture.ts 기반 testOperatorPage / techManagerPage 사용
- test.describe.configure({ mode: 'serial' })
- CAS version 필수 (update, confirm에 version 포함)
- POST /api/equipment/:uuid/self-inspections (장비 하위 생성)
- PATCH /api/self-inspections/:uuid/confirm

검증:
1. npx playwright test wf-20 --reporter=list → 7 Step 전체 PASS
```

---

<details>
<summary>✅ 아카이브 — 완료된 프롬프트 (22차 세션, 2026-04-05)</summary>

### ~~🟠 HIGH — UL-QP-18 절차서 준수 갭 해소: 이력카드 + 보존연한 + 자체점검표 + 양식 내보내기~~ ✅ 완료

> PR #109 (2026-04-05). 이력카드 docx 5테이블 통합 내보내기, documents 보존연한 컬럼,
> equipment_self_inspections 모듈, 11개 양식 xlsx 엔드포인트.
> Harness Mode 2, MUST 15/15 PASS.

### ~~🟡 MEDIUM — 소프트웨어 관리대장 목록 페이지네이션 UI + manufacturer 필터~~ ✅ 완료

> 커밋 46bf582a (2026-04-05). TestSoftwareListContent에 EquipmentPagination + manufacturer 필터 추가.
> 백엔드 DTO/서비스, software-filter-utils.ts, i18n 키 모두 반영.

### ~~🟡 MEDIUM — P0043 중복 관리번호 UNIQUE 제거 + 시드 데이터 73건 전량 시딩~~ ✅ 완료

> 커밋 46bf582a (2026-04-05). test-software.ts .unique() 제거, 시드 75행(P0001-P0073, P0043 3건) 전량 반영.

### ~~🟡 MEDIUM — 유효성확인 방법 1 receivedBy/receivedDate + 수정 UI~~ ✅ 부분 완료

> 커밋 46bf582a (2026-04-05). receivedBy/receivedDate/attachmentNote 입력 UI + draft 편집 다이얼로그 추가.
> 공급자 첨부파일 업로드 연동은 별도 프롬프트로 분리.

### ~~🟡 MEDIUM — AlertsContent 아이콘 버튼 aria-label 누락 2건~~ ✅ 완료

> 커밋 46bf582a (2026-04-05). aria-label 추가 + i18n 키 등록.

### ~~🟡 MEDIUM — Notifications markAllAsRead/markAsRead @AuditLog 누락 + VIEW 퍼미션 오용~~ ✅ 완료

> 커밋 46bf582a (2026-04-05). @AuditLog 추가, VIEW→UPDATE_NOTIFICATION 변경.

### ~~🟡 MEDIUM — error.tsx / loading.tsx 루트별 미적용~~ ✅ 대부분 완료

> 커밋 46bf582a (2026-04-05). software/[id] 하위 추가. 대부분 라우트 커버됨.
> 나머지 4개 라우트(validation, validationId, cables/create, checkouts/import/[id]) 별도 프롬프트.

### ~~🟠 HIGH — CI 보안: trivy-action@master 미고정 + copilot-setup-steps.yml 빌드 실패~~ ✅ 완료

> 커밋 46bf582a (2026-04-05). trivy-action@0.28.0 고정, copilot-setup-steps pnpm 변경.

### ~~🟠 HIGH — UL-QP-18-03 중간점검표: 점검 항목/측정 장비/결재 구조화~~ ✅ 완료

> 커밋 4985107a (2026-04-05). 3 tables + IntermediateInspectionsModule + InspectionFormDialog/RecordsDialog.

### ~~🟠 HIGH — UL-QP-18-08 Cable/Path Loss 관리대장: 케이블 레지스트리 + 주파수별 데이터~~ ✅ 완료

> 커밋 0520acd7 (2026-04-05). 3 tables + CablesModule + /cables 페이지 + MeasurementFormDialog.
> 시드 데이터(23개 케이블)와 xlsx 내보내기는 절차서 갭 해소 프롬프트에 포함.

### ~~🟠 HIGH — 승인 대시보드 QM 누락~~ ✅ 완료 (이전 세션)

### ~~🟠 HIGH — test_software createdBy 컬럼 누락~~ ✅ 완료 (이전 세션)

### ~~🟠 HIGH — calibration_plans FK 제약조건 누락~~ ✅ 완료 (이전 세션)

### ~~🟠 HIGH — 유효성 확인 상세 뷰 + 반려 재제출~~ ✅ 완료 (이전 세션)

### ~~🟠 HIGH — 유효성확인 DB 컬럼 누락 2개 + 품질승인 알림~~ ✅ 완료 (이전 세션)

### ~~🟠 HIGH — 장비 상세 "소프트웨어/매뉴얼" 탭 통합 재설계~~ ✅ 완료 (이전 세션)

### ~~🟠 HIGH — 장비↔시험용SW M:N 링크 CRUD + 양방향 UI~~ ✅ 완료 (이전 세션)

### ~~🔴 CRITICAL — 소프트웨어 도메인 재설계~~ ✅ 완료 (PR #104)

### ~~🔴 CRITICAL — 담당자(정/부) 이름 JOIN 누락 + Create/Edit 폼 필드 보완~~ ✅ 완료 (이전 세션)

### ~~🔴 CRITICAL — UL-QP-18-09 방법 2 프론트엔드 양식~~ ✅ 완료 (이전 세션)

### ~~🔴 CRITICAL — 유효성확인 첨부파일 인프라~~ ✅ 완료 (이전 세션)

</details>

<details>
<summary>❌ False Positives — 22차 스캔 (2026-04-05)</summary>

### intermediate-checks API 엔드포인트 미구현
> 스캔 결과: `API_ENDPOINTS.CALIBRATIONS.INTERMEDIATE_CHECKS.ALL` 백엔드 미구현.
> 검증 결과: calibration.controller.ts:171,191에 `@Get('intermediate-checks')`, `@Get('intermediate-checks/all')` 구현 확인. FALSE POSITIVE.

### software-validations update() 캐시 무효화 누락
> 스캔 결과: update() 메서드에서 invalidateCache() 미호출.
> 검증 결과: software-validations.service.ts:294에서 `this.invalidateCache(id)` 호출 확인. FALSE POSITIVE.

</details>
