# UL-QP-18 양식 3종 교체 + DB 스키마 매칭 전면 개선

## 메타
- 생성: 2026-04-17
- 모드: Mode 2 (Harness)
- Slug: ul-qp-18-forms-replacement
- 대상 양식: UL-QP-18-01(02) 시험설비 관리대장 / UL-QP-18-03(02) 중간점검표 / UL-QP-18-05(01) 자체점검표
- 예상 변경: 약 20~24개 파일 (프로덕션 14~16 + 테스트 3~4 + 문서 2~3 + 마이그레이션 1)
- 사전 조건: main 브랜치, pre-push hook 정상, `pnpm --filter backend run db:reset` 직후 상태

## Context
사용자 요청은 (1) `/mnt/c/Users/kmjkd/Downloads/양식/` 경로의 3개 신규 양식 파일을 저장소 `docs/procedure/template/`의 현행 파일과 교체하고, (2) UL-QP-18-02 이력카드 수준의 아키텍처 개선을 동일 원칙(SSOT · 비하드코딩 · 워크플로/성능/보안/접근성 Phase별)으로 수행하는 것.

현행 구현(`form-template-export.service.ts` 2168줄)이 3개 양식 모두를 단일 서비스에 인라인으로 렌더하며, 셀 좌표·라벨·enum 문자열 다수가 파일에 박혀 있다. 이력카드와 동일하게 Data/Renderer/Layout 3-way 분리로 surgical 개정이 가능하도록 재정비한다.

## 설계 철학
1. **양식 원본 = SSOT**: 셀/라벨/섹션은 원본 docx·xlsx에서만 유래. 개정 시 layout 상수만 업데이트.
2. **서비스가 아닌 경로만 신설**: 자체점검/중간점검/장비대장은 기존 서비스(equipment/intermediate-inspections/self-inspections/reports) 재사용. 새 도메인 로직 금지 (`feedback_qr_is_path_not_workflow.md`).
3. **snapshot 일관성**: 점검 당시의 classification/validityPeriod는 장비 마스터 변경에 영향받지 않도록 기록 시점 값 저장 (중간점검과 동일).
4. **렌더 라이브러리 분리**: docx는 `docx-xml-helper.ts` 재사용, xlsx는 `xlsx-helper.ts` 신설(ExcelJS 기반).

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| 자체점검 classification/validityPeriod | DB 컬럼 신규 (snapshot) | 중간점검 일관성, 장비 재교정 후 과거 기록 무결성 |
| 양식 파일 반영 경로 | seed 파일 교체 (`docs/procedure/template/`) + self-heal | 기존 `seedFromFilesystem` 패턴 재사용, 운영 DB는 Replace API 수동 실행 |
| docx 3-way 분리 | Layout + Data + Renderer 3-way (이력카드 동일) | 양식 개정 시 surgical |
| xlsx 분리 | ExcelJS 공용 helper + layout 상수 | `exportEquipmentRegistry` 한 양식뿐이지만 `UL-QP-19-01`, `UL-QP-18-08`도 향후 동일 패턴 적용 가능 |
| 가용여부 매핑 SSOT | `packages/schemas/src/enums/labels.ts`에 `EQUIPMENT_AVAILABILITY_LABELS` 신규 | 기존 `EQUIPMENT_STATUS_LABELS`와 의미 다름(사용/고장/여분 3종 축약) |
| 중간점검 대상 O/X 매핑 | `packages/schemas/src/enums/labels.ts`에 `INTERMEDIATE_CHECK_YESNO_LABELS` | 하드코딩 제거 |
| Equipment Registry 스트리밍 | ExcelJS `writeBuffer()` 유지 + `EXPORT_QUERY_LIMITS.FULL_EXPORT` 유지 | 현재 <5,000건, 메모리 <100MB, 스트림 도입은 overengineering — tech-debt로 감시 |
| i18n 키 위치 | 서버 렌더 라벨은 schemas 라벨 상수(서버 전용), 프론트 UI는 i18n 메시지 경유 | 기존 규약 유지 |

## Phase 0 — 현재 상태 diff (양식 vs 구현 괴리)

양식 파싱 결과(`/tmp/harness-form-context.md`)와 `form-template-export.service.ts` L183~865 현재 구현을 테이블로 대조.

### UL-QP-18-01(02) 시험설비 관리대장 (xlsx)

| 셀 | 양식 헤더 | 현재 구현 매핑 | 괴리 |
|---|---|---|---|
| A | 관리번호 | `row.managementNumber` | 없음 |
| B | 자산번호 | `row.assetNumber ?? 'N/A'` | 없음 |
| C | 장비명 | `row.name` | 없음 |
| D | 관리방법 | `MANAGEMENT_METHOD_LABELS[row.managementMethod]` (로컬 하드코딩) | **하드코딩**. schemas의 `MANAGEMENT_METHOD_LABELS` 재사용 필요 (Rule 0) |
| E | 최종교정일 | `formatDate(row.lastCalibrationDate)` | 없음 |
| F | 교정기관 | `row.calibrationAgency` | 없음 |
| G | 교정주기(개월) | `row.calibrationCycle` | 없음 |
| H | 차기교정일 | `formatDate(row.nextCalibrationDate)` | 없음 |
| I | 제조사 | `row.manufacturer` | 없음 |
| J | 구입년도 | `row.purchaseYear` | 없음 |
| K | 모델명 | `row.modelName` | 없음 |
| L | 일련번호 | `row.serialNumber` | 없음 |
| M | 장비사양 | `row.description` | 없음 |
| N | 위치 | `row.location` | 없음 |
| O | 중간점검 대상 | `row.needsIntermediateCheck ? 'O' : 'X'` (인라인) | **하드코딩**. SSOT 상수화 |
| P | 가용 여부 | `STATUS_TO_AVAILABILITY[row.status]` (로컬 하드코딩) | **하드코딩**. schemas SSOT 이관 |
| Row 1 | 제목+업데이트일 | L252~257 인라인 문자열 | **라벨 하드코딩**. layout 상수 이관 |
| 워크시트명 | `시험설비 관리대장` | L242~243 인라인 + alias 체크 | **라벨 하드코딩** |
| 시작 행 | Row 3 (DATA_START_ROW) | L261 상수 | 없음 (이미 상수) |

### UL-QP-18-03(02) 중간점검표 (docx)

| 테이블/셀 | 양식 | 현재 구현 매핑 | 괴리 |
|---|---|---|---|
| T0 R0 C1/C3 | 분류 / 관리팀 | `classificationLabel` ('교정기기'/'비교정기기' 인라인) / `teamRow.teamName` | **라벨 인라인** (L427~428). layout으로 이관 + CLASSIFICATION_LABELS 재사용 |
| T0 R1 C1/C3 | 관리번호 / 장비위치 | `inspection.managementNumber` / `inspection.equipmentLocation` | 없음 |
| T0 R2 C1/C3 | 장비명 / 모델명 | `inspection.equipmentName` / `inspection.equipmentModel` | 없음 |
| T0 R3 C1/C3 | 점검주기 / 교정유효기간 | `inspection.inspectionCycle` / `inspection.calibrationValidityPeriod` | 없음 (snapshot 기존 존재) |
| T0 R5 header | 점검 기준 / 점검 결과 / 판정 | 직접 주입 | 없음 |
| T0 R6+ items | 점검항목 5행(빈행 4) | `doc.setDataRows(0, 6, itemData, 4)` (하드코딩 매직넘버 `6`, `4`) | **매직넘버**. layout SECTIONS로 이관 |
| T1 R0 title | 측정 장비 List | 양식 원본 유지 | 없음 (없는 변경) |
| T1 R2+ 4행(빈행3) | ME 데이터 | `doc.setDataRows(1, 2, meData, 3)` 매직넘버 | **매직넘버** layout |
| T2 R0 | 점검일 / 결재 담당/검토/승인 | `formatDate(inspectionDate)` / 서명 이미지 | 없음 |
| T2 R1 C4/C5/C6 | 담당(서명)/검토(서명)/승인(서명) | `insertDocxSignature` ×3 (L545~568) | 없음 |
| 판정 매핑 | pass/fail/- | `item.judgment === 'pass' ? '합격' : ...` (인라인) | **라벨 인라인** (L448). SSOT `INSPECTION_JUDGMENT_LABELS` 필요 |
| 결과 섹션 | 동적 측정 결과 | `renderResultSections(doc, id, 'intermediate')` | 없음 |

### UL-QP-18-05(01) 자체점검표 (docx)

| 테이블/셀 | 양식 | 현재 구현 매핑 | 괴리 |
|---|---|---|---|
| T0 R0 C1/C3 | 분류 / 관리팀 | `calibrationRequired === 'required' ? '교정기기' : '비교정기기'` / `teamRow.teamName` | **스냅샷 부재**: 장비 마스터의 `calibrationRequired`를 runtime 조회. 재교정 후 과거 기록 드리프트. `classification` 컬럼 부재(DB Gap) |
| T0 R1 C1/C3 | 관리번호 / 장비위치 | `eqRow.managementNumber` / `eqRow.location` | 없음 |
| T0 R2 C1/C3 | 장비명 / 모델명 | `eqRow.name` / `eqRow.modelName` | 없음 |
| T0 R3 C1/C3 | 점검주기 / 교정유효기간 | `${record.inspectionCycle}개월` / `classificationLabel === '비교정기기' ? 'N/A' : '-'` (L709~710) | **validityPeriod 하드코딩 '-'**: 실제 값 없음. `calibrationValidityPeriod` 컬럼 부재(DB Gap) |
| T0 R6+ items | 점검항목 | `doc.setDataRows(0, 6, itemData, 6)` | **매직넘버** |
| T1 R1+ | 기타 특기사항 3행(빈행2) | `doc.setDataRows(1, 1, noteData, 2)` | **매직넘버** |
| T2 R0/R1/R2 | 점검일/점검자/특기사항 + 결재 담당/검토/승인 | `inspector?.name`, submitter=담당+검토, approver=승인 (L831~854) | 없음 (워크플로 매핑 이미 정확) |
| 결과 라벨 | pass/fail/N/A → "이상 없음"/"부적합"/"N/A" | L714 인라인 함수 `resultLabel` | **라벨 인라인**. SSOT `SELF_INSPECTION_RESULT_LABELS` 필요 |

### Gap 요약

1. **DB snapshot 누락 (Critical)**: 자체점검에 `classification`, `calibrationValidityPeriod` 컬럼 없음 → 양식 헤더가 장비 마스터에서 runtime 조회되어 드리프트 위험.
2. **SSOT 위반 (Critical)**: 9개 이상의 enum/라벨 맵이 서비스 파일 인라인 — `STATUS_TO_AVAILABILITY` / `MANAGEMENT_METHOD_LABELS` 로컬 / '교정기기|비교정기기' 리터럴 / '합격|불합격' / '이상 없음|부적합|N/A' / 'O|X' / 워크시트명 '시험설비 관리대장' / 제목 프리픽스 (팀).
3. **매직 넘버 (Important)**: `setDataRows`의 (table, startRow, emptyRows) 인자 모두 매직넘버.
4. **양식 파일 교체 (Important)**: 3개 파일 모두 `docs/procedure/template/`에 있으나 새 파일과 바이트 비교 필요. 동일하면 교체 불필요(양식 내용은 개정번호 일치상 동일 가능성), 다르면 교체 후 `seedFromFilesystem` + 운영은 Replace API.

## Phase 1 — DB 마이그레이션 (자체점검 snapshot 컬럼)

**목표**: 자체점검 기록에 classification/validityPeriod를 기록 시점 snapshot으로 저장.

**변경 파일:**
1. `packages/db/src/schema/equipment-self-inspections.ts` — 수정:
   - `classification: varchar('classification', { length: 20 }).$type<EquipmentClassification>()` 추가 (nullable — 기존 행 보호)
   - `calibrationValidityPeriod: varchar('calibration_validity_period', { length: 50 })` 추가 (nullable)
   - 중간점검 스키마(`intermediate-inspections.ts` L43~45)와 동일 타입/길이로 정합성 유지
2. `apps/backend/drizzle/NNNN_add_self_inspection_snapshot.sql` — `pnpm --filter backend run db:generate`로 자동 산출:
   ```sql
   ALTER TABLE equipment_self_inspections ADD COLUMN classification varchar(20);
   ALTER TABLE equipment_self_inspections ADD COLUMN calibration_validity_period varchar(50);
   ```
   backfill 없음 (null 유지) — 렌더러는 장비 마스터 fallback 제공.
3. `packages/schemas/src/dto/self-inspection.ts` (신규 또는 기존) — create DTO에 `classification?`, `calibrationValidityPeriod?` optional 필드 추가.
4. `apps/backend/src/modules/self-inspections/self-inspections.service.ts` — 생성 시 장비 마스터에서 현재 classification/validityPeriod를 읽어 insert 시 snapshot으로 저장 (중간점검 동일 로직 확인 후 복제).

**변경 금지:**
- 기존 레거시 고정 컬럼 `appearance`/`functionality`/`safety`/`calibrationStatus`: 하위 호환 유지.

**검증:**
```bash
pnpm --filter backend run db:generate  # 마이그레이션 산출 확인
pnpm --filter backend run db:reset     # 초기화 후 적용
pnpm tsc --noEmit
```

## Phase 2 — SSOT Layout 상수 이관

**목표**: 3개 양식 레이아웃을 backend-local layout 파일로 분리. 각 상수는 양식 원본 참조 주석 필수.

**변경 파일:**
1. `apps/backend/src/modules/intermediate-inspections/services/intermediate-inspection.layout.ts` — 신규
   - `FORM_NUMBER = 'UL-QP-18-03'`
   - `TABLE_INDEX = { HEADER: 0, MEASURE_EQUIPMENT: 1, SIGN_OFF: 2 }`
   - `HEADER_CELLS`: `{ classification: {row:0,col:1}, teamName:{row:0,col:3}, managementNumber:{row:1,col:1}, location:{row:1,col:3}, equipmentName:{row:2,col:1}, modelName:{row:2,col:3}, inspectionCycle:{row:3,col:1}, validityPeriod:{row:3,col:3} }`
   - `ITEMS_SECTION`: `{ startRow:6, emptyRows:4, columns:5 }` (양식 원본 실측)
   - `MEASURE_EQUIPMENT_SECTION`: `{ tableIndex:1, startRow:2, emptyRows:3 }`
   - `SIGN_OFF_CELLS`: `{ inspectionDate:{row:0,col:1}, inspectorName:{row:1,col:1}, remarks:{row:2,col:1}, chargeSig:{row:1,col:4}, reviewSig:{row:1,col:5}, approveSig:{row:1,col:6} }`
   - 각 상수에 `@see docs/procedure/template/UL-QP-18-03(02) 중간점검표.docx` + "양식 원본 T2 R1 C4 = 결재란 담당 서명" 식 주석.
2. `apps/backend/src/modules/self-inspections/services/self-inspection.layout.ts` — 신규
   - `FORM_NUMBER = 'UL-QP-18-05'`
   - 중간점검과 동일 구조. 단 ITEMS_SECTION은 `emptyRows:6, columns:3`
   - `SPECIAL_NOTES_SECTION`: `{ tableIndex:1, startRow:1, emptyRows:2, columns:3 }`
3. `apps/backend/src/modules/reports/layouts/equipment-registry.layout.ts` — 신규 (reports 모듈 로컬)
   - `FORM_NUMBER = 'UL-QP-18-01'`
   - `SHEET_NAMES = ['시험설비 관리대장', '시험설비 관리 대장']` (대체 시트명)
   - `TITLE_PREFIX = '시험설비 관리대장'`, `TITLE_ALL_SUFFIX = '(전체)'`
   - `UPDATE_DATE_CELL = { row:1, col:14 }`
   - `DATA_START_ROW = 3`, `COLUMN_COUNT = 16`
   - `COLUMNS`: `readonly [{key:'managementNumber', header:'관리번호'}, ...]` (16개) — 렌더와 헤더 검증 공용
4. `packages/schemas/src/enums/labels.ts` — 수정: 아래 SSOT 라벨 추가
   - `EQUIPMENT_AVAILABILITY_LABELS: Record<EquipmentStatus, '사용'|'고장'|'여분'|'불용'>` (현재 서비스 L172~181 이관)
   - `INTERMEDIATE_CHECK_YESNO_LABELS: { true:'O', false:'X' }`
   - `INSPECTION_JUDGMENT_LABELS: Record<InspectionJudgment, string>` — pass:'합격', fail:'불합격'
   - `SELF_INSPECTION_RESULT_LABELS: Record<SelfInspectionResult, string>` — pass:'이상 없음', fail:'부적합', na:'N/A' (현재 L714 인라인 이관)
5. `packages/schemas/src/enums/index.ts` — 신규 export 반영.

**변경 금지:**
- 셀 좌표 값은 양식 원본에서만 유래. 추측 금지. 기존 서비스 코드의 (table, row, col) 숫자를 그대로 이관하되, 주석으로 양식 원본의 실제 라벨 텍스트 기록.
- 프론트 UI에서 이 상수 참조 금지 (frontend-patterns: i18n 메시지 사용).

**검증:**
```bash
pnpm tsc --noEmit
# 수동: 각 layout.ts에 @see docs/procedure/template/... 주석 + 원본 셀 텍스트 주석 확인
```

## Phase 3 — Data/Renderer 분리

**목표**: 각 양식마다 Data service(DB 집계) + Renderer service(DOCX/XLSX 주입) 분리. `form-template-export.service.ts`는 dispatcher로 축소.

**변경 파일:**
1. `apps/backend/src/modules/intermediate-inspections/services/intermediate-inspection-export-data.service.ts` — 신규
   - `getData(inspectionId, filter): Promise<IntermediateInspectionExportData>` — 기존 L336~422 로직 이관
   - filter 스코프 검증 포함 (site/teamId)
2. `apps/backend/src/modules/intermediate-inspections/services/intermediate-inspection-renderer.service.ts` — 신규
   - `render(data, templateBuf): Promise<Buffer>` — DocxTemplate 사용, layout.ts 상수만 참조
   - 기존 L424~579 로직 이관 (사진 삽입 + renderResultSections 호출 포함)
3. `apps/backend/src/modules/self-inspections/services/self-inspection-export-data.service.ts` — 신규 (L599~697 이관)
4. `apps/backend/src/modules/self-inspections/services/self-inspection-renderer.service.ts` — 신규 (L698~864 이관)
5. `apps/backend/src/modules/reports/services/equipment-registry-data.service.ts` — 신규 (reports 로컬, L183~231 이관)
6. `apps/backend/src/modules/reports/services/equipment-registry-renderer.service.ts` — 신규 (L238~314 이관, ExcelJS 기반)
7. `apps/backend/src/modules/reports/xlsx-helper.ts` — 신규 (재사용 범용 유틸)
   - `loadWorkbookByName(buf, names): Worksheet` — 대체 시트명 지원
   - `applyRowStyles(sheet, rowIdx, columnCount): Style[]` — 스타일 참조 행 → 복제 템플릿
   - `writeDataRow(sheet, rowIdx, values, styles)`
   - `clearTrailingRows(sheet, startRow, endRow, columnCount)`
   - 에러는 `FormRenderError` (docx-xml-helper 재사용) throw
8. `apps/backend/src/modules/reports/form-template-export.service.ts` — **대폭 축소**
   - `exportEquipmentRegistry` / `exportIntermediateInspection` / `exportSelfInspection` 메서드를 dispatcher로 변경 (각 3~5줄)
   - 기존 인라인 로직 전부 새 service로 이관
   - `STATUS_TO_AVAILABILITY`, `MANAGEMENT_METHOD_LABELS` private 상수 삭제 (schemas SSOT 사용)
   - 2168줄 → 목표 1500줄 이하
9. `apps/backend/src/modules/intermediate-inspections/intermediate-inspections.module.ts` — 수정: `IntermediateInspectionExportDataService` + `IntermediateInspectionRendererService` providers 등록 + export
10. `apps/backend/src/modules/self-inspections/self-inspections.module.ts` — 수정: 동일
11. `apps/backend/src/modules/reports/reports.module.ts` — 수정:
    - intermediate-inspections.module.ts + self-inspections.module.ts imports 추가
    - `EquipmentRegistryDataService` + `EquipmentRegistryRendererService` providers
    - `xlsx-helper`는 유틸(클래스 없음, 함수 export)이므로 별도 provider 불필요

**변경 금지:**
- `docx-template.util.ts`의 `DocxTemplate` 클래스: 기존 메서드 시그니처 유지.
- `docx-xml-helper.ts`: 확장만 허용 (xlsx-helper와는 독립).
- `renderResultSections` (동적 결과 섹션): 기존 로직 유지, renderer 서비스에서 호출만.

**검증:**
```bash
pnpm tsc --noEmit
pnpm --filter backend run test intermediate-inspection-renderer
pnpm --filter backend run test self-inspection-renderer
pnpm --filter backend run test equipment-registry-renderer
pnpm --filter backend run build
```

## Phase 4 — Workflow 매핑 (snapshot 경로 반영)

**목표**: 자체점검 렌더 시 classification/validityPeriod를 snapshot(record) → 장비 마스터 fallback 순으로 표시. 중간점검은 기존 snapshot 유지.

**변경 파일:**
1. `apps/backend/src/modules/self-inspections/services/self-inspection-export-data.service.ts` — 수정 (Phase 3에서 신규, 여기서 내용 확정):
   - `classification = record.classification ?? (eqRow.calibrationRequired === 'required' ? 'calibrated' : 'non_calibrated')`
   - `validityPeriod = record.calibrationValidityPeriod ?? null` (fallback 없음 — null이면 '-')
2. `apps/backend/src/modules/self-inspections/services/self-inspection-renderer.service.ts` — 수정:
   - `classification` → `CLASSIFICATION_LABELS[classification]` (`교정기기` / `비교정기기`)
   - `validityPeriod ?? '-'` (비교정기기 시 `'N/A'` 하드코딩 **제거**)
3. `apps/backend/src/modules/intermediate-inspections/services/intermediate-inspection-renderer.service.ts` — 수정:
   - 기존 '교정기기|비교정기기' 리터럴 → `CLASSIFICATION_LABELS` 사용
   - 판정 라벨 → `INSPECTION_JUDGMENT_LABELS`
4. 결재란 매핑 확인 (문서화만):
   - UL-QP-18-03: 담당=inspector, 검토=inspector, 승인=approver (현재 동일) — layout 주석에 명시
   - UL-QP-18-05: 담당=submitter, 검토=submitter, 승인=approver (현재 동일) — layout 주석에 명시

**변경 금지:**
- 서명 이미지 EMU 치수 (기존 값 유지).
- 결과 섹션 렌더(`renderResultSections`).

**검증:**
```bash
pnpm tsc --noEmit
pnpm --filter backend run test self-inspection
pnpm --filter backend run test intermediate-inspection
# 수동: 기존 wf-19b/wf-20b e2e 회귀 없음
```

## Phase 5 — Equipment Registry SSOT 매핑

**목표**: UL-QP-18-01 렌더의 enum 매핑을 전부 SSOT 라벨로 치환. 하드코딩 0건.

**변경 파일:**
1. `apps/backend/src/modules/reports/services/equipment-registry-renderer.service.ts` — 수정 (Phase 3에서 신규, 여기서 내용 확정):
   - 로컬 `MANAGEMENT_METHOD_LABELS` / `STATUS_TO_AVAILABILITY` 미사용
   - `MANAGEMENT_METHOD_LABELS` import from `@equipment-management/schemas`
   - `EQUIPMENT_AVAILABILITY_LABELS` import from `@equipment-management/schemas` (Phase 2 신규)
   - `INTERMEDIATE_CHECK_YESNO_LABELS[row.needsIntermediateCheck ? 'true' : 'false']` 사용
   - 컬럼 배열을 `COLUMNS`(layout 상수)로부터 생성해 행 쓰기
2. `apps/backend/src/modules/reports/form-template-export.service.ts` — L165~181 private static 2개 **삭제** (schemas SSOT로 이관 완료).

**변경 금지:**
- `pending_disposal` / `disposed` 의 라벨 매핑 (UL-QP-18-01 양식은 `showRetired=true` 옵션일 때 이 상태도 표시해야 함 — 기존 '불용' 라벨 유지).

**검증:**
```bash
pnpm tsc --noEmit
pnpm --filter backend run lint  # 기존 SPEC_MATCH_LABELS 경고 없음 재확인
# grep 검증 (하드코딩 0건):
grep -rn "'사용'\|'고장'\|'여분'" apps/backend/src/modules/reports/services/
# 결과: 0건 (모두 SSOT 경유)
```

## Phase 6 — 양식 파일 교체 (seed + 운영 Replace)

**목표**: 3개 신규 양식을 `docs/procedure/template/`에 반영 + DB self-heal 트리거.

**변경 파일:**
1. `docs/procedure/template/UL-QP-18-01(02) 시험설비 관리대장.xlsx` — 신규 파일로 교체 (Downloads 경로에서 복사)
   - 기존 파일명 `..._SUW_RF_20260202 (E0409...).xlsx`는 **삭제** (개발자 로컬 참고용 변종). 새 양식은 순수 템플릿이며 `formNumber` 식별만으로 매칭됨 (`form-template.service.ts` L545 `files.find((f) => f.includes(formNumber))`).
2. `docs/procedure/template/UL-QP-18-03(02) 중간점검표.docx` — 교체 (바이트 diff 검증: `diff <(xxd old) <(xxd new) | head`)
3. `docs/procedure/template/UL-QP-18-05(01) 자체점검표.docx` — 교체
4. 운영 DB 반영 경로 (문서화만, Phase 8):
   - `db:reset` 포함 개발 환경: `seedFromFilesystem` 자동 실행 → 파일 해시 달라 `storage-broken` 조건 자동 self-heal.
   - 운영 환경: `POST /api/form-templates/replace` (MANAGE_FORM_TEMPLATES 권한) + `change_summary="양식 원본 교체(2026-04-17) — 레이아웃 미변경, 내용 업데이트"`. 운영 DB 스토리지 삭제 없이 새 버전 업로드 후 revision 기록.

**변경 금지:**
- `form-template.service.ts`의 `seedFromFilesystem`/`replaceCurrentFile` 로직 (기존 동작 재사용).
- FORM_CATALOG의 `formNumber`/`name` (양식 개정번호/명 변경 시에만 수정).

**검증:**
```bash
# 바이트 비교 — 변경 확인
diff -q docs/procedure/template/UL-QP-18-03* /mnt/c/Users/kmjkd/Downloads/양식/UL-QP-18-03*
# 구조 검증 — python3 /tmp/parse-forms.py로 셀 구조 재확인
# db:reset 후 form_templates 행 확인
pnpm --filter backend run db:reset
docker compose exec postgres psql -U postgres -d equipment_management -c \
  "SELECT form_number, original_filename FROM form_templates WHERE form_number IN ('UL-QP-18-01','UL-QP-18-03','UL-QP-18-05');"
```

## Phase 7 — 시드/E2E 확장

**목표**: 새 snapshot 컬럼 + 양식 교체 + 렌더 변경을 E2E로 커버.

**변경 파일:**
1. `apps/backend/src/database/seed-data/operations/self-inspections.seed.ts` — 신규 (기존에 없음)
   - 1건 이상 — SUW-E0001 장비에 `classification: 'calibrated'`, `calibrationValidityPeriod: '1년'`, `inspectionCycle: 6`, draft 상태
   - SELF_INSPECTIONS_SEED_DATA + SELF_INSPECTION_ITEMS_SEED_DATA export
2. `apps/backend/src/database/seed-data/operations/intermediate-inspections.seed.ts` — 신규 (기존에 없음)
   - 1건 이상 — CALIB_001에 classification 'calibrated', '6개월', '1년', 점검 항목 3건
3. `apps/backend/src/database/seed-test-new.ts` — 수정: 위 seed import + INSERT 호출 추가 (Phase 순서: equipment → calibrations → NC → inspections)
4. `apps/frontend/tests/e2e/workflows/wf-20b-self-inspection-export.spec.ts` — 수정/확장:
   - 기존 테스트 유지. 신규 케이스 추가:
     - Step 4: `classification`/`calibrationValidityPeriod`를 body에 명시하여 생성 → export → docx zip 열어 T0 R3 C3에 '1년' 포함 확인
     - Step 5: record.classification='non_calibrated'로 생성 후 export → 헤더에 '비교정기기' 표시 확인, validityPeriod는 '-' (N/A 하드코딩 제거 검증)
5. `apps/frontend/tests/e2e/workflows/wf-19b-intermediate-inspection-export.spec.ts` — 수정: 판정 라벨 '합격'/'불합격' 존재 (SSOT 경유) 회귀 검증 추가
6. `apps/frontend/tests/e2e/workflows/wf-21-equipment-registry-export.spec.ts` — 신규 (기존 form-templates.spec.ts는 업로드/다운로드 PR #157 계약 보존):
   - Step 1: `GET /api/reports/export/form/UL-QP-18-01` → 200 + xlsx
   - Step 2: ExcelJS로 응답 읽어 Row 3 D열 = '외부교정' (SSOT MANAGEMENT_METHOD_LABELS), P열 ∈ {사용, 고장, 여분} (SSOT AVAILABILITY), O열 ∈ {O, X}
   - Step 3: showRetired=true → '불용' 행도 포함
7. `apps/backend/src/modules/reports/__tests__/xlsx-helper.spec.ts` — 신규: xlsx-helper 4개 함수 유닛 테스트 (loadWorkbookByName 대체명 매칭, applyRowStyles 존재 행 반환, writeDataRow 값 세팅, clearTrailingRows 빈 영역).

**변경 금지:**
- 기존 wf-19b/wf-20b Step 1~3 (회귀 검증용).
- `form-templates.spec.ts` (PR #157 계약 E2E — 업로드/다운로드 경로 보존).

**검증:**
```bash
pnpm --filter backend run db:reset
pnpm --filter backend run test xlsx-helper
pnpm --filter frontend run test:e2e -- wf-19b
pnpm --filter frontend run test:e2e -- wf-20b
pnpm --filter frontend run test:e2e -- wf-21
pnpm --filter frontend run test:e2e -- form-templates
```

## Phase 8 — 문서 갱신

**변경 파일:**
1. `docs/manual/report-export-mapping.md` — 수정:
   - §3.1 (UL-QP-18-01): SSOT 라벨 테이블 (`EQUIPMENT_AVAILABILITY_LABELS`, `MANAGEMENT_METHOD_LABELS`, `INTERMEDIATE_CHECK_YESNO_LABELS`) 명시
   - §3.3 (UL-QP-18-03): 신규 3-way 분리(data/renderer/layout) + 판정 라벨 SSOT 기록
   - §3.5 (UL-QP-18-05): classification/validityPeriod snapshot 컬럼 + fallback 규칙 + SELF_INSPECTION_RESULT_LABELS SSOT
   - §양식 교체 절차: dev(seedFromFilesystem) vs 운영(Replace API + change_summary) 두 경로 명시
2. `docs/manual/forms-index.md` — 수정: 3개 양식 "마지막 교체일: 2026-04-17" 반영
3. `docs/references/backend-patterns.md` — 수정: "DOCX 3-way 분리" 섹션에 XLSX 렌더 패턴 추가 (equipment-registry-renderer 사례). xlsx-helper 함수 목록 + FormRenderError 재사용 명시.

**변경 금지:**
- `docs/procedure/절차서/*`: 절차서 원문 수정 금지.
- `docs/procedure/양식/*.md` 양식 사양 문서: 원본 명세만 반영 (파싱 결과는 주석).

**검증:**
- 문서 렌더링 수동. 링크 유효성 검증.

## 전체 변경 파일 요약

### 신규
- `packages/schemas/src/enums/labels.ts`(수정으로 4개 상수 추가)
- `apps/backend/src/modules/intermediate-inspections/services/intermediate-inspection.layout.ts`
- `apps/backend/src/modules/intermediate-inspections/services/intermediate-inspection-export-data.service.ts`
- `apps/backend/src/modules/intermediate-inspections/services/intermediate-inspection-renderer.service.ts`
- `apps/backend/src/modules/self-inspections/services/self-inspection.layout.ts`
- `apps/backend/src/modules/self-inspections/services/self-inspection-export-data.service.ts`
- `apps/backend/src/modules/self-inspections/services/self-inspection-renderer.service.ts`
- `apps/backend/src/modules/reports/layouts/equipment-registry.layout.ts`
- `apps/backend/src/modules/reports/services/equipment-registry-data.service.ts`
- `apps/backend/src/modules/reports/services/equipment-registry-renderer.service.ts`
- `apps/backend/src/modules/reports/xlsx-helper.ts`
- `apps/backend/src/modules/reports/__tests__/xlsx-helper.spec.ts`
- `apps/backend/src/database/seed-data/operations/self-inspections.seed.ts`
- `apps/backend/src/database/seed-data/operations/intermediate-inspections.seed.ts`
- `apps/backend/drizzle/NNNN_add_self_inspection_snapshot.sql` (자동 생성)
- `apps/frontend/tests/e2e/workflows/wf-21-equipment-registry-export.spec.ts`

### 수정
- `packages/db/src/schema/equipment-self-inspections.ts` — classification + calibrationValidityPeriod
- `packages/schemas/src/dto/self-inspection.ts` — create DTO 확장
- `apps/backend/src/modules/self-inspections/self-inspections.service.ts` — snapshot 저장
- `apps/backend/src/modules/self-inspections/self-inspections.module.ts` — providers
- `apps/backend/src/modules/intermediate-inspections/intermediate-inspections.module.ts` — providers
- `apps/backend/src/modules/reports/reports.module.ts` — imports + providers
- `apps/backend/src/modules/reports/form-template-export.service.ts` — dispatcher 축소 (2168→~1400줄)
- `apps/backend/src/database/seed-test-new.ts` — inspection seed import/insert
- `apps/frontend/tests/e2e/workflows/wf-19b-intermediate-inspection-export.spec.ts` — 판정 라벨 SSOT 회귀
- `apps/frontend/tests/e2e/workflows/wf-20b-self-inspection-export.spec.ts` — classification/validityPeriod 신규 케이스
- `docs/procedure/template/UL-QP-18-01(02) 시험설비 관리대장.xlsx` — 파일 교체 (이전 긴 파일명 삭제)
- `docs/procedure/template/UL-QP-18-03(02) 중간점검표.docx` — 파일 교체
- `docs/procedure/template/UL-QP-18-05(01) 자체점검표.docx` — 파일 교체
- `docs/manual/report-export-mapping.md` — §3.1/3.3/3.5 + 교체 절차
- `docs/manual/forms-index.md` — 마지막 교체일
- `docs/references/backend-patterns.md` — XLSX 렌더 패턴 섹션

### 명시적 변경 금지
- `packages/shared-constants/src/form-catalog.ts` — 번호/이름/보존연한 유지 (절차서 원문 SSOT)
- `docs/procedure/절차서/*`, `docs/procedure/양식/*` — 절차서/양식 사양 원본 (읽기 전용)
- `apps/backend/src/modules/reports/docx-template.util.ts`, `docx-xml-helper.ts` — 기존 API 유지 (확장만)
- `apps/backend/src/modules/reports/form-template.service.ts`, `form-template.controller.ts` — 업로드/다운로드 경로 보존
- `cache-event.registry.ts`, `notification-events.ts` — 이벤트/캐시 정책 변경 없음 (신규 컬럼은 기존 invalidate 경로 재사용)
- 기존 시드 UUID 상수 — 신규 seed만 추가

## 의사결정 로그
- **2026-04-17 #1**: 자체점검 classification/validityPeriod는 DB snapshot 컬럼으로 추가 (중간점검 일관성 + drift 방지).
- **2026-04-17 #2**: 양식 파일 교체는 seedFromFilesystem(dev) + Replace API(운영) 두 경로. 개발은 자동 self-heal, 운영은 수동 감사 경로.
- **2026-04-17 #3**: xlsx 렌더는 전용 helper(xlsx-helper.ts) 신설. 한 양식뿐이지만 QP-19-01 등 장래 재사용.
- **2026-04-17 #4**: 라벨 SSOT는 schemas/enums/labels.ts (서버 전용). 프론트 UI는 i18n 메시지 경유.
- **2026-04-17 #5**: "불용"은 pending_disposal/disposed 매핑으로 유지 (기존 동작 보존, 양식에는 없지만 showRetired=true 옵션에서 노출).
- **2026-04-17 #6**: 성능 — ExcelJS writeBuffer 유지, 스트림 write 도입은 overengineering (현재 <5k행). tech-debt 감시 항목으로 등록.
- **2026-04-17 #7**: 접근성 — 신규 UI 없음. export 다운로드 버튼은 기존 UI 재사용, aria-label/focus-trap 현행 유지 확인만.
- **2026-04-17 #8**: 기존 긴 파일명 `UL-QP-18-01(02) 시험설비 관리대장_SUW_RF_20260202...xlsx`(70088 bytes)는 운영 데이터 변종 — 순수 템플릿(38222 bytes) 교체 시 삭제 필요. 운영 데이터는 소스 제어 밖에서 운영 DB로만 보관.
