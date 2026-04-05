# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-04-05 (21차 — Mode 0/1/2 일괄 처리 + 3-agent 재스캔)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용.

---

## 현재 미해결 프롬프트: 8건

### 🟠 HIGH — UL-QP-18 절차서 준수 갭 해소: 이력카드 통합 + 보존연한 + 자체점검표 + 공식 양식 내보내기 (Mode 2)

```
문제:
UL-QP-18 절차서 준수 검증 결과 약 90% 달성. 3개 기능 갭 + 1개 운영 갭 확인됨.

갭 1 — 섹션 7.6-7.7 시험설비 이력카드 (UL-QP-18-02) 내보내기:
5개 테이블 데이터를 통합하여 이력카드 docx 내보내기 기능 필요.

갭 2 — 섹션 15 기록 보존연한:
documents 테이블에 retentionPeriod, retentionExpiresAt 추가.
양식번호별 기본 보존연한 매핑.

갭 3 — 섹션 8.6 자체점검표 (UL-QP-18-05):
equipment_self_inspections 테이블 신규 + 자체점검 주기 관리.

갭 4 — 공식 양식 템플릿 기반 레포트 내보내기:
docxtemplater + exceljs 활용, 11개 양식 내보내기 엔드포인트.

검증:
1. pnpm tsc --noEmit → 0
2. 이력카드 내보내기 docx 다운로드
3. 자체점검표 CRUD + 확인 워크플로우
4. 11개 내보내기 엔드포인트 각각 파일 생성
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

### 🟡 MEDIUM — 새 라우트 error.tsx / loading.tsx 누락 6건 (Mode 0)

```
문제:
21차 하네스에서 추가된 라우트에 에러 바운더리/로딩 스켈레톤 누락.

검증됨:
- software/[id]/validation/ — error.tsx, loading.tsx 없음
- software/[id]/validation/[validationId]/ — error.tsx, loading.tsx 없음
- cables/create/ — error.tsx, loading.tsx 없음

액션:
1. 3개 라우트에 error.tsx (RouteError 패턴) 추가
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

<details>
<summary>✅ 아카이브 — 완료된 프롬프트 (21차 세션, 2026-04-05)</summary>

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
> 나머지 3개 라우트(validation, validationId, cables/create) 별도 프롬프트.

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
