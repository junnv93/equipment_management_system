# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-04-04 (12차 — 3-agent 병렬 스캔 + 2차 검증)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용.

---

## 현재 미해결 프롬프트: 4건

### 🔴 CRITICAL — 소프트웨어 도메인 재설계: UL-QP-18-07 관리대장 + UL-QP-18-09 유효성 확인 (Mode 2)

```
문제:
현재 software 모듈은 "장비에 설치된 소프트웨어의 버전 변경 이력"을 추적하는 구조이다.
UL-QP-18-07(시험용 소프트웨어 관리대장)과 UL-QP-18-09(유효성확인 양식)이 요구하는 것은
"독립적인 시험용 소프트웨어 레지스트리 + 유효성 확인 워크플로우"이며, 현재 도메인 모델과 근본적으로 다르다.

도메인 핵심 구분 (CRITICAL — 두 개념은 완전히 다름):
  ┌─────────────────────────────┬──────────────────────────────────────────┐
  │ 장비 펌웨어 (Equipment FW)  │ 시험용 소프트웨어 (Test Software/Program)│
  ├─────────────────────────────┼──────────────────────────────────────────┤
  │ 장비 내장 임베디드/OS/펌웨어│ 컨트롤 PC에서 장비를 원격 제어하는       │
  │ (장비의 속성, 1:1)          │ 측정 자동화 프로그램 (독립 관리 단위)    │
  │ 예: 스펙트럼분석기 FW v3.2  │ 예: EMC32, DASY6 SAR, UL EMC, IECSoft   │
  │ 이력카드 기본정보로 기록    │ UL-QP-18-07 관리대장 + UL-QP-18-09 유효성│
  │ equipment.firmwareVersion   │ test_software 테이블 (PNNNN 관리번호)    │
  └─────────────────────────────┴──────────────────────────────────────────┘
  관계: 장비 ↔ 시험용 소프트웨어 = M:N
    - 하나의 시험용 SW(예: EMC32)가 여러 장비를 제어
    - 하나의 장비가 여러 시험용 SW로 제어됨 (시험 목적에 따라)

현재 상태 (검증됨):
- packages/db/src/schema/test-software.ts: ✅ 독립 레지스트리 구현됨 (PNNNN 관리번호)
- packages/db/src/schema/software-validations.ts: ✅ UL-QP-18-09 유효성 확인 스키마 존재
- packages/db/src/schema/equipment.ts:97-103: ❌ softwareName/softwareType 필드가
    시험용 프로그램(EMC32 등)을 저장 — 이것은 펌웨어가 아닌 시험용 SW, 잘못된 위치
- packages/db/src/schema/equipment.ts:97-98: softwareVersion + firmwareVersion 중복
    — 둘 다 장비 펌웨어 개념이므로 firmwareVersion 하나로 통합
- 기존 software_history 테이블: git status에서 삭제됨 (진행 중)
- 장비↔시험용SW M:N 중간 테이블: ❌ 미구현

UL-QP-18-07 양식 필수 필드 (test_software 테이블에 구현됨):
- 관리번호 PNNNN (기존 관리대장 하위 호환. 하나의 SW가 여러 시험분야에서 사용 → 동일 번호 가능)
- 시험분야 (RF, SAR, EMC, RED, HAC — testField enum)
- 담당자 (정, 부)
- 설치일자, 제작사 (Vendor), 위치, 가용 여부, 유효성 검증 대상 여부

설계 결정 (확정됨):
- 장비:시험용SW = M:N 관계 (equipment_test_software 중간 테이블)
- equipment 테이블: softwareName, softwareType 삭제, softwareVersion + firmwareVersion → firmwareVersion 통합
- 이력카드 항목 7 "관련 S/W": M:N JOIN으로 조회 (중복 텍스트 필드 불필요)
- 관리번호 PNNNN은 unique가 아닐 수 있음 (P0043처럼 하나의 SW 패키지가 여러 모듈로 등록)

UL-QP-18-09 양식 (software_validations 테이블에 구현됨):
- 방법 1: 공급자 시연 (vendorName, infoDate, summary, receivedBy, attachments)
- 방법 2: UL 자체 시험 (acquisition/processing/control 기능별 검증, 수락기준, 시험일자, 승인자)
- 기술책임자 → 품질책임자 제출 워크플로우

액션:
1단계 — DB 스키마 변경:
  - equipment 테이블 수정:
    - softwareName (varchar) 삭제 — 시험용 프로그램은 test_software 테이블에서 관리
    - softwareType (varchar) 삭제 — 시험용 프로그램 분류는 test_software.testField로 대체
    - softwareVersion (varchar) 삭제 — firmwareVersion과 통합
    - firmwareVersion (varchar) 유지 — 장비 자체 펌웨어/임베디드 버전
  - equipment_test_software 중간 테이블 신규 생성 (M:N 관계):
    - equipmentId FK → equipment.id
    - testSoftwareId FK → test_software.id
    - notes (optional, 연결 맥락 메모)
    - createdAt
    - unique(equipmentId, testSoftwareId) — 동일 조합 중복 방지
  - test_software 테이블: 이미 구현됨 (변경 없음)
  - software_validations 테이블: 이미 구현됨 (변경 없음)
  - 기존 software_history 테이블 삭제 (절차서에 없는 과잉 설계)

2단계 — Backend:
  - TestSoftwareModule: CRUD + 관리번호 자동 채번 (분류코드 P, 기존 PNNNN 하위 호환)
  - SoftwareValidationModule: 유효성 확인 양식 생성/제출/승인 워크플로우
  - EquipmentTestSoftware 관계 관리: 장비↔시험용SW 연결/해제 API
  - 기존 SoftwareModule 삭제: software_history 테이블 및 관련 코드 전부 제거
  - equipment 관련 스키마/DTO에서 softwareName/softwareType/softwareVersion 필드 제거

3단계 — Frontend:
  - /software 페이지: 독립 시험용 소프트웨어 관리대장 (UL-QP-18-07 양식 기반)
  - /software/[id]: 소프트웨어 상세 (버전, 제작사, 시험분야, 담당자, 가용여부)
    + 이 소프트웨어와 연결된 장비 목록 (M:N)
  - /software/[id]/validation: 유효성 확인 양식 작성/조회 (UL-QP-18-09)
  - /equipment/[id] 기본정보: firmwareVersion 필드 + 연결된 시험용 소프트웨어 목록 (M:N)
  - /equipment/[id]/software 페이지 제거

4단계 — 워크플로우 업데이트 (docs/workflows/critical-workflows.md):
  - WF-14 전면 재작성: "소프트웨어 변경 승인" → 2개 워크플로우로 분리
    - WF-14a: 시험용 소프트웨어 등록 (관리대장 등록 + 관리번호 채번)
    - WF-14b: 소프트웨어 유효성 확인 워크플로우
      방법 1 (공급자 시연): TE 양식 작성 → TM 확인 → QM 등록
      방법 2 (UL 자체 시험): TE 시험 실시 → TM 승인 → QM 등록
  - 각 WF에 절차서 근거 추가: "절차서 근거: UL-QP-18 섹션 14.1~14.3"
  - 크로스 기능 의존성 맵에 소프트웨어 모듈 반영
  - 우선순위 테이블 업데이트

참조 문서:
- docs/procedure/시험용소프트웨어관리대장.md (P0001~P0073 실제 데이터)
- docs/procedure/시험소프트웨어유효성확인.md (양식 구조 + IECSoft 작성 사례)
- docs/procedure/장비관리절차서.md 섹션 14

검증:
1. pnpm --filter backend run db:generate → 마이그레이션 생성 성공
   (software_history DROP, equipment_test_software CREATE, equipment 컬럼 DROP 3개)
2. pnpm --filter backend run tsc --noEmit → 타입 에러 0
3. pnpm --filter frontend run tsc --noEmit → 타입 에러 0
4. 관리대장 페이지에서 P0001~P0073 초기 데이터 시딩 후 조회 가능
5. 유효성 확인 양식 작성 → 기술책임자 승인 → 품질책임자 등록 워크플로우 E2E 통과
6. 기존 software_history 관련 코드/라우트/컴포넌트 완전 제거 확인 (grep 0건)
7. equipment 테이블에서 softwareName/softwareType/softwareVersion 컬럼 제거 확인
8. equipment ↔ test_software M:N 관계: 장비 상세에서 연결된 시험용 SW 목록 조회 가능
9. 이력카드 내보내기에서 항목 7 "관련 S/W"가 M:N JOIN으로 정상 출력
```

### 🟠 HIGH — UL-QP-18 절차서 준수 갭 해소: 이력카드 통합 + 보존연한 + 자체점검표 + 공식 양식 내보내기 (Mode 2)

```
문제:
UL-QP-18 절차서 준수 검증 결과 약 90% 달성. 3개 기능 갭 + 1개 운영 갭 확인됨.

갭 1 — 섹션 7.6-7.7 시험설비 이력카드 (UL-QP-18-02) 내보내기:
절차서가 요구하는 10개 항목이 equipment, equipment_maintenance_history,
equipment_incident_history, software_history, repair_history 등 5개 테이블에 분산 저장됨.
시스템 내에서는 이력별(유지보수/사고/교정/소프트웨어/수리) 분리 관리가 더 효율적이므로
현재 구조가 적합함. 다만 감사/인증 시 공식 양식(UL-QP-18-02)으로 제출해야 하므로
5개 테이블 데이터를 통합하여 이력카드 docx 내보내기 기능이 필요.
- packages/db/src/schema/equipment.ts: 기본 정보 (항목 1-9)
- packages/db/src/schema/equipment-maintenance-history.ts: 유지보수 이력 (항목 10 일부)
- packages/db/src/schema/equipment-incident-history.ts: 파손/오작동 (항목 10 일부)

갭 2 — 섹션 15 기록 보존연한:
절차서 15.1에 양식별 보존연한이 명시됨 (영구, 5년 등).
현재 시스템은 소프트 삭제(deletedAt) 기반 영구보관만 지원.
보존연한 메타데이터, 만료 알림, 폐기 승인 워크플로우 없음.
- packages/db/src/schema/documents.ts: deletedAt만 존재, retentionPeriod 없음

갭 3 — 섹션 8.6 자체점검표 (UL-QP-18-05):
비교정 대상 장비의 자체점검 기록을 저장하는 별도 테이블/양식 없음.
중간점검 필드(lastIntermediateCheckDate 등)만 equipment에 존재.
- packages/db/src/schema/equipment.ts:82-85: 중간점검 날짜 필드만

갭 4 — 공식 양식 템플릿 기반 레포트 내보내기:
현재 시스템에 데이터는 있으나, UL 공식 양식(docx/xlsx) 템플릿에 DB 데이터를
채워서 내보내는 기능이 없음. 감사/인증 시 공식 양식으로 출력해야 하므로 필수.
템플릿 파일 목록 (docs/procedure/template/, 11개 전부 확보):
- UL-QP-18-01(02) 시험설비 관리대장.xlsx — 장비 전체 목록 (실제 데이터 포함, 필드 매핑 참조용)
- UL-QP-18-02(01) 시험설비 이력카드.docx — 장비 기본정보 + 이력 10개 항목
- UL-QP-18-03(02) 중간점검표.docx — 중간점검 기록 (실제 데이터 포함)
- UL-QP-18-05(01) 자체점검표.docx — 자체점검 기록 (실제 데이터 포함)
- UL-QP-18-06(01) 장비반출입확인서.docx — 반출입 확인서 (반출자 서명, 장비 목록)
- UL-QP-18-07(02) 시험용 소프트웨어 관리대장.docx — 소프트웨어 등록 현황
- UL-QP-18-08(00) Cable and Path Loss 관리대장.xlsx — 케이블/패스로스 데이터 (실제 데이터, 21MB)
- UL-QP-18-09(02) 시험 소프트웨어의 유효성확인.docx — 유효성 확인 양식
- UL-QP-18-10(01) 공용장비 사용,반납 확인서.docx — 공용장비 확인서
- UL-QP-18-11(00) 보정인자 및 파라미터 관리대장.docx — 보정인자/파라미터 관리
- UL-QP-19-01(00) 연간 교정계획서_RF_2026.xlsx — 교정계획서
  (일부 파일은 실제 사용 데이터가 채워져 있어 필드 매핑 참조로 활용)

액션:
갭 1 해소 — 장비 이력카드 내보내기 (통합 API는 내보내기 전용):
  - 시스템 UI: 현재 이력별 분리 관리 구조 유지 (변경 없음)
  - 내보내기 전용 서비스: equipment + maintenance + incident + calibration +
    repair + checkouts를 시간순 통합하여 UL-QP-18-02 양식 10개 항목 매핑 → docx 생성
    (항목 7 "관련 소프트웨어" = equipment_test_software M:N JOIN → test_software.name, 소프트웨어 변경 이력은 절차서 범위 밖)
  - 프론트엔드: /equipment/[id] 상세 페이지에 "이력카드 내보내기" 버튼 추가

갭 2 해소 — 보존연한 메타데이터:
  - documents 테이블에 retentionPeriod (enum: 1y/3y/5y/10y/permanent), retentionExpiresAt 추가
  - 양식번호별 기본 보존연한 매핑 (UL-QP-18-01~11, docs/procedure/장비관리절차서.md 섹션 15.1 참조)
  - 대시보드에 보존기한 만료 예정 기록 알림 위젯

갭 3 해소 — 자체점검표:
  - equipment_self_inspections 테이블 신규 (equipmentId, inspectionDate, inspector,
    checkItems JSON, result: pass/fail/conditional, notes, reviewedBy)
  - 자체점검 주기 관리 (equipment.selfInspectionCycle)
  - /equipment/[id]/inspections 페이지에서 점검 이력 조회/등록

갭 4 해소 — 공식 양식 템플릿 내보내기 (TemplateExportService):
  - 백엔드: TemplateExportService 신규 — docx-templater(또는 docxtemplater) + exceljs 활용
  - docs/procedure/template/ 의 docx/xlsx 파일을 템플릿으로 읽고, DB 데이터를 바인딩하여 생성
  - 내보내기 엔드포인트:
    - GET /equipment/export/registry → UL-QP-18-01 시험설비 관리대장 xlsx
    - GET /equipment/:uuid/export/history-card → UL-QP-18-02 이력카드 docx
    - GET /equipment/:uuid/export/intermediate-check/:checkId → UL-QP-18-03 중간점검표 docx
    - GET /equipment/:uuid/export/self-inspection/:inspectionId → UL-QP-18-05 자체점검표 docx
    - GET /equipment/:uuid/export/checkout-form/:checkoutId → UL-QP-18-06 반출입확인서 docx
    - GET /software/export/registry → UL-QP-18-07 소프트웨어 관리대장 docx
    - GET /cable-loss/export → UL-QP-18-08 Cable/Path Loss xlsx (신규 모듈 필요 — 현재 시스템에 미구현)
    - GET /software/:id/export/validation/:validationId → UL-QP-18-09 유효성확인 docx
    - GET /equipment/:uuid/export/shared-usage/:usageId → UL-QP-18-10 공용장비 확인서 docx
    - GET /calibration-factors/export → UL-QP-18-11 보정인자/파라미터 관리대장 docx
    - GET /calibration-plans/:uuid/export → UL-QP-19-01 교정계획서 xlsx
  - 프론트엔드: 각 상세 페이지에 "공식 양식 내보내기" 버튼 추가
  - 파일명 규칙: {양식번호}_{장비관리번호}_{날짜}.docx (예: UL-QP-18-02_SUW-E0001_20260403.docx)

갭 5 해소 — 워크플로우 업데이트 (docs/workflows/critical-workflows.md):
  - 기존 WF 전체에 절차서 근거 추가: "절차서 근거: UL-QP-18 섹션 X.X" 형식
  - 신규 WF 추가:
    - WF-19: 공용장비 사용/반납 확인서 (UL-QP-18 섹션 13.2, 양식 UL-QP-18-10)
      TE 확인서 작성 → TM 승인 → 사용 → 반납 시 이상여부 확인 → TM 승인
    - WF-20: 자체점검표 작성/확인 (UL-QP-18 섹션 8.6, 양식 UL-QP-18-05)
      TE 점검 실시 → 결과 기록 → TM 확인
    - WF-21: 양식 내보내기 (11개 템플릿)
      각 상세 페이지 → "공식 양식 내보내기" → 템플릿 기반 docx/xlsx 다운로드
  - 크로스 기능 의존성 맵에 자체점검, 공용장비, 양식 내보내기 반영
  - 우선순위 테이블 업데이트

참조 문서:
- docs/procedure/장비관리절차서.md 섹션 7.6-7.7, 8.6, 13.2, 15.1
- docs/procedure/기록관리절차서.md 섹션 5.5 (보관, 보존 및 폐기)
- docs/procedure/template/ (11개 공식 양식 템플릿)
- docs/workflows/critical-workflows.md (기존 WF-01~WF-18)

검증:
1. pnpm --filter backend run tsc --noEmit → 타입 에러 0
2. documents 테이블 보존연한 필드 마이그레이션 성공
3. 자체점검표 CRUD + 기술책임자 확인 워크플로우 동작
4. GET /equipment/:uuid/export/history-card → UL-QP-18-02 docx 다운로드, 5개 테이블 데이터 통합 매핑
5. 내보낸 docx 열었을 때 DB 데이터가 올바른 셀에 채워져 있음 (양식 레이아웃 유지)
6. 11개 내보내기 엔드포인트 각각 해당 양식 파일 정상 생성
7. GET /calibration-plans/:uuid/export → xlsx 파일 다운로드 성공
8. critical-workflows.md에 WF-19~21 추가 + 기존 WF에 절차서 근거 표시
9. 기존 테스트 전부 통과 (pnpm test)
```

### 🟠 HIGH — calibration_plans 테이블 user FK 제약조건 누락 (Mode 0)

```
문제:
calibration_plans 테이블의 4개 user UUID 컬럼에 DB 레벨 FK 제약조건(.references())이 누락됨.
ORM relations()만 정의되어 있어 DB가 참조 무결성을 강제하지 못함.
이전 FK 정리(PR #92, 8차)에서 이 테이블이 누락된 것으로 추정.

검증됨:
- packages/db/src/schema/calibration-plans.ts:51: createdBy: uuid('created_by').notNull() — .references() 없음
- packages/db/src/schema/calibration-plans.ts:57: reviewedBy: uuid('reviewed_by') — .references() 없음
- packages/db/src/schema/calibration-plans.ts:62: approvedBy: uuid('approved_by') — .references() 없음
- packages/db/src/schema/calibration-plans.ts:66: rejectedBy: uuid('rejected_by') — .references() 없음
- packages/db/src/schema/calibration-plans.ts:179: relations()에서는 users.id 참조 정의됨 (ORM 레벨만)

액션:
- 4개 컬럼에 .references(() => users.id, { onDelete: 'restrict' }) 추가
- pnpm --filter backend run db:generate → 마이그레이션 생성
- 기존 데이터 무결성 확인 (orphaned UUID 없는지)

검증:
1. pnpm --filter backend run db:generate → FK 추가 마이그레이션 생성 성공
2. pnpm --filter backend run db:migrate → 마이그레이션 적용 성공
3. pnpm --filter backend run tsc --noEmit → 타입 에러 0
4. 기존 교정계획 테스트 통과
```

### 🟡 MEDIUM — AlertsContent 아이콘 버튼 aria-label 누락 2건 (Mode 0)

```
문제:
AlertsContent.tsx에 아이콘만 있는 버튼 2개에 aria-label이 누락됨.
스크린 리더�� 버튼 용도를 인식할 수 없는 접근성 위반.

검증됨:
- apps/frontend/app/(dashboard)/alerts/AlertsContent.tsx:215: <Button variant="ghost" size="icon"> + <MoreHorizontal> — aria-label 없음
- apps/frontend/app/(dashboard)/alerts/AlertsContent.tsx:265: <Button variant="outline" size="icon"> + <Filter> — aria-label 없음

액션:
- line 215: aria-label={t('alerts.actions.more')} 추가 (또는 적절한 i18n 키)
- line 265: aria-label={t('alerts.actions.filter')} 추가
- 해당 i18n 키 en/ko messages에 등록

검증:
1. pnpm --filter frontend run tsc --noEmit → 타입 에러 0
2. 두 버튼에 aria-label 속성 존재 확인
```

---

## 📦 완료 항목 아카이브

<details>
<summary>완료된 항목 (35건)</summary>

### HIGH
- CI unit-test Turbo 캐시 추가 (2026-04-02)
- checkoutItems FK onDelete restrict 추가 (2026-04-02)
- monitoring execFile 전환 (2026-04-02)
- 프론트엔드 하드코딩 한국어 i18n 전환 — commit d6c8c0cd
- Equipment approvalStatus 인덱스 추가 — commit d6c8c0cd

### MEDIUM
- 아이콘 버튼 aria-label 누락 5건 해소 (2026-04-02, 8차)
- i18n fallback 키 미등록 해소 — messages 등록 + fallback 제거 (2026-04-02, 8차)
- PendingChecks 기능 완성 — 백엔드 API + 필터 URL SSOT + 반출입 헤더 배지 (2026-04-02)
- AlertsContent activeTab URL SSOT 전환 (2026-04-02)
- softwareType TODO 해소 — equipment.softwareType 쿼리 연결 (2026-04-02)
- userPreferences Drizzle relations() 정의 추가 (2026-04-02)
- 미사용 Permission enum 5건 정리 — PR #92
- CI pnpm install 캐시 최적화 — PR #92
- FK ON DELETE 정책 cascade→restrict 통일 — PR #92
- 부적합 수리 워크플로우 E2E FIXME 해소 — commit 3f93f3e3

### SHOULD
- E2E CSS 셀렉터 → getByRole/getByText 전환 — pending-checks + create-equipment (2026-04-03, 10차)
- ReportsContent date-fns format → useDateFormatter 전환 (2026-04-03, 10차)

### LOW
- FK onDelete 정책 명시 누락 ~10건 해소 — user FK restrict 명시 (2026-04-02, 8차)
- .env.example DB 풀 변수 미문서화 해소 (2026-04-02, 8차)
- NCDetailClient 뒤로가기 버튼 aria-label 추가 (2026-04-02)
- i18n Phase 3 유틸리티 TODO 정리 — 이미 구현 완료 확인 (2026-04-02)
- 교정 필터 E2E 테스트 — PR #85에서 중복 삭제
- i18n 에러 메시지 Phase 3 구현 — PR #85
- 폐기 취소 확인 다이얼로그 — commit d6c8c0cd

### 복합
- 모니터링 대시보드 프론트엔드 — PR #88
- 테스트 커버리지 확대 — PR #96

### 이전 세션
- SSE 엔드포인트 권한 강화, 부적합 관리 권한 버그(PR #79),
  모니터링 cache-stats(PR #77), softwareType 스키마(PR #82),
  누락 loading.tsx, DB 인덱스, 미커밋 테스트, documents relations,
  E2E CI auth.setup(PR #83), CodeQL(PR #74)

</details>

<details>
<summary>거짓 양성 (14건)</summary>

- 교정계획 @AuditLog 누락 — 전부 적용됨
- auth.service.ts 빈 catch — 의도적 fail-open
- 누락된 error.tsx — 부모 cascading boundary 커버
- @AuditLog decorator 순서 — 기능 무관
- error.tsx/loading.tsx 26건 — 실제 존재
- Turbo cache key — 내부 해싱이 감지
- system-settings 인덱스 — 소규모 테이블
- preferences @AuditLog — 비즈니스 감사 대상 아님
- (8차) 미사용 Permission 4건 — 컨트롤러에서 모두 사용 중 확인
- (8차) Notifications @AuditLog — 읽음 표시는 비즈니스 감사 대상 아님
- (8차) 아이콘 버튼 38건 누락 주장 — 실제 누락 5건만 확인 (나머지 sr-only/aria-label 존재)
- (8차) CI 빌드 중복 — 별도 GitHub Actions job은 파일시스템 격리 (불가피)
- (8차) audit-logs relations() 누락 — write-only append 테이블, eager loading 불필요
- (8차) API endpoint 불일치 — 실제 라우트와 매칭 확인
- (12차) 캐시 무효화 갭 (approvals/dashboard) — approvals.service.ts는 read-only 집계 서비스(mutation 없음), dashboard.service.ts도 read-only, calibration.service.ts는 CacheInvalidationHelper 사용 중
- (12차) console.error 13건 — 서버사이드 page.tsx SSR catch 블록 에러 로깅은 Next.js 표준 패턴, 프로덕션 이슈 아님
- (12차) 대형 컴포넌트 6건 (>500줄) — 정보성 발견, 사용자 요청 없이 리팩토링 불필요
- (12차) CI 의존성 중복 설치 — 이전 8차에서 이미 최적화 완료
- (12차) pnpm/action-setup 버전 — v5는 현재 안정 버전, 업그레이드 불필요

</details>
