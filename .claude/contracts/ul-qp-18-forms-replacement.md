# 스프린트 계약: UL-QP-18 양식 3종 교체 + 아키텍처 개선

## Slug
`ul-qp-18-forms-replacement`

## 범위
UL-QP-18-01 시험설비 관리대장 / UL-QP-18-03 중간점검표 / UL-QP-18-05 자체점검표의
(1) 양식 파일 교체, (2) 자체점검 DB snapshot 컬럼 추가, (3) Data/Renderer/Layout 3-way 분리,
(4) 라벨·셀 좌표 SSOT 이관, (5) xlsx-helper 공용화.

## 성공 기준

### 필수 (MUST) — 반복 차단

#### 전체 품질 게이트
- [ ] M-1: `pnpm tsc --noEmit` exit 0
- [ ] M-2: `pnpm --filter backend run build` PASS
- [ ] M-3: `pnpm --filter backend run test` PASS (전체 suite, 회귀 0건)
- [ ] M-4: `pnpm --filter backend run lint` warning + error 0건
- [ ] M-5: `pnpm --filter frontend run lint` warning + error 0건
- [ ] M-6: 신규 `any` 타입 0건 (`grep -rn ": any\|<any>\|as any"` 신규 파일에서 0)
- [ ] M-7: eslint-disable 주석 0건 (신규 파일)
- [ ] M-8: `git status` clean (작업 파일만 commit, QR/data-migration 미혼입)
- [ ] M-9: 브랜치 `main`, 새 브랜치 미생성

#### Phase 1 — DB 마이그레이션
- [ ] M-P1-a: `packages/db/src/schema/equipment-self-inspections.ts`에 `classification` 컬럼 존재 (varchar(20), `$type<EquipmentClassification>()`, nullable).
- [ ] M-P1-b: 동 파일에 `calibrationValidityPeriod: varchar('calibration_validity_period', { length: 50 })` nullable 존재.
- [ ] M-P1-c: `apps/backend/drizzle/NNNN_add_self_inspection_snapshot.sql` 신규 파일 존재, `ALTER TABLE equipment_self_inspections ADD COLUMN classification` + `... calibration_validity_period` 2건 포함.
- [ ] M-P1-d: `db:reset` 후 DB 실측 컬럼 존재 (`\d equipment_self_inspections`).
- [ ] M-P1-e: self-inspections.service.ts 생성 경로에서 snapshot 저장 (장비 마스터에서 현재 값 읽어 insert).

#### Phase 2 — SSOT Layout
- [ ] M-P2-a: 3개 layout 파일 신규 존재:
  - `apps/backend/src/modules/intermediate-inspections/services/intermediate-inspection.layout.ts`
  - `apps/backend/src/modules/self-inspections/services/self-inspection.layout.ts`
  - `apps/backend/src/modules/reports/layouts/equipment-registry.layout.ts`
- [ ] M-P2-b: 각 layout에 `FORM_NUMBER` 상수 + `@see docs/procedure/template/...` 주석 포함.
- [ ] M-P2-c: 3개 layout 모두 셀 좌표 상수(HEADER_CELLS 또는 COLUMNS) + 섹션 구조 상수(emptyRows/startRow/columns) export.
- [ ] M-P2-d: `packages/schemas/src/enums/labels.ts`에 아래 4개 상수 export 존재:
  - `EQUIPMENT_AVAILABILITY_LABELS`, `INTERMEDIATE_CHECK_YESNO_LABELS`, `INSPECTION_JUDGMENT_LABELS`, `SELF_INSPECTION_RESULT_LABELS`
- [ ] M-P2-e: schemas 패키지 빌드 성공 (`pnpm --filter @equipment-management/schemas build`)

#### Phase 3 — Data/Renderer 분리
- [ ] M-P3-a: 6개 service 파일 신규 존재 (각 양식 × 2):
  - `intermediate-inspection-export-data.service.ts` + `intermediate-inspection-renderer.service.ts`
  - `self-inspection-export-data.service.ts` + `self-inspection-renderer.service.ts`
  - `equipment-registry-data.service.ts` + `equipment-registry-renderer.service.ts`
- [ ] M-P3-b: `xlsx-helper.ts` 신규 존재, ≥4 함수 export (loadWorkbookByName / applyRowStyles / writeDataRow / clearTrailingRows).
- [ ] M-P3-c: `form-template-export.service.ts` 행수 축소 (기존 2168 → 목표 1500 이하).
- [ ] M-P3-d: `form-template-export.service.ts`에서 인라인 `MANAGEMENT_METHOD_LABELS`/`STATUS_TO_AVAILABILITY` private 상수 2개 **제거** 확인.
- [ ] M-P3-e: 각 renderer 서비스가 `@equipment-management/schemas`에서 라벨 import.
- [ ] M-P3-f: NestJS providers 등록 확인.

#### Phase 4 — Workflow 매핑
- [ ] M-P4-a: 자체점검 renderer에 `classificationLabel === '비교정기기' ? 'N/A' : '-'` 리터럴 **제거** 확인 (SSOT CLASSIFICATION_LABELS + validityPeriod 직접 사용).
- [ ] M-P4-b: `'교정기기'` / `'비교정기기'` 리터럴은 layout 및 schemas 외 파일에 없음.
- [ ] M-P4-c: 자체점검 data 서비스가 record.classification/calibrationValidityPeriod fallback 처리.
- [ ] M-P4-d: 결재란 매핑 주석 명시 (담당/검토/승인 소스).

#### Phase 5 — Equipment Registry 매핑
- [ ] M-P5-a: `equipment-registry-renderer.service.ts`가 schemas의 SSOT 라벨만 사용.
- [ ] M-P5-b: `INTERMEDIATE_CHECK_YESNO_LABELS` 사용으로 `'O' : 'X'` 인라인 삼항 제거.
- [ ] M-P5-c: 워크시트명/제목 prefix가 layout 상수(SHEET_NAMES/TITLE_PREFIX) 경유.

#### Phase 6 — 양식 파일 교체
- [ ] M-P6-a: `docs/procedure/template/` 하위 3개 신규 파일 존재 (SHA256 또는 바이트 크기가 기존과 다름).
- [ ] M-P6-b: 기존 긴 파일명 (`UL-QP-18-01(02) 시험설비 관리대장_SUW_RF_20260202...xlsx`) 삭제됨 — 저장소에 중복 없음.
- [ ] M-P6-c: `db:reset` 후 form_templates 테이블에 3개 양식이 현행 row(`is_current=true`)로 존재.
- [ ] M-P6-d: 양식 구조 회귀 없음 — 3개 모두 export 200 + 파일 크기 > 5KB.

#### Phase 7 — 시드/E2E
- [ ] M-P7-a: `self-inspections.seed.ts`, `intermediate-inspections.seed.ts` 신규 각 ≥1건 데이터, classification/validityPeriod snapshot 포함.
- [ ] M-P7-b: `xlsx-helper.spec.ts` ≥4 유닛 테스트 PASS.
- [ ] M-P7-c: wf-19b(중간), wf-20b(자체), wf-21(장비대장) 3개 e2e 전부 PASS.
- [ ] M-P7-d: 기존 form-templates.spec.ts(업로드/다운로드 PR #157 계약) PASS 회귀.
- [ ] M-P7-e: 신규 e2e에서 SSOT 라벨 검증 포함 (예: xlsx D열 '외부교정' 존재, docx '합격' 존재).

#### Phase 8 — 문서
- [ ] M-P8-a: `docs/manual/report-export-mapping.md` §3.1/3.3/3.5 갱신 (SSOT 라벨 테이블 + 양식 교체 절차 섹션 신설).
- [ ] M-P8-b: `docs/manual/forms-index.md` "마지막 교체일: 2026-04-17" 반영 (3개 양식).
- [ ] M-P8-c: `docs/references/backend-patterns.md`에 "XLSX 렌더 3-way 분리" 섹션 ≥15줄 추가.

### SSOT/하드코딩/보안 검증
- [ ] M-V-a: **verify-ssot** — enum·라벨 로컬 재정의 0건 (schemas 경유).
- [ ] M-V-b: **verify-hardcoding** — 지정 리터럴 (시험설비 관리대장·교정기기·비교정기기·합격·불합격·이상 없음·부적합·사용·고장·여분·setDataRows 매직넘버) 0건 (layout.ts + schemas 외).
- [ ] M-V-c: **verify-cache-events** — 자체점검 invalidateCache 호출 개수 회귀 없음.
- [ ] M-V-d: **verify-sql-safety** — parameterized binding만 사용, ANY(array) 패턴 없음.

### 보안
- [ ] M-Sec-a: 3개 export endpoint의 `@RequirePermissions(Permission.VIEW_FORM_TEMPLATES)` 또는 export 전용 permission 유지 — reports.controller.ts EnforcedScope 주입 유지.
- [ ] M-Sec-b: 양식 교체(replaceCurrentFile) 엔드포인트는 `MANAGE_FORM_TEMPLATES` 유지.
- [ ] M-Sec-c: renderer에서 사용자 입력 텍스트(inspection.remarks, item.checkItem 등) 전부 `escapeXml()` 경유하여 XML injection 방어.
- [ ] M-Sec-d: cross-site 경계 강제 — data service가 `filter.site`/`filter.teamId`로 차단 (기존 로직 이관 확인).

---

### 권장 (SHOULD) — tech-debt 등록 가능, 반복 차단 X

- [ ] S-1: **review-architecture** Critical 이슈 0개.
- [ ] S-2: **playwright-e2e** wf-19b/wf-20b/wf-21 GREEN + UI smoke (form-templates 목록에서 현재 3개 양식 다운로드 가능).
- [ ] S-3: 벤치마크 — export 응답시간 기존 대비 +10% 이내 (N=100 equipment 기준).
- [ ] S-4: 접근성 — form-templates 목록 페이지 aria-label/키보드 탭 순서 변경 없음 확인.
- [ ] S-5: i18n — 서버 렌더 라벨 ko only 유지. 프론트 UI는 i18n 메시지 경유.
- [ ] S-6: `xlsx-helper.spec.ts` 외 `equipment-registry-renderer.service.spec.ts` 단위 테스트 추가 (SSOT 라벨 경유, 빈 행 처리, 대체 시트명 fallback).
- [ ] S-7: `docx-xml-helper.spec.ts` 커버리지 확장 (이전 UL-QP-18-02 평가의 S-4 tech-debt 연속).

---

## 이번 작업 회피 사항
- 기존 SSOT(`MANAGEMENT_METHOD_LABELS`, `CLASSIFICATION_LABELS` 등 schemas 기존 상수) 재정의 금지.
- 양식 번호/이름/보존연한 수정 금지 (FORM_CATALOG은 절차서 원문 SSOT).
- 신규 이벤트·알림 종류 추가 금지 (snapshot 컬럼 변경만, 기존 invalidateCache 재사용).
- `form-template.service.ts`의 업로드/다운로드 API signature 유지 (PR #157 계약).
- QR / data-migration / audit-log 관련 파일 변경 금지 (작업 범위 밖).
- Excel 스트림 write 도입 금지 (tech-debt S-3 감시, 현재 불필요).

---

## 반복 판정 규칙
- **PASS**: 모든 MUST 항목 체크 완료 + 전체 테스트 PASS + git status clean.
- **FAIL(반복 필요)**: MUST 1건이라도 미충족. 수정 지시 반영 후 재검증.
- **SHOULD 미달**: tech-debt 등록하고 PASS 처리 가능 (시니어 아키텍트 판단).
