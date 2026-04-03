# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-04-03 (11차 — 절차서 기반 프롬프트 2건 추가)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용.

---

## 현재 미해결 프롬프트: 2건

### 🔴 CRITICAL — 소프트웨어 도메인 재설계: UL-QP-18-07 관리대장 + UL-QP-18-09 유효성 확인 (Mode 2)

```
문제:
현재 software 모듈은 "장비에 설치된 소프트웨어의 버전 변경 이력"을 추적하는 구조이다.
UL-QP-18-07(시험용 소프트웨어 관리대장)과 UL-QP-18-09(유효성확인 양식)이 요구하는 것은
"독립적인 시험용 소프트웨어 레지스트리 + 유효성 확인 워크플로우"이며, 현재 도메인 모델과 근본적으로 다르다.

현재 상태 (검증됨):
- packages/db/src/schema/software-history.ts: softwareHistory 테이블은 equipmentId FK로 장비 종속
- apps/backend/src/modules/software/software.service.ts: 변경 이력 CRUD + 승인 워크플로우만 존재
- packages/schemas/src/enums/software.ts: SoftwareType = measurement|analysis|control|other (4종)
- apps/frontend/app/(dashboard)/software/: 관리대장 페이지가 equipment JOIN 기반 집계

UL-QP-18-07 양식 필수 필드 (현재 미구현):
- 관리번호 (장비 관리번호 체계와 동일: XXX-P YYYY, 분류코드 P=Software Program.
    단, 기존 관리대장은 PNNNN 형식으로 시험소코드 없이 사용 중 — 하위 호환 필요.
    하나의 SW가 여러 시험분야에서 사용되므로 동일 번호 가능)
- 시험분야 (RF, SAR, EMC, RED, HAC — 기존 SoftwareType enum 대체)
- 담당자 (정, 부)
- 설치일자
- 제작사 (Vendor)
- 위치 (RF, SAR, EMC, Auto 등)
- 가용 여부 (가용/불가)
- 자체 유효성 검증 대상 여부

설계 결정 (확인됨):
- 장비:소프트웨어 = 1:1 관계 (equipment.softwareName/Version 단일 필드 유지)
- 관리번호 PNNNN은 unique가 아닐 수 있음 (P0043처럼 하나의 SW 패키지가 여러 모듈로 등록)
- SoftwareType enum(measurement|analysis|control|other) 삭제 → 시험분야(testField) enum으로 대체

UL-QP-18-09 양식 (완전 미구현):
- 방법 1: 공급자 시연 (vendorName, infoDate, summary, receivedBy, attachments)
- 방법 2: UL 자체 시험 (acquisition/processing/control 기능별 검증, 수락기준, 시험일자, 승인자)
- 기술책임자 → 품질책임자 제출 워크플로우

액션:
1단계 — DB 스키마 설계:
  - test_software 테이블 신규 생성 (관리번호 PNNNN, 소프트웨어명, 버전, 시험분야, 담당자정/부, 설치일자, 제작사, 위치, 가용여부, 유효성검증대상 여부)
  - software_validations 테이블 신규 생성 (softwareId FK, validationType: vendor|self, 방법별 필드, 상태: draft→submitted→approved, 기술책임자/품질책임자 승인)
  - 기존 software_history 테이블 삭제 (절차서에 없는 과잉 설계)
  - equipment 테이블의 softwareName/softwareVersion 필드는 유지 (이력카드 항목 7 대응)

2단계 — Backend:
  - TestSoftwareModule: CRUD + 관리번호 자동 채번 (분류코드 P 활용, 기존 PNNNN 하위 호환)
  - SoftwareValidationModule: 유효성 확인 양식 생성/제출/승인 워크플로우
  - 기존 SoftwareModule 삭제: software_history 테이블 및 관련 코드 전부 제거
    (장비-소프트웨어 관계는 equipment.softwareName/softwareVersion 필드로 충분,
     절차서에 "장비별 소프트웨어 버전 변경 이력 추적" 요구사항 없음)

3단계 — Frontend:
  - /software 페이지: 독립 시험용 소프트웨어 관리대장 (UL-QP-18-07 양식 기반)
  - /software/[id]: 소프트웨어 상세 (버전, 제작사, 시험분야, 담당자, 가용여부)
  - /software/[id]/validation: 유효성 확인 양식 작성/조회 (UL-QP-18-09)
  - /equipment/[id]/software 페이지 제거 (장비 상세의 기본정보에 소프트웨어명/버전 필드로 대체)

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
1. pnpm --filter backend run db:generate → 마이그레이션 생성 성공 (software_history DROP, test_software/software_validations CREATE)
2. pnpm --filter backend run tsc --noEmit → 타입 에러 0
3. pnpm --filter frontend run tsc --noEmit → 타입 에러 0
4. 관리대장 페이지에서 P0001~P0073 초기 데이터 시딩 후 조회 가능
5. 유효성 확인 양식 작성 → 기술책임자 승인 → 품질책임자 등록 워크플로우 E2E 통과
6. 기존 software_history 관련 코드/라우트/컴포넌트 완전 제거 확인 (grep 0건)
7. equipment 상세 페이지에서 softwareName/softwareVersion 필드 정상 표시
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
    (항목 7 "관련 소프트웨어" = equipment.softwareName/Version, 소프트웨어 변경 이력은 절차서 범위 밖)
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

</details>
