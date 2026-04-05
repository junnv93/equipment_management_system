# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-04-05 (26차 — E2E 시드 데이터 갭 확인 + 후속 프롬프트 추가)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용. `/playwright-e2e` 로 E2E 프롬프트 실행.

---

## 현재 미해결 프롬프트: 5건 (선행 1건 + E2E 4건)

### 🟠 HIGH — E2E 시드 데이터: 교정/반출/NC UUID 시딩 누락 (Mode 1)

```
문제:
WF-17/18/19 E2E 테스트가 시드 교정 UUID (bbbb0001-...) 의존하지만
seed-test-new.ts에서 calibrations 테이블에 시드 삽입 안 됨.
checkouts, non_conformances 시드도 없어 WF-17/18 Step 1에서 400/실패.
WF-20만 API 직접 생성 방식이라 통과 (7/7 PASS).

검증됨:
- docker exec postgres_equipment psql ... "SELECT id FROM calibrations WHERE id::text LIKE 'bbbb%'" → 0 rows
- shared-test-data.ts:218 — TEST_CALIBRATION_IDS.CALIB_001 = 'bbbb0001-...' 정의됨
- seed-test-new.ts — calibrations INSERT 0건

액션:
1. seed-test-new.ts에 calibrations 시드 추가:
   - bbbb0001-0001-0001-0001-000000000001 (CALIB_001 — WF-19 중간점검용)
   - 최소 equipmentId FK (기존 TEST_EQUIPMENT_IDS 참조), calibrationType, calibrationDate
2. checkouts 시드 추가 (WF-17 반출 테스트용)
3. 시드 후 검증: `pnpm --filter backend exec npx ts-node src/database/seed-test-new.ts`

검증:
1. SELECT count(*) FROM calibrations WHERE id::text LIKE 'bbbb%' → 1건 이상
2. WF-19 Step 1 (createIntermediateInspection) → 201
```

### ~~🟡 MEDIUM — TE 교정 권한 검토: 중간점검 작성 권한 갭~~ ✅ 완료

> 26차 (2026-04-05). TE에게 UPDATE_CALIBRATION 추가 (role-permissions.ts).
> 절차서 기준 TE가 중간점검 점검자. WF-19 테스트 역할 TE로 복원.

---

## E2E 워크플로우 테스트 프롬프트: 4건

> **근거:** `docs/workflows/critical-workflows.md` WF-17~WF-20 대비 E2E 커버리지 갭.
> 기존 WF-01~WF-16은 `apps/frontend/tests/e2e/workflows/` 에 전용 spec 파일 존재.
> `/playwright-e2e` 로 실행하여 시드 데이터 + 헬퍼 함수 + spec 파일을 생성.

### 🟡 MEDIUM — WF-17 E2E: 반출 기한 초과 overdue 전이 + 반입 처리 (Playwright)

```
문제:
WF-17 워크플로우(반출 기한 초과 → overdue 자동 전이)에 대한 전용 워크플로우 E2E 테스트 없음.

검증됨:
- apps/frontend/tests/e2e/workflows/ — wf-17-*.spec.ts 미존재
- suite-17-overdue/s17-overdue-scenarios.spec.ts — parallel mode, 읽기 전용

구현 전략:
API로 DB 상태를 직접 설정(expectedReturnDate 과거일 + checked_out)한 뒤
overdue 시나리오 후속 워크플로우(반입 처리)를 검증.

액션:
1. workflow-helpers.ts에 추가:
   - createOverdueCheckout(), markCheckoutOverdue()
2. shared-test-data.ts에 WF-17 전용 시드 상수 추가
3. wf-17-checkout-overdue-return.spec.ts 생성 (5 Steps)

검증:
1. npx playwright test wf-17 --reporter=list → 5 Step 전체 PASS
```

### 🟠 HIGH — WF-19 E2E: 중간점검표 3단계 승인 + 반려 (Playwright)

```
문제:
WF-19 워크플로우(중간점검표 3단계 승인)에 대한 전용 워크플로우 E2E 테스트 없음.

검증됨:
- apps/frontend/tests/e2e/workflows/ — wf-19-*.spec.ts 미존재
- features/calibration/certificate/intermediate-check.spec.ts — UI 완료 다이얼로그만 테스트

액션:
1. uuid-constants.ts / shared-test-data.ts에 WF-19 전용 상수 추가
2. workflow-helpers.ts에 중간점검 헬퍼 함수 6개 추가
3. wf-19-intermediate-inspection-3step-approval.spec.ts 생성 (9 Steps)

패턴 준수:
- auth.fixture.ts 기반 testOperatorPage / techManagerPage / siteAdminPage 사용
- test.describe.configure({ mode: 'serial' })
- CAS version 필수

검증:
1. npx playwright test wf-19 --reporter=list → 9 Step 전체 PASS
```

### 🟡 MEDIUM — WF-18 E2E: 부적합 조치 반려 전용 워크플로우 테스트 (Playwright)

```
문제:
WF-18(부적합 조치 반려)은 nc-rejection-flow.spec.ts에서 기능 테스트로 커버되지만,
workflows/ 디렉토리에 전용 WF-18 파일이 없어 명명 규칙 불일치.

검증됨:
- apps/frontend/tests/e2e/workflows/ — wf-18-*.spec.ts 미존재
- features/non-conformances/nc-rejection-flow.spec.ts — 전체 흐름 존재

액션 (경량):
1. wf-18-nc-correction-rejection.spec.ts 생성 (4 Steps, 기존 헬퍼 재사용)

검증:
1. npx playwright test wf-18 --reporter=list → 4 Step PASS
```

### 🟡 MEDIUM — WF-20 E2E: 자체점검표 확인 + 잠금 (Playwright)

```
문제:
WF-20 워크플로우(자체점검표 확인)에 대한 E2E 테스트가 전혀 없음.

검증됨:
- apps/frontend/tests/e2e/ — self-inspection 관련 spec 파일 0건
- SelfInspectionsController/Service 백엔드 구현 확인

액션:
1. workflow-helpers.ts에 자체점검 헬퍼 함수 4개 추가
2. wf-20-self-inspection-confirmation.spec.ts 생성 (7 Steps)

패턴 준수:
- auth.fixture.ts 기반 testOperatorPage / techManagerPage 사용
- test.describe.configure({ mode: 'serial' })
- CAS version 필수

검증:
1. npx playwright test wf-20 --reporter=list → 7 Step 전체 PASS
```

---

<details>
<summary>✅ 아카이브 — 완료된 프롬프트 (25차 세션, 2026-04-05)</summary>

### ~~🟠 HIGH — API_ENDPOINTS.INTERMEDIATE_INSPECTIONS 미정의~~ ✅ 완료

> 25차 (2026-04-05). api-endpoints.ts에 INTERMEDIATE_INSPECTIONS 섹션 7개 엔드포인트 추가.

### ~~🟢 LOW — auth.controller.ts login/refresh @AuditLog 미적용~~ ✅ 완료

> 25차 (2026-04-05). login에 @AuditLog create, refresh에 @AuditLog update 추가.

### ~~🟠 HIGH — Frontend Dockerfile pnpm 버전 불일치~~ ✅ 완료

> 25차 (2026-04-05). pnpm@10.7.0 → 10.7.1 통일 (3곳).

### ~~🟡 MEDIUM — 새 라우트 error.tsx / loading.tsx 누락~~ ✅ 완료

> 25차 (2026-04-05). software/create/ error.tsx + loading.tsx 추가. 나머지는 이미 존재 확인.

### ~~🟠 HIGH — self-inspections delete() 캐시 무효화 누락~~ ✅ 이미 해결

> 재검증: 서비스에 캐시 인프라 자체가 없음 (CacheInvalidationHelper 미주입). FALSE POSITIVE.

### ~~🟠 HIGH — SW-validations update/revise userId 미추출~~ ✅ 이미 해결

> 재검증: 이미 @Request() _req: AuthenticatedRequest 있음. FALSE POSITIVE.

### ~~🟠 HIGH — Dockerfile 프로덕션 빌드 차단~~ ✅ 이미 해결

> 재검증: packages/api-client, ui COPY 이미 제거, shared-constants COPY 이�� 추가. FALSE POSITIVE.

### ~~🟠 HIGH — history-card XML 이스케이프 누락~~ ✅ 이미 해결

> 재검증: escapeXml() + esc() 헬퍼 이미 구현됨. FALSE POSITIVE.

### ~~🟡 MEDIUM — LocationHistoryTab console.log~~ ✅ 이미 해결

> 재검증: console.log 0건. FALSE POSITIVE.

### ~~🟡 MEDIUM — 새 모듈 하드코딩 + aria-label~~ ✅ 이미 해결

> 재검증: 4건 모두 i18n 적용 확인. FALSE POSITIVE.

### ~~🟡 MEDIUM — FK 인덱스 누락~~ ✅ 이미 해결

> 재검증: inspectorIdIdx, createdByIdx 이미 존재. FALSE POSITIVE.

### ~~🟡 MEDIUM — 유효성확인 방법 1 공급자 첨부파일 + 수정 UI~~ ✅ 완료

> 커밋 fa466d99 (2026-04-05). ValidationDetailContent.tsx에 문서 첨부파일 Card 추가.
> documentApi.getValidationDocuments/uploadDocument/deleteDocument 연동.
> draft-only 업로드/삭제 제한. i18n ko/en 키 추가. Harness Mode 1 PASS.

### ~~🟠 HIGH — UL-QP-18 절차서 준수 갭 해소: 이력카드 + 보존연한 + 자체점검표 + 양식 내보내기~~ ✅ 완료

> PR #109 (2026-04-05). 이력카드 docx 5테이블 통합 내보내기, documents 보존연한 컬럼,
> equipment_self_inspections 모듈, 11개 양식 xlsx 엔드포인트.
> Harness Mode 2, MUST 15/15 PASS.

### ~~🟡 MEDIUM — 소프트웨어 관리대장 목록 페이지네이션 UI + manufacturer 필터~~ ✅ 완료

> 커밋 46bf582a (2026-04-05). TestSoftwareListContent에 EquipmentPagination + manufacturer 필터 추가.

### ~~🟡 MEDIUM — P0043 중복 관리번호 UNIQUE 제거 + 시드 데이터 73건 전량 시딩~~ ✅ 완료

> 커밋 46bf582a (2026-04-05). test-software.ts .unique() 제거, 시드 75행 전량 반영.

### ~~🟡 MEDIUM — 유효성확인 방법 1 receivedBy/receivedDate + 수정 UI~~ ✅ 부분 완료

> 커밋 46bf582a (2026-04-05). receivedBy/receivedDate/attachmentNote 입력 UI 추가.
> 공급자 첨부파일 업로드 연동은 24차에서 완료.

### ~~🟡 MEDIUM — AlertsContent 아이콘 버튼 aria-label 누락 2건~~ ✅ 완료

> 커밋 46bf582a (2026-04-05). aria-label 추가 + i18n 키 등록.

### ~~🟡 MEDIUM — Notifications markAllAsRead/markAsRead @AuditLog 누락 + VIEW 퍼미션 오용~~ ✅ 완료

> 커밋 46bf582a (2026-04-05). @AuditLog 추가, VIEW→UPDATE_NOTIFICATION 변경.

### ~~🟡 MEDIUM — error.tsx / loading.tsx 루트별 미적용~~ ✅ 대부분 완료

> 커밋 46bf582a (2026-04-05). 대부분 라우트 커버됨. 나머지 5개 라우트 별도 프롬프트.

### ~~🟠 HIGH — CI 보안: trivy-action@master 미고정 + copilot-setup-steps.yml 빌드 실패~~ ✅ 완료

> 커밋 46bf582a (2026-04-05). trivy-action@0.28.0 고정, copilot-setup-steps pnpm 변경.

### ~~🟠 HIGH — UL-QP-18-03 중간점검표: 점검 항목/측정 장비/결재 구조화~~ ✅ 완료

> 커밋 4985107a (2026-04-05). 3 tables + IntermediateInspectionsModule + InspectionFormDialog/RecordsDialog.

### ~~🟠 HIGH — UL-QP-18-08 Cable/Path Loss 관리대장: 케이블 레지스트리 + 주파수별 데이터~~ ✅ 완료

> 커밋 0520acd7 (2026-04-05). 3 tables + CablesModule + /cables 페이지 + MeasurementFormDialog.

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
<summary>❌ False Positives — 24차 스캔 (2026-04-05)</summary>

### cables/intermediate-inspections 전용 Permission 분리 필요
> 스캔 결과: 교정 권한(VIEW_CALIBRATIONS/UPDATE_CALIBRATION)을 재사용하여 role collision 발생.
> 사용자 판단: TE가 장비/교정/케이블 전부 조회·작성하는 게 기본 권한. 권한 분리 시 관리 복잡도만 증가. 교정 하위 기능으로 교정 권한 재사용 유지. FALSE POSITIVE (설계 의도).

### docker-compose.prod.yml postgres depends_on condition 누락
> 스캔 결과: backend service depends_on postgres에 condition 미지정.
> 검증 결과: line 73-75에 `condition: service_healthy` 명시 확인. FALSE POSITIVE.

### SELF_INSPECTIONS CREATE endpoint 누락
> 스캔 결과: API_ENDPOINTS.SELF_INSPECTIONS에 CREATE 엔드포인트 없음.
> 검증 결과: BY_EQUIPMENT이 POST/GET 겸용 RESTful 패턴. FALSE POSITIVE.

### Cable enum 미사용
> 스캔 결과: CABLE_CONNECTOR_TYPE_VALUES, CABLE_STATUS_VALUES 미사용 가능.
> 검증 결과: 프론트엔드 3파일(CableListContent, CableDetailContent, CreateCableContent)에서 사용 확인. FALSE POSITIVE.

### SelfInspection enum 미사용
> 스캔 결과: SelfInspectionItemJudgmentEnum 등 프론트엔드 미사용.
> 검증 결과: 백엔드 DTO 2파일에서 사용 확인. FALSE POSITIVE.

### intermediate-checks API 엔드포인트 미구현 (22차)
> 스캔 결과: `API_ENDPOINTS.CALIBRATIONS.INTERMEDIATE_CHECKS.ALL` 백엔드 미구현.
> 검증 결과: calibration.controller.ts:171,191에 구현 확인. FALSE POSITIVE.

### software-validations update() 캐시 무효화 누락 (22차)
> 스캔 결과: update() 메서드에서 invalidateCache() 미호출.
> 검증 결과: software-validations.service.ts:294에서 호출 확인. FALSE POSITIVE.

</details>
