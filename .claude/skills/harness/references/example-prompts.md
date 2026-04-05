# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-04-05 (18차 — 3-agent 스캔 + 2차 검증, 신규 8건 추가)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용.

---

## 현재 미해결 프롬프트: 21건

### ~~🔴 CRITICAL — 유효성확인 첨부파일 인프라~~ ✅ 완료 → 아카이브 참조

### ~~🔴 CRITICAL — UL-QP-18-09 방법 2 프론트엔드 양식~~ ✅ 완료 → 아카이브 참조

### ~~🔴 CRITICAL — 담당자(정/부) 이름 JOIN 누락 + Create/Edit 폼 필드 보완~~ ✅ 완료 → 아카이브 참조

### ~~🟠 HIGH — 장비↔시험용SW M:N 링크 CRUD + 양방향 UI~~ ✅ 완료 → 아카이브 참조

### ~~🔴 CRITICAL — 소프트웨어 도메인 재설계~~ ✅ 완료 → 아카이브 참조

> 이 항목은 PR #104로 완료됨 (2026-04-04). 아카이브 섹션에 기록.

<!--
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
- docs/procedure/절차서/시험용소프트웨어관리대장.md (P0001~P0073 실제 데이터)
- docs/procedure/절차서/시험소프트웨어유효성확인.md (양식 구조 + IECSoft 작성 사례)
- docs/procedure/절차서/장비관리절차서.md 섹션 14
- docs/procedure/양식/ (11개 공식 양식 md 변환본)

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
-->

### 🟠 HIGH — 유효성 확인 상세(Detail) 뷰 + 반려 재제출 경로 구현 (Mode 1)

```
문제:
유효성 확인 개별 레코드의 상세 내용을 볼 수 있는 페이지가 없음.
테이블에서 행을 클릭해 전체 필드(승인자, 승인일시, 반려사유 등)를 확인하는 화면 부재.
또한 반려(rejected) → 초안(draft) 재수정 경로가 없어 반려된 양식을 수정할 수 없음.

검증됨:
- SoftwareValidationContent.tsx:236-316 — 테이블 목록만, 행 클릭 상세 없음
- en/software.json:121 — validation.actions.view 키 정의되어 있으나 미사용
- /software/[id]/validation/[validationId] 라우트 없음
- software-validations.service.ts — rejected → draft 전이 메서드 없음
- SoftwareValidationContent.tsx:269-309 — rejected 상태 행에 액션 버튼 없음

액션:
1. /software/[id]/validation/[validationId]/page.tsx — 상세 뷰 페이지 생성
   모든 필드 표시: 방법1/2 정보, 승인자/일시, 반려사유
2. 백엔드: PATCH /software-validations/:uuid/revise — rejected → draft 전이
3. 프론트엔드: rejected 행에 "재수정" 버튼 → status를 draft로 되돌림
4. i18n 키 추가 (상세뷰 라벨, 재수정 버튼)

검증:
1. 테이블 행 클릭 → 상세 페이지 이동, 전체 필드 표시
2. 반려된 양식 "재수정" → draft로 전환 → 수정 → 재제출 가능
```

### 🟠 HIGH — 유효성확인 DB 컬럼 누락 2개 + 품질승인 알림 (Mode 0)

```
문제:
UL-QP-18-09 양식에서 요구하는 2개 필드가 DB에 없고,
품질책임자 승인(qualityApprove) 시 알림 이벤트가 발행되지 않음.

검증됨:
- software-validations.ts — infoDate (입수 일자, 스펙 시험소프트웨어유효성확인.md:30) 컬럼 없음
- software-validations.ts — softwareAuthor (제작자, 스펙:63) 컬럼 없음
- software-validations.service.ts:402-442 — qualityApprove에서 eventEmitter.emit 호출 없음
  (approve/submit/reject에는 알림 있음)

액션:
1. DB: software_validations에 info_date(timestamp), software_author(varchar 200) 추가
2. 서비스: qualityApprove에 SOFTWARE_VALIDATION.QUALITY_APPROVED 이벤트 발행 추가
3. notification-events.ts에 해당 이벤트 정의

검증:
1. 마이그레이션 성공
2. 유효성 확인 생성 시 infoDate, softwareAuthor 저장 가능
3. QM 승인 → 알림 발송 확인
```

### 🟡 MEDIUM — 소프트웨어 관리대장 목록 페이지네이션 UI + manufacturer 필터 (Mode 1)

```
문제:
백엔드 페이지네이션이 구현되어 있으나 프론트엔드에 페이지네이션 UI가 없음.
또한 제작사(manufacturer) 필터가 백엔드 DTO와 프론트엔드 모두에 없음.

검증됨:
- TestSoftwareListContent.tsx — Pagination 컴포넌트/UI 없음 (첫 페이지만 표시)
- test-software-query.dto.ts — manufacturer 필터 필드 없음
- test-software.service.ts:129-134 — search가 name에만 ILIKE, manufacturer 미포함
- TestSoftwareListContent.tsx:87-129 — testField/availability 필터만

액션:
1. TestSoftwareListContent.tsx에 Pagination 컴포넌트 추가 (URL params로 page 관리)
2. 백엔드 query DTO에 manufacturer 필터 추가
3. 서비스 findAll에서 manufacturer 조건 + search에 manufacturer ILIKE 포함
4. 프론트엔드 필터에 manufacturer 텍스트 입력 추가

검증:
1. 20건 이상 시 페이지네이션 UI 표시, 페이지 이동 동작
2. manufacturer 필터 입력 → 해당 제작사 소프트웨어만 표시
```

### 🟡 MEDIUM — P0043 중복 관리번호 UNIQUE 제거 + 시드 데이터 73건 전량 시딩 (Mode 1)

```
문제:
1. test_software.managementNumber에 UNIQUE 제약이 있어
   실제 관리대장의 P0043(3개 시험분야 동일번호) 패턴을 지원하지 못함.
   시드에서 P0043-HAC, P0043-mmW로 임의 접미사 우회 중 — 이는 잘못된 우회.
2. 73개 레코드 �� 20개만 시딩 (56개 누락).

검증됨:
- test-software.ts:22 — managementNumber: .unique()
- test-software.seed.ts:169,183 — P0043-HAC, P0043-mmW 임의 접미사
- 시험용소프트웨어관리대장.md:96-98 — P0043이 3행 (SAR/HAC/mmWave)

��계 결정 (확정 — 2026-04-05 사용자 확인):
  관리번호 체계: PNNNN (시험소코드 없음, 전 사이트 공통)
    - 장비: SUW-E0001 (사이트별 고유) vs 소프트웨어: P0001 (사이트 공통)
    - 한 행 = "특정 시험분야에서의 소프트웨어 운용 단위"
    - 동일 프로그램이 여러 시험분야에서 사용 → 같은 관리번호, 복수 행
      (각 행마다 담당자, 위치, 가용여부 다를 수 있음)
  결론: UNIQUE 제거 (옵션 A 확정), 접미사 우회 삭제

액션:
1. test-software.ts: managementNumber에서 .unique() 제거
2. test-software.seed.ts: P0043-HAC → P0043, P0043-mmW → P0043 원복
3. test-software.seed.ts: P0001~P0073 전량 시딩 (73행, 관리대장 원본 데이터 기준)
4. generateNextManagementNumber(): 동일 번호 복수 행 허용 반영
   (채번 시 MAX 일련번호 + 1, UNIQUE 제약 없으므로 race condition 주의 → SELECT FOR UPDATE)
5. 마이그레이션 생성 (UNIQUE 인덱스 DROP)

검증:
1. pnpm --filter backend run db:generate → 마이��레이션 생성 성공
2. 시드 후 73개+ 레코드 존재
3. P0043이 3행 (SAR/HAC/mmWave) 정상 삽입
4. 신규 등록 시 P0074 자동 채번
```

### 🟡 MEDIUM — 유효성확인 방법 1 누락 필드(receivedBy/receivedDate) + 공급자 첨부파일 + 수정 UI (Mode 1)

```
문제:
방법 1(공급자 시연) 양식에서 UL-QP-18-09가 요구하는 3가지가 누락됨:
1. receivedBy(수령 직원), receivedDate(수령일) 입력 UI
2. 공급자 제공 자료 첨부파일 업로드 (양식 핵심 요구사항)
3. draft 상태 편집(Edit) UI

검증됨:
- software-validations.ts:47-48 — receivedBy, receivedDate DB 존재
- SoftwareValidationContent.tsx:85-91 — 해당 입력 필드 없음
- SoftwareValidationContent.tsx:362-382 — vendor 폼에 파일 업로드 UI 없음
- software-validations.ts:49 — attachmentNote: text만 존재 (파일 참조 아님)
- en/software.json:122 — validation.actions.edit 키 있으나 미사용
- PATCH /software-validations/:uuid — 백엔드 수정 API 존재
- 시험소프트웨어유효성확인.md:39 — "Scan and/or attach information provided by the vendor"
- 시험소프트웨어유효성확인.md:52 — 작성 사례: "IECSoft v2.6 업데이트 노트.pdf" 첨부

  ※ 선행 조건: "유효성확인 첨부파일 인프라" 프롬프트 완료 필요

액션:
1. vendor 폼에 receivedBy(UserSelect), receivedDate(DatePicker) 추가
2. vendor 폼에 첨부파일 업로드 영역 추가 (ValidationAttachments 컴포넌트 활용)
   documentType: 'validation_vendor_attachment'
   "공급자 제공 자료를 스캔하거나 첨부하세요" 안내 문구
3. draft 상태 행에 "수정" 버튼 → Edit Dialog 추가
4. Edit 시 기존 첨부파일 목록 표시 + 추가/삭제 가능
5. i18n 키 추가 (수령 직원, 수령일, 첨부파일 관련)

검증:
1. pnpm --filter frontend run tsc --noEmit → 타입 에러 0
2. 방법 1 양식에 수령 직원/수령일 입력 표시
3. 공급자 자료 파일 첨부 → 업로드 성공 → 목록 표시
4. draft 양식 수정 → 저장 동작 (첨부파일 포함)
5. submitted 이후 첨부파일 읽기 전용
```

### ~~🟠 HIGH — 장비 상세 "소프트웨어/매뉴얼" 탭 통합 재설계~~ ✅ 완료 → 아카이브 참조

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
  - 양식번호별 기본 보존연한 매핑 (UL-QP-18-01~11, docs/procedure/절차서/장비관리절차서.md 섹션 15.1 참조)
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
- docs/procedure/절차서/장비관리절차서.md 섹션 7.6-7.7, 8.6, 13.2, 15.1
- docs/procedure/절차서/기록관리절차서.md 섹션 5.5 (보관, 보존 및 폐기)
- docs/procedure/template/ (11개 공식 양식 원본)
- docs/procedure/양식/ (11개 공식 양식 md 변환본)
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

### 🟠 HIGH — UL-QP-18-03 중간점검표: 점검 항목/측정 장비/결재 구조화 (Mode 2)

```
문제:
UL-QP-18-03 중간점검표 양식은 점검항목 체크리스트(번호/점검항목/점검기준/점검결과/판정),
측정장비 목록(관리번호/장비명/교정일자), 3단계 결재(담당/검토/승인), 점검자/특이사항을 요구하지만
현재 시���템은 intermediateCheckDate 날짜 1개 + notes 텍스트만 기록 가능.
구조화된 점검 기록이 전혀 없어 감사 시 양식 출력 불가.

검증됨:
- packages/db/src/schema/calibrations.ts:62 — intermediateCheckDate: date 필드만 존재
- apps/backend/src/modules/calibration/dto/complete-intermediate-check.dto.ts:5-8 —
  completeIntermediateCheckSchema: { notes: z.string().optional(), ...versionedSchema } 뿐
- calibration.controller.ts:236-263 — POST :uuid/intermediate-check/complete: 날짜 갱신만
- DB에 intermediate_inspections, inspection_records 등 전용 테이블 없음
- 프론트엔드: IntermediateChecksTab.tsx — 목록 + "완료" 버튼만, 폼 UI 없음

양식 요구사항 (docs/procedure/양식/QP-18-03_중간점검표.md):
  헤더: 분류, 관리팀, 관리번호, 장비위치, 장비명, 모델명, 점검주기, 교정유효기간
  점검 항목: 번호 | 점검항목 | 점검기준 | 점검결과 | 판정(합격/불합격)
  측정 장비: 번호 | 관리번호 | 장비명 | 교정일자
  결재: 담당/검토/승인 3단계
  점검자, 점검일, 특이사항

액션:
1단계 — DB 스키마:
  - intermediate_inspections 테이블 신규:
    id, calibrationId(FK), equipmentId(FK), inspectionDate, inspectorId(FK→users),
    classification(교정기기/비교정기기), inspectionCycle, calibrationValidityPeriod,
    overallResult(pass/fail), remarks(text),
    approvalStatus(draft/submitted/reviewed/approved/rejected),
    submittedBy, reviewedBy, approvedBy, rejectionReason, version(CAS)
  - intermediate_inspection_items 테이블 신규:
    id, inspectionId(FK), itemNumber, checkItem(점검항목), checkCriteria(점검기준),
    checkResult(점검결과), judgment(pass/fail)
  - intermediate_inspection_equipment 테이블 신규:
    id, inspectionId(FK), equipmentId(FK→equipment), equipmentName, calibrationDate

2단계 — 백엔드:
  - IntermediateInspectionModule: CRUD + 제출/검토/승인 워크플로우
  - POST /calibration/:uuid/intermediate-inspection — 점검 기록 생성
  - GET /calibration/:uuid/intermediate-inspections — 점검 기록 목록
  - PATCH /intermediate-inspections/:uuid/submit|review|approve|reject

3단계 — 프론트엔드:
  - IntermediateChecksTab.tsx 확장: "점검 기록 작성" 버튼 + 폼
  - 점검항목 동적 배열 폼 (추가/삭제)
  - 측정장비 선택 (equipment 검색 + 교정일 자동 표시)
  - 3단계 결재 UI

검증:
1. pnpm --filter backend run db:generate → 3개 테이블 마이그레이션 생성
2. pnpm --filter backend run tsc --noEmit → 타입 에러 0
3. pnpm --filter frontend run tsc --noEmit → 타입 에러 0
4. 점검 기록 작성 → 항목 입력 → 제출 → 검토 → 승인 워크플로우 동작
5. 점검 기록 조회 시 항목별 판정 + 측정장비 목록 표시
```

### 🟠 HIGH — UL-QP-18-08 Cable/Path Loss 관리대장: 케이블 레지스트리 + 주파수별 데이터 (Mode 2)

```
문제:
UL-QP-18-08 양식은 RF 시험용 케이블 레지스트리(관리번호/길이/TYPE/주파수범위/S/N/위치)와
케이블별 주파수-손실 측정 데이터(MHz vs dB, 수백 포인트)를 관리한다.
현재 calibration_factors에 cable_loss 타입으로 편입되어 있으나,
factorValue가 스칼라 값 1개만 지원하고, 케이블 식별 전용 필드와 주파수 배열 스키마가 없음.

검증됨:
- packages/db/src/schema/calibration-factors.ts:50 — factorType: 'cable_loss'|'path_loss' 지원
- packages/db/src/schema/calibration-factors.ts:52 — factorValue: decimal(15,6) 스칼라 값 1개
- packages/db/src/schema/calibration-factors.ts:57 — parameters: jsonb (비구조화)
- DB에 cables, cable_registry, path_loss_measurements 등 전용 테이블 없음
- 프론트엔드: CalibrationFactorsClient.tsx — 범용 폼, 케이블 전용 UI 없음
- 시드 데이터: calibration-factors.seed.ts:109-128 — cable_loss 항목이 단일 주파수 값만

양식 요구사항 (docs/procedure/양식/QP-18-08_케이블패스로스관리대장.md):
  시트 1 — 케이블 목록: No | 관리번호 | Length(M) | TYPE | 주파수범위 | S/N | 위치
  시트 2~N — 개별 케이블: Freq(MHz) | Data(dB) 수백 포인트
  관리번호 형식: ELLLX-NNN (예: E020K-325, E100S-249)
  실제 데이터: 23개 케이블, 케이블당 30~100+ 주파수 포인트

액션:
1단계 — DB 스키마:
  - cables 테이블 신규:
    id, managementNumber(ELLLX-NNN), length(decimal, 미터), connectorType(K/SMA/N),
    frequencyRangeMin(integer, MHz), frequencyRangeMax(integer, MHz),
    serialNumber, location, site, status(active/retired),
    lastMeasurementDate, measuredBy(FK→users), version(CAS)
  - cable_loss_measurements 테이블 신규:
    id, cableId(FK→cables), measurementDate, measuredBy(FK→users),
    measurementEquipmentId(FK→equipment, 측정에 사용한 장비),
    notes
  - cable_loss_data_points 테이블 신규:
    id, measurementId(FK→cable_loss_measurements),
    frequencyMhz(integer), lossDb(decimal(15,10)),
    UNIQUE(measurementId, frequencyMhz)

2단계 — 백엔드:
  - CablesModule 신규: CRUD + 측정 데이터 관리
  - GET /cables — 케이블 목록 (페이지네이션, 필터)
  - POST /cables — 케이블 등록
  - GET /cables/:id — 케이블 상세 + 최신 측정 데이터
  - POST /cables/:id/measurements — 측정 데이터 업로드 (CSV/JSON 벌크)
  - GET /cables/:id/measurements — 측정 이력
  - GET /cables/export — UL-QP-18-08 xlsx 내보내기

3단계 — 프론트엔드:
  - /cables 페이지 신규: 케이블 목록 (관리번호, 길이, 타입, 주파수범위, 위치)
  - /cables/[id] 상세: 기본정보 + 주파수-손실 차트 (recharts) + 데이터 테이블
  - /cables/create: 케이블 등록 폼
  - 측정 데이터 업로드: CSV 파싱 또는 주파수/손실 행 입력
  - 사이드바에 "케이블 관리" 메뉴 추가

4단계 — 시드 데이터:
  - template/UL-QP-18-08 xlsx에서 23개 케이블 + 대표 측정 데이터 시딩

검증:
1. pnpm --filter backend run db:generate → 3개 테이블 마이그레이션 생성
2. pnpm --filter backend run tsc --noEmit → 타입 에러 0
3. pnpm --filter frontend run tsc --noEmit → 타입 에러 0
4. 케이블 등록 → 측정 데이터 업로드 → 차트/테이블 표시
5. GET /cables/export → UL-QP-18-08 형식 xlsx 다운로드
6. 기존 calibration_factors cable_loss 데이터는 마이그레이션으로 cables 테이블에 이전
```

### 🟠 HIGH — calibration_plans 테이블 user FK 제약조건 누락 + confirmedBy (Mode 0)

```
문제:
calibration_plans 테이블의 4개 user UUID 컬럼 + calibration_plan_items의 confirmedBy에
DB 레벨 FK 제약조건(.references())이 누락됨.
ORM relations()만 정의되어 있어 DB가 참조 무결성을 강제하지 못함.
이전 FK 정리(PR #92, 8차)에서 이 테이블이 누락된 것으로 추정.

검증됨:
- packages/db/src/schema/calibration-plans.ts:51: createdBy: uuid('created_by').notNull() — .references() 없음
- packages/db/src/schema/calibration-plans.ts:57: reviewedBy: uuid('reviewed_by') — .references() 없음
- packages/db/src/schema/calibration-plans.ts:62: approvedBy: uuid('approved_by') — .references() 없음
- packages/db/src/schema/calibration-plans.ts:66: rejectedBy: uuid('rejected_by') — .references() 없음
- packages/db/src/schema/calibration-plans.ts:138: confirmedBy: uuid('confirmed_by') — .references() 없음
- packages/db/src/schema/calibration-plans.ts:179: relations()에서는 users.id 참조 정의됨 (ORM 레벨만)
- packages/db/src/schema/calibration-plans.ts:198-207: calibrationPlanItemsRelations에 confirmedBy relation 없음

액션:
- calibration_plans 4개 + calibration_plan_items 1개 컬럼에 .references(() => users.id, { onDelete: 'restrict' }) 추가
- calibrationPlanItemsRelations에 confirmedByUser relation 추가
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

### 🟡 MEDIUM — Notifications markAllAsRead/markAsRead @AuditLog 누락 + VIEW 퍼미션 오용 (Mode 0)

```
문제:
notifications.controller.ts의 markAllAsRead(Patch read-all)과 markAsRead(Patch :id/read)에
@AuditLog 데코레이터가 누락됨. 데이터 변경(읽음 상태 전환)인데 감사 추적 불가.
또한 markAllAsRead에 Permission.VIEW_NOTIFICATIONS가 사용되고 있어
읽기 권한으로 쓰기 동작을 허용하는 권한 오용.

검증됨:
- notifications.controller.ts:137-150 — Patch('read-all'): @AuditLog 없음
- notifications.controller.ts:143 — @RequirePermissions(Permission.VIEW_NOTIFICATIONS) 쓰기에 VIEW 사용
- notifications.controller.ts:226-238 — Patch(':id/read'): @AuditLog 없음
- notifications.controller.ts:233 — @RequirePermissions(Permission.VIEW_NOTIFICATIONS) 동일
- 비교: DELETE(':id') (line 248-249)에는 @AuditLog + DELETE_NOTIFICATION 권한 정상 적용

액션:
1. markAllAsRead: @AuditLog({ action: 'update', entityType: 'notification' }) 추가
2. markAllAsRead: Permission.VIEW_NOTIFICATIONS → Permission.UPDATE_NOTIFICATION 변경
3. markAsRead: @AuditLog({ action: 'update', entityType: 'notification', entityIdPath: 'params.id' }) 추가
4. markAsRead: Permission.VIEW_NOTIFICATIONS → Permission.UPDATE_NOTIFICATION 변경

검증:
1. pnpm --filter backend run tsc --noEmit → 타입 에러 0
2. markAllAsRead/markAsRead 호출 → 감사 로그 생성 확인
3. VIEW_NOTIFICATIONS만 가진 사용자가 읽음 처리 불가 → UPDATE_NOTIFICATION 필요
```

### 🟡 MEDIUM — error.tsx / loading.tsx 루트별 미적용 (Mode 1)

```
문제:
Next.js App Router의 error.tsx(에러 바운더리)와 loading.tsx(로딩 스켈레톤)가
전체 라우트에 0개 존재. 비동기 데이터 로딩 시 빈 화면, 에러 시 전체 앱 크래시 가능.

검증됨:
- apps/frontend/app/(dashboard)/**/error.tsx — 0개 (glob 결과 빈 목록)
- apps/frontend/app/(dashboard)/**/loading.tsx — 0개 (glob 결과 빈 목록)
- 주요 비동기 라우트: equipment/[id], checkouts/[id], calibration-plans/[uuid],
  software/[id], non-conformances/[id], admin/* 등 30+ 라우트

액션:
1. (dashboard)/error.tsx — 공통 에러 바운더리 (최소 1개, 'use client' 필수)
2. (dashboard)/loading.tsx — 공통 로딩 스켈레톤 (최소 1개)
3. 데이터 무거운 페이지에 개별 loading.tsx 추가:
   - equipment/[id]/loading.tsx (장비 상세)
   - checkouts/[id]/loading.tsx (반출 상세)
   - calibration-plans/[uuid]/loading.tsx (교정계획 상세)
   - software/[id]/loading.tsx (소프트웨어 상세)

검증:
1. pnpm --filter frontend run tsc --noEmit → 타입 에러 0
2. 비동기 페이지 접근 시 로딩 스켈레톤 표시
3. 존재하지 않는 UUID 접근 시 에러 바운더리 표시 (앱 크래시 없음)
```

### 🟠 HIGH — 소프트웨어 유효성확인 승인 대시보드 QM 누락: findPending/count가 SUBMITTED만 조회 (Mode 0)

```
문제:
소프트웨어 유효성확인 워크플로우는 DRAFT→SUBMITTED→APPROVED→QUALITY_APPROVED 순서.
기술책임자(TM)가 승인(→APPROVED) 후, 품질책임자(QM)가 최종 등록해야 하지만
findPending()과 getSoftwareValidationCount()가 SUBMITTED 상태만 조회함.
QM의 승인 대시보드에 대기 항목이 0건으로 표시됨.

검증됨:
- software-validations.service.ts:518 — findPending() WHERE status = SUBMITTED만
- approvals.service.ts:1256 — getSoftwareValidationCount() WHERE status = SUBMITTED만
- approvals.service.ts:802 — getSoftwareValidationKpi() WHERE status = SUBMITTED만

액션:
1. findPending(): 호출자 역할에 따라 SUBMITTED(TM용) 또는 APPROVED(QM용) 필터링
2. getSoftwareValidationCount(): SUBMITTED + APPROVED 모두 카운트 (또는 역할별 분리)
3. getSoftwareValidationKpi(): 동일하게 APPROVED 포함

검증:
1. QM 로그인 → 승인 대시보드에서 APPROVED 상태 항목 표시 확인
2. TM 승인 후 → QM 뱃지 카운트 증가 확인
```

### 🟠 HIGH — test_software 테이블 createdBy 컬럼 누락 — 등록자 추적 불가 (Mode 0)

```
문제:
test_software 테이블에 createdBy 컬럼이 없어 누가 소프트웨어를 등록했는지 추적 불가.
서비스의 create(_createdBy)가 인자를 받지만 _ prefix로 폐기 중.
UL-QP-18 절차서는 등록자 추적을 요구함.

검증됨:
- packages/db/src/schema/test-software.ts — createdBy 컬럼 없음
- test-software.service.ts:79 — create(dto, _createdBy) 인자 폐기

액션:
1. test-software.ts: createdBy: uuid('created_by').references(() => users.id) 추가
2. service create(): _createdBy → createdBy, insert values에 포함
3. 마이그레이션 생성 (기존 데이터: 시드 사용자로 backfill)

검증:
1. pnpm --filter backend run db:generate → 마이그레이션 생성 성공
2. 소프트웨어 등록 → createdBy에 JWT 사용자 ID 저장 확인
```

### 🟠 HIGH — Dockerfile 구조 오류 3건: 존재하지 않는 패키지 + shared-constants 누락 + pnpm 버전 불일치 (Mode 1)

```
문제:
백엔드/프론트엔드 Dockerfile이 프로덕션 빌드를 차단하는 3가지 오류를 포함.

검증됨:
1. apps/backend/docker/Dockerfile:19,56,85 — packages/api-client, packages/ui COPY
   → 이 패키지들은 존재하지 않음 (packages/에는 db, schemas, shared-constants만)
2. apps/backend/docker/Dockerfile — packages/shared-constants COPY 누락
   → 백엔드가 @equipment-management/shared-constants를 import하지만 COPY 안됨
3. apps/backend/docker/Dockerfile:9,49,79 — pnpm@9.12.3 설치
   → package.json: "packageManager": "pnpm@10.7.1" (메이저 버전 불일치)

액션:
1. 존재하지 않는 packages/api-client, packages/ui COPY 제거
2. packages/shared-constants/package.json COPY 추가 (3개 stage 모두)
3. pnpm 버전 10.7.1로 통일 (backend + frontend Dockerfile)

검증:
1. docker build -f apps/backend/docker/Dockerfile . → 성공
2. docker build -f apps/frontend/Dockerfile . → 성공
```

### 🟠 HIGH — CI 보안: trivy-action@master 미고정 + copilot-setup-steps.yml 빌드 실패 (Mode 0)

```
문제:
1. trivy-action@master — 공급망 공격 위험 (미고정 브랜치)
2. copilot-setup-steps.yml — `npx run build` 명령 오류 + npm ci 사용 (pnpm 모노레포)

검증됨:
- .github/workflows/main.yml:325,334 — aquasecurity/trivy-action@master
- .github/workflows/copilot-setup-steps.yml:34 — npx run build (npx에 run 하위명령 없음)
- .github/workflows/copilot-setup-steps.yml:28 — npm ci (pnpm 모노레포에서 의존성 해석 실패)

액션:
1. trivy-action@master → @v0.28.0 (또는 특정 commit SHA) 고정
2. copilot-setup-steps.yml: npm ci → pnpm install --frozen-lockfile
3. copilot-setup-steps.yml: npx run build → pnpm build

검증:
1. CI 워크플로우 정상 실행
```

### 🟡 MEDIUM — 하드코딩 한국어 aria-label 6건 + locale-sniffing 핵 1건 (Mode 0)

```
문제:
프론트엔드 컴포넌트에 하드코딩된 한국어 aria-label과 locale-sniffing 패턴 존재.

검증됨:
- SoftwareTab.tsx:363 — t('softwareTab.download') === 'Download' ? 'Cancel' : '취소'
  → 번역 반환값으로 로케일 감지 후 하드코딩 (fragile)
- CheckoutAlertBanners.tsx:55 — aria-label="기한 초과 항목으로 이동"
- CheckoutAlertBanners.tsx:63 — aria-label="배너 닫기"
- CalibrationAlertBanners.tsx:59,84 — aria-label="배너 닫기" (2건)
- app/(auth)/error/page.tsx:13 — "장비 관리 시스템" 하드코딩
- app/(auth)/loading.tsx:75 — aria-label="로그인 페이지 로딩 중"

액션:
1. SoftwareTab.tsx: locale-sniffing 제거 → t('common.actions.cancel') 사용
2. 각 aria-label을 해당 i18n 키로 교체
3. auth error/loading: useTranslations 불가한 경우 서버 컴포넌트 패턴 또는 하드코딩 유지 (예외)

검증:
1. grep -r "aria-label=\"[가-힣]" apps/frontend/ → 0건
2. t() === 'value' 패턴 grep → 0건
```

### 🟡 MEDIUM — SoftwareTab/TestSoftwareDetail Unlink 버튼 aria-label 누락 2건 (Mode 0)

```
문제:
M:N 연결 해제 버튼이 아이콘(Unlink)만 포함하고 접근성 레이블이 없음.

검증됨:
- apps/frontend/components/equipment/SoftwareTab.tsx:299-306 — <Button> + <Unlink>, aria-label 없음
- apps/frontend/app/(dashboard)/software/[id]/TestSoftwareDetailContent.tsx:475-482 — 동일

액션:
1. 두 버튼에 aria-label={t('softwareTab.unlinkAriaLabel')} 추가
2. i18n 키 등록 (en/ko)

검증:
1. 두 버튼에 aria-label 속성 존재 확인
```

### 🟡 MEDIUM — software-validations rejectedBy relation 누락 + equipment_test_software testSoftwareId 인덱스 누락 (Mode 0)

```
문제:
1. softwareValidationsRelations에 rejectedBy user relation이 없어 Drizzle relational query 불가
2. equipment_test_software 테이블에 testSoftwareId 단독 인덱스 없어
   "이 소프트웨어와 연결된 장비 조회" 시 full scan

검증됨:
- packages/db/src/schema/software-validations.ts:72 — rejectedBy 컬럼 있음
- software-validations.ts:100-135 — relations에 rejectedBy 매핑 없음 (다른 6개 user FK는 모두 있음)
- packages/db/src/schema/equipment-test-software.ts:31-36 — 복합 unique 인덱스만
  (equipmentId 선두 컬럼 → testSoftwareId 단독 조회 커버 안됨)

액션:
1. softwareValidationsRelations에 rejectedByUser relation 추가
2. equipment-test-software.ts에 testSoftwareId 단독 인덱스 추가
3. 마이그레이션 생성

검증:
1. pnpm --filter backend run db:generate → 마이그레이션 성공
2. pnpm --filter backend run tsc --noEmit → 타입 에러 0
```

### 🟡 MEDIUM — linkEquipment/unlinkEquipment audit entityType 모호 + approve _comment 폐기 (Mode 0)

```
문제:
1. M:N 링크/언링크 감사로그 entityType이 'software'로 일반 CRUD와 구분 불가
2. 유효성확인 approve()/qualityApprove()가 comment 인자를 받지만 저장하지 않음

검증됨:
- test-software.controller.ts:87,98 — entityType: 'software' (CRUD와 동일)
- software-validations.service.ts:351 — approve(_comment?) 폐기
- software-validations.service.ts:403 — qualityApprove(_comment?) 폐기

액션:
1. linkEquipment: entityType → 'software-equipment-link'
2. unlinkEquipment: entityType → 'software-equipment-link'
3. approve/qualityApprove: _comment 파라미터 제거 (저장 컬럼 없으므로 API 계약에서도 제거)
   또는 approvalComment 컬럼 추가 결정 필요 (사용자 확인)

검증:
1. 감사 로그에서 링크/언링크 작업이 'software-equipment-link'으로 구분
2. 승인 API에서 comment 파라미터 동작 일관성 확인
```

### 🟢 LOW — docker/setup-buildx-action@v3 deprecation (Mode 0)

```
문제:
CI 워크플로우에서 docker/setup-buildx-action@v3을 사용 중이나 최신은 v5.
GitHub Actions deprecation 경고 발생 가능.

검증됨:
- .github/workflows/main.yml:276 — uses: docker/setup-buildx-action@v3

액션:
- docker/setup-buildx-action@v3 → @v5 업데이트

검증:
1. CI 워크플로우 정상 실행
```

---

## 📦 완료 항목 아카이브

<details>
<summary>완료된 항목 (36건)</summary>

### CRITICAL
- ~~소프트웨어 도메인 재설계 UL-QP-18-07 + UL-QP-18-09~~ — PR #104, 2026-04-04 (14차)
- ~~담당자(정/부) 이름 JOIN + Create/Edit 폼 필드 보완~~ — PR #105, 2026-04-05 (16차)
  findAll/findOne/findByEquipmentId LEFT JOIN users, Create/Edit 폼에 담당자/설치일/사이트 추가
- ~~유효성확인 첨부파일 인프라~~ — PR #105, 2026-04-05 (17차)
  documents.softwareValidationId FK + validation_vendor_attachment/validation_test_data 타입 + BE/FE API
  DB: test_software + software_validations + equipment_test_software, Backend: 2 modules, Frontend: /software pages, E2E: WF-14a/14b 14/14 PASS

### HIGH
- ~~장비↔시험용SW M:N 링크 CRUD + 양방향 UI~~ — 2026-04-05 (17차)
  POST/DELETE /test-software/:id/equipment, GET by-equipment, linkEquipment/unlinkEquipment, SoftwareTab M:N 표시
- ~~장비 상세 "소프트웨어/매뉴얼" 탭 통합 재설계~~ — 2026-04-05 (17차)
  SoftwareTab 3섹션 통합 (펌웨어+매뉴얼+관련SW), BY_EQUIPMENT API, queryKeys.testSoftware.byEquipment
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
<summary>거짓 양성 (19건)</summary>

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
- (18차) auth layout 한국어 metadata — Next.js static Metadata는 useTranslations 불가, 서버 컴포넌트 한계
- (18차) console.log LocationHistoryTab 3건 — process.env.NODE_ENV === 'development' 가드됨
- (18차) Label htmlFor 누락 — 프로젝트 전체 패턴 (shadcn Label 컴포넌트 구조상), 개별 프롬프트 범위 초과
- (18차) frontend Dockerfile pnpm 10.7.0 vs 10.7.1 — 패치 차이, 무의미
- (18차) test-software event emissions 리스너 없음 — 확장 포인트로 의도적 유지 가능, 실행 비용 미미
- (12차) pnpm/action-setup 버전 — v5는 현재 안정 버전, 업그레이드 불필요

</details>
