# UL-QP-18-02 시험설비 이력카드 아키텍처 전면 개선

## 메타
- 생성: 2026-04-17T00:00:00+09:00
- 모드: Mode 2 (Harness)
- Slug: history-card-qp1802
- 예상 변경: 약 18~22개 파일 (프로덕션 12~14 + 테스트 3~4 + 문서 2~3 + 마이그레이션 1)
- 사전 조건: main 브랜치, pre-push hook 정상

## 설계 철학
UL-QP-18 절차서 §7.7 항목 10 "장비의 위치 변동, 교정, 유지 보수, 파손, 오작동 또는 수리 내역" + §9.9 "부적합 장비 사항 이력카드 관리"(개정 14, 2024.11.26)를 **통합 이력 섹션 1개**로 구현. 라벨·섹션·유형을 SSOT 상수로 승격하고 데이터 집계와 DOCX 렌더링을 분리하여 향후 양식 개정 시 surgical update가 가능하게 한다.

## 아키텍처 결정
| 결정 | 선택 | 근거 |
|------|------|------|
| 통합 이력 전략 | App-level Promise.all + adapter merge | 3 테이블 shape 상이, on-demand 렌더링 빈도 낮음, Drizzle baseline squash 직후 |
| approvalDate 소스 | equipment.approvedAt 컬럼 신규 (nullable) | "요청 승인"과 "장비 이력카드 승인일" 의미론 분리; 기존 EquipmentApprovalService에서 이미 approvedBy 세팅 중 — 동일 지점 1줄 |
| SSOT 위치 | form-catalog(공용) + backend 로컬 layout 파일(셀 레이아웃) | 프론트가 셀 레이아웃 미참조, 서비스 파일 매직 문자열 분리 필요 |
| 렌더링 아키텍처 | 3-way 분리 (Data/Renderer/XmlHelper) | SRP + 향후 DOCX 양식 재사용 |
| 정렬/중복 | occurredAt DESC + FK 기반 역참조 중복 제거 | 양식 통합 스토리 요구, 구체성 우선 표시 |
| S/W 소스 | equipment_test_software 조인 + firmware_version fallback | P-number 레지스트리 공식 경로 + 내장 FW |
| mainFunctions | equipment.description을 accessories와 병합 | 스키마 확장 회피, 양식 셀 구조 호환 |
| checkouts 쿼리 | 제거 | 양식에 반출 섹션 없음, 불필요한 JOIN 제거 |

## 구현 Phase

### Phase 1: DB 스키마 확장 (`equipment.approvedAt`)
**목표:** 이력카드 확인 승인일의 정확한 소스 확보.

**변경 파일:**
1. `packages/db/src/schema/equipment.ts` — 수정: `approvedAt: timestamp('approved_at')` nullable 컬럼 추가. 인덱스 없음 (조회 빈도 낮음).
2. `apps/backend/drizzle/` — 자동 생성: `pnpm --filter backend run db:generate` 산출 `NNNN_{label}.sql` 1건. 내용은 `ALTER TABLE equipment ADD COLUMN approved_at timestamp`.
3. `apps/backend/src/modules/equipment/services/equipment-approval.service.ts` — 수정: CAS update set에 `approvedAt: new Date()` 추가 (approveCreate + approveUpdate 두 분기 모두).

**변경하지 말 것:**
- `equipment_requests.approvedAt` 및 `equipmentImports.approvedAt`: 의미론 다름 (요청 레벨). 유지.
- 기존 seed data: backfill 금지 — null 유지 + 서비스 fallback.

**검증:**
```
pnpm --filter backend run db:generate   # 마이그레이션 산출 확인
pnpm --filter backend run db:reset      # 초기화 + 마이그레이션 적용
pnpm tsc --noEmit
```

### Phase 2: SSOT 레이어 — 양식 메타데이터 + 통합 이력 도메인 타입
**목표:** 매직 문자열/숫자를 한 곳에 정의하고 역추적 주석으로 양식 원본과 연결.

**변경 파일:**
1. `apps/backend/src/modules/equipment/services/history-card.layout.ts` — 신규: 아래 상수를 export. 각 상수에 `@see docs/procedure/양식/QP-18-02_시험설비이력카드.md` + "원본 docx의 실제 텍스트" 주석.
   - `FORM_NUMBER: 'UL-QP-18-02'`
   - `CELL_LABELS` (유니코드 공백 포함된 실제 docx 텍스트 fragment): `관리번호`, `자산번호`, `장비명`, `부속품&주요기능`, `제조사명`, `제조사연락처`, `공급사`, `공급사연락처`, `일련번호`, `운영책임자정`, `교정주기`, `운영책임자부`, `최초설치위치`, `설치일시`, `확인장비명`, `시방일치체크`, `교정필요체크`, `보관장소`, `승인일구분자` 등.
   - `SECTIONS`: `{ LOCATION: {title:'장비 위치 변동 이력', headerSkip:2, emptyRows:5, columns:3}, CALIBRATION: {...emptyRows:9, columns:3}, MAINTENANCE: {...emptyRows:8, columns:2}, UNIFIED_INCIDENT: {title:'장비 손상, 오작동', headerSkip:2, emptyRows:8, columns:2} }`. emptyRows 숫자는 양식 원본 검증 후 확정.
   - `CHECKBOX_PATTERNS`: `SPEC_MATCH: { template:'□일치   □불일치', checked_match:'■일치   □불일치', checked_mismatch:'□일치   ■불일치' }`, `CALIBRATION_REQUIRED`: 동일 패턴.
   - `DATE_FORMAT: 'YYYY/MM/DD'` (QP-18-02 전용).
2. `apps/backend/src/modules/equipment/services/equipment-timeline.types.ts` — 신규: `TimelineEntry` 공통 인터페이스 — `{ occurredAt: Date, type: TimelineEntryType, label: string, content: string, sourceTable: 'incident'|'repair'|'non_conformance', sourceId: string, crossRef?: {table, id} }`.
3. `packages/schemas/src/equipment-history.ts` — 수정: `TimelineEntryTypeEnum` 신규 export — IncidentTypeEnum + `['non_conformance']` 합성.
4. `packages/schemas/src/enums/labels.ts` — 수정: `TIMELINE_ENTRY_TYPE_LABELS` 추가.
5. `apps/backend/src/modules/equipment/services/history-card.service.ts` 기존 하드코딩 라벨 맵 4개(L32-53) — **삭제**. schemas의 `SPEC_MATCH_LABELS`/`CALIBRATION_REQUIRED_LABELS`/`MANAGEMENT_METHOD_LABELS`/`CALIBRATION_RESULT_LABELS`로 교체 (Rule 0).

**변경하지 말 것:**
- `packages/shared-constants/src/form-catalog.ts`의 FORM_CATALOG: 번호/이름/보존연한/dedicatedEndpoint 플래그 유지. 셀 레이아웃은 넣지 않음 (프론트 불필요).

**검증:**
```
pnpm tsc --noEmit
# 수동: history-card.layout.ts의 각 상수에 양식 원본 주석이 있는지 검토
```

### Phase 3: 통합 이력 서비스 (incident + repair + NC merge)
**목표:** 세 테이블을 TimelineEntry[]로 정규화하여 DESC 정렬 + 중복 제거.

**변경 파일:**
1. `apps/backend/src/modules/equipment/services/equipment-timeline.service.ts` — 신규. 책임:
   - `getTimeline(equipmentId, limit): Promise<TimelineEntry[]>` — `Promise.all` 3 쿼리 + 각 row를 어댑터로 변환.
   - 어댑터: `incidentToTimelineEntry`, `repairToTimelineEntry`, `ncToTimelineEntry`.
   - 중복 제거 규칙: `incident.non_conformance_id === nc.id` → NC 스킵. `nc.repair_history_id === repair.id` → NC 스킵 (repair가 더 구체적).
   - 정렬: `occurredAt` DESC. Tie-breaker는 sourceTable 우선순위 (incident > repair > nc).
   - `HISTORY_CARD_QUERY_LIMIT` 적용.
2. `apps/backend/src/modules/equipment/equipment.module.ts` — 수정: `EquipmentTimelineService` providers 등록.
3. `apps/backend/src/modules/equipment/services/__tests__/equipment-timeline.service.spec.ts` — 신규: 유닛 테스트 ≥ 4개.

**변경하지 말 것:**
- `equipment-history.service.ts`의 개별 get{Location,Maintenance,Incident}History 메서드: UI 상세 페이지 페이지네이션 이력 용도. 건드리지 않음.

**검증:**
```
pnpm --filter backend run test equipment-timeline.service
pnpm tsc --noEmit
```

### Phase 4: History Card Data Service (집계 책임 분리)
**목표:** 기존 850줄 서비스에서 데이터 집계만 분리.

**변경 파일:**
1. `apps/backend/src/modules/equipment/services/history-card-data.service.ts` — 신규. `HistoryCardService.aggregateData()`(L190-390)를 이관 + 개선:
   - **checkouts 쿼리 삭제**.
   - `equipment_test_software` + `test_software` 조인 쿼리 추가.
   - `description` + `accessories`를 "부속품 & 주요기능" 셀에 병합.
   - S/W 정보를 `manual_location`과 함께 "관련 S/W 및 매뉴얼" 셀에 병합.
   - approvalDate = `approvedAt ?? updatedAt` fallback.
   - `incidentHistory`/`repairs`/`nonConformances` 3개 컬렉션 제거 → 단일 `timeline: TimelineEntry[]`.
   - `HistoryCardData` 인터페이스를 새 shape로 교체.
2. `apps/backend/src/modules/equipment/equipment.module.ts` — 수정: providers 등록.

**검증:**
```
pnpm tsc --noEmit
pnpm --filter backend run test -- history-card-data
```

### Phase 5: History Card Renderer + DocxXmlHelper
**목표:** DOCX 주입 로직을 순수 함수형으로 추출 + XML 유틸 공용화.

**변경 파일:**
1. `apps/backend/src/modules/reports/docx-xml-helper.ts` — 신규 (reports 모듈):
   - `findRowByLabel`, `injectIntoEmptyCell`, `fillSectionEmptyRows`, `replaceFirst`, `addImageRelationship`, `buildInlineDrawingXml`
   - 실패 시 `FormRenderError` 구조화 예외 throw.
2. `apps/backend/src/modules/equipment/services/history-card-renderer.service.ts` — 신규:
   - `render(data, templateBuf): Promise<Buffer>`
   - `layout.ts` 상수 참조.
   - `timeline`을 `[formatDate(entry.occurredAt), '[{label}] {content}']`로 UNIFIED_INCIDENT 섹션에 주입.
   - graceful fallback 유지.
3. `apps/backend/src/modules/equipment/services/history-card.service.ts` — **대폭 축소** (orchestrator):
   - 850줄 → ~40줄.
4. `apps/backend/src/modules/equipment/equipment.module.ts` — 수정.
5. `apps/backend/src/modules/reports/reports.module.ts` — 수정: `DocxXmlHelper` export.

**변경하지 말 것:**
- 템플릿 원본 docx 바이너리.
- EMU 치수(사진 4320000×3240000, 서명 900000×540000).

**검증:**
```
pnpm --filter backend run build
pnpm tsc --noEmit
pnpm --filter backend run test history-card
```

### Phase 6: 이벤트/캐시 무효화 일관성
**목표:** repair 변경 시 장비 상세 캐시 무효화 일관성 확보.

**변경 파일:**
1. `apps/backend/src/modules/equipment/services/repair-history.service.ts` — 수정: 생성자에 `CacheInvalidationHelper` 주입, create/update/delete 끝에서 `invalidateAfterEquipmentUpdate(equipmentId, false, false)` 호출.
2. `apps/backend/src/modules/equipment/equipment.module.ts` — 수정: DI 확인.

**변경하지 말 것:**
- `cache-event.registry.ts`: 기존 규칙 유지.
- `notification-events.ts`: 신규 이벤트 추가 범위 외.

**검증:**
```
pnpm tsc --noEmit
pnpm --filter backend run test repair-history
```

### Phase 7: 시드 데이터 보강 + E2E 테스트 강화
**목표:** 통합 섹션 검증을 e2e에서 확정 PASS.

**변경 파일:**
1. `apps/backend/src/database/seed-data/history/repair-history.seed.ts` — SUW-E0001에 repair 1건 추가.
2. `apps/backend/src/database/seed-data/history/non-conformances.seed.ts` — SUW-E0001에 NC 1건 추가 (`repairHistoryId`로 위 repair와 1:1 연결 → 중복 제거 규칙 검증).
3. `apps/backend/test/history-card-export.e2e-spec.ts` — 신규 검증 추가:
   - repair 텍스트 포함 확인
   - NC가 별도 행으로 나오지 않음 (중복 제거)
   - incident 유형 라벨 prefix 포함
   - "부속품 & 주요기능" 병합 확인
   - S/W 정보 포함
   - approvalDate ≠ updatedAt
4. `apps/frontend/tests/e2e/workflows/wf-history-card-export.spec.ts` — 유형 라벨 검증 추가.

**검증:**
```
pnpm --filter backend run db:reset
pnpm --filter backend run test:e2e -- history-card-export
pnpm --filter frontend run test:e2e -- wf-history-card-export
```

### Phase 8: 문서 갱신
**목표:** report-export-mapping.md 섹션 3.2를 새 shape로 갱신.

**변경 파일:**
1. `docs/manual/report-export-mapping.md` — §3.2 갱신.
2. `docs/references/backend-patterns.md` — DOCX 분리 아키텍처 섹션 신설.

**검증:**
```
# 문서 렌더링 수동 확인. 링크 유효성 검증.
```

## 전체 변경 파일 요약

### 신규 생성
| 파일 | 목적 |
|---|---|
| `apps/backend/src/modules/equipment/services/history-card.layout.ts` | 셀 라벨/섹션/유형 SSOT (backend 로컬) |
| `apps/backend/src/modules/equipment/services/equipment-timeline.types.ts` | TimelineEntry 공통 타입 |
| `apps/backend/src/modules/equipment/services/equipment-timeline.service.ts` | 3 테이블 통합 + 중복 제거 |
| `apps/backend/src/modules/equipment/services/history-card-data.service.ts` | 집계 책임 |
| `apps/backend/src/modules/equipment/services/history-card-renderer.service.ts` | DOCX 주입 책임 |
| `apps/backend/src/modules/reports/docx-xml-helper.ts` | 범용 DOCX XML 유틸 |
| `apps/backend/src/modules/equipment/services/__tests__/equipment-timeline.service.spec.ts` | 유닛 테스트 |
| `apps/backend/drizzle/NNNN_*.sql` | approvedAt 마이그레이션 (자동 생성) |

### 수정
| 파일 | 변경 의도 |
|---|---|
| `packages/db/src/schema/equipment.ts` | `approvedAt` 컬럼 추가 |
| `packages/schemas/src/equipment-history.ts` | TimelineEntryType SSOT |
| `packages/schemas/src/enums/labels.ts` | TIMELINE_ENTRY_TYPE_LABELS 추가 |
| `apps/backend/src/modules/equipment/services/equipment-approval.service.ts` | `equipment.approvedAt` 세팅 1줄 |
| `apps/backend/src/modules/equipment/services/history-card.service.ts` | orchestrator로 축소 (~40줄) |
| `apps/backend/src/modules/equipment/services/repair-history.service.ts` | cache invalidation 주입 |
| `apps/backend/src/modules/equipment/equipment.module.ts` | 신규 서비스 providers 등록 |
| `apps/backend/src/modules/reports/reports.module.ts` | DocxXmlHelper export |
| `apps/backend/src/database/seed-data/history/repair-history.seed.ts` | SUW-E0001 repair 1건 |
| `apps/backend/src/database/seed-data/history/non-conformances.seed.ts` | SUW-E0001 NC 1건 (repair FK 연결) |
| `apps/backend/test/history-card-export.e2e-spec.ts` | 통합 이력 + 유형 라벨 검증 |
| `apps/frontend/tests/e2e/workflows/wf-history-card-export.spec.ts` | 유형 라벨 검증 |
| `docs/manual/report-export-mapping.md` | §3.2 갱신 |
| `docs/references/backend-patterns.md` | DOCX 분리 아키텍처 섹션 |

### 명시적 변경 금지
- `packages/shared-constants/src/form-catalog.ts` (공용 메타 유지, 레이아웃 미포함)
- `docs/procedure/절차서/*`, `docs/procedure/양식/*` (절차서 원문 읽기 전용)
- `form-templates/UL-QP-18-02/*.docx` 바이너리
- `cache-event.registry.ts`, `notification-events.ts` (이벤트 확장 범위 외)
- `equipment-history.controller.ts` (엔드포인트 signature 유지)
- 기존 시드 UUID 상수 (신규만 추가)

## 의사결정 로그
- **2026-04-17 #1**: 통합 이력 전략 B (app-level merge). VIEW는 baseline squash 직후 cost 과다. CQRS 오버엔지니어링.
- **2026-04-17 #2**: approvalDate는 A (equipment.approvedAt 컬럼). audit_logs 의존 회피, approvals 모듈 의미론 불일치. fallback으로 legacy 데이터 graceful.
- **2026-04-17 #3**: SSOT는 하이브리드. form-catalog 공용 유지 + backend 로컬 layout 파일. 프론트 미참조.
- **2026-04-17 #4**: 렌더링 B (3-way 분리). docxtemplater는 양식 원본 유지 원칙 위반.
- **2026-04-17 #5**: 통합 섹션 중복 제거는 FK 역참조 기반. repair > incident > NC 구체성 우선.
- **2026-04-17 #6**: S/W는 test_software 우선 + firmware fallback. 양쪽 다 있으면 병합.
- **2026-04-17 #7**: mainFunctions는 description 재사용 + accessories와 개행 병합. 스키마 확장 회피.
- **2026-04-17 보강**: checkouts 쿼리 제거 (양식에 반출 섹션 없음). 불필요 JOIN 제거.
- **2026-04-17 보강**: 이벤트 신규(REPAIR_*) 추가 없음. 기존 invalidateAfterEquipmentUpdate로 충분.
